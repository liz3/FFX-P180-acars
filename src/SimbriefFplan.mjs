import {
  FacilityType,
  FlightPlanRouteManager,
  FlightPlanRouteUtils,
  ICAO,
  RunwayUtils,
} from "@microsoft/msfs-sdk";

const SIMBRIEF_ID_KEY = "h800xp_acars_simbrief_id";

/** SimBrief navlog fix types mapped to their ICAO facility type letter. */
const SB_TYPE_TO_ICAO_TYPE = {
  apt: "A",
  ndb: "N",
  vor: "V",
  wpt: "W",
  ltlg: "",
};

/** SimBrief `atc.flight_rules` values that mean the flight starts VFR. */
const VFR_FLIGHT_RULES = ["V", "Z"];

/** Navlog entries that are OFP artefacts rather than real fixes. */
const PSEUDO_FIXES = ["TOC", "TOD"];

/**
 * Airways SimBrief may reference that do not exist as airways in the nav
 * database (oceanic tracks are published daily and are not in the AIRAC).
 */
const isLoadableAirway = (via) =>
  !!via && via !== "DCT" && via.length <= 7 && !/^NAT[A-Z]$/.test(via);

/** The SimBrief JSON mirrors its XML, so a single child element is not an array. */
const asArray = (value) => (Array.isArray(value) ? value : value ? [value] : []);

/**
 * Reads the SimBrief pilot ID / username the user configured on the FMC
 * settings page.
 * @returns {string | null} The stored identifier, or null if none is set.
 */
export const getSimbriefId = () => {
  const id = GetStoredData(SIMBRIEF_ID_KEY);
  return id && id.length ? id.toString() : null;
};

/**
 * Fetches the user's most recent OFP from SimBrief.
 * @param {string} [id] SimBrief pilot ID or username. Defaults to the stored one.
 * @returns {Promise<object>} The parsed OFP.
 * @throws {Error} If no ID is configured, the request fails, or SimBrief
 * reports an error (no OFP generated yet, unknown user, ...).
 */
export const fetchSimbriefOfp = async (id = getSimbriefId()) => {
  if (!id) throw new Error("NO SIMBRIEF ID");

  // Numeric values are pilot IDs, anything else is treated as a username.
  const param = /^\d+$/.test(id) ? "userid" : "username";
  const url = `https://www.simbrief.com/api/xml.fetcher.php?json=1&${param}=${encodeURIComponent(id)}`;

  let ofp;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    ofp = await response.json();
  } catch (err) {
    throw new Error(`SIMBRIEF FETCH FAIL: ${err.message}`);
  }

  const status = ofp.fetch.status;
  if (status && status !== "Success") throw new Error(`SIMBRIEF: ${status}`);
  if (!ofp.general || !ofp.origin || !ofp.destination)
    throw new Error("SIMBRIEF: NO OFP DATA");

  return ofp;
};

const airportIcaoValue = (ident) => ICAO.value("A", "", "", ident);


const resolveFixIcao = async (facLoader, fix) => {
  console.log("resolve fix", fix)
  const type = SB_TYPE_TO_ICAO_TYPE[fix.type];
  if (!type) return null;

  // SimBrief reports ARINC "ENRT" for enroute fixes; terminal fixes carry the
  // ident of the airport they belong to, which is what the ICAO airport field
  // expects.
  const icao = ICAO.value(
    type,
    fix.icao_region || "",
    fix.region_code && typeof fix.region_code === "string" && fix.region_code !== "ENRT" ? fix.region_code : "",
    fix.ident,
  );

  try {
    console.log(ICAO.getFacilityTypeFromValue(icao), icao)
    const facility = await facLoader.tryGetFacility(
      ICAO.getFacilityTypeFromValue(icao),
      icao,
    );
    return facility ? icao : null;
  } catch (err) {
    return null;
  }
};


const procedureOfFix = (fix, general) => {
  if (general.sid_ident && fix.via_airway === general.sid_ident) return "sid";
  if (general.star_ident && fix.via_airway === general.star_ident) return "star";
  if (fix.is_sid_star !== "1") return null;
  return fix.stage === "DSC" ? "star" : "sid";
};
const classifyFix = (fix, index, navlog, general, loaded, hasEnrouteLeg, useAirways) => {
  if (fix.type === "apt") return null;
  if (PSEUDO_FIXES.includes(fix.ident)) return null;

  const procedure = procedureOfFix(fix, general);
  if (procedure) {
    // The route loader strings procedures out of the nav database. Repeating
    // their fixes here makes it try to fly an airway named after the procedure,
    // starting from the fix that procedure already ended at.
    if (loaded[procedure]) return null;
    // The procedure is not in the database. Keep its fixes so the route is still
    // flown, but as direct legs - a procedure name is not an airway.
    return { via: "" };
  }

  if (general.sid_trans && fix.ident === general.sid_trans) return null;
  if (
    general.star_trans &&
    fix.ident === general.star_trans &&
    fix.via_airway === "DCT"
  )
    return null;

  // Every fix is its own direct leg, so the airway's shape is kept even though
  // the airway itself is not named.
  if (!useAirways) return { via: "" };

  // The first enroute leg is emitted as a direct so the first airway has a plain
  // enroute fix in front of it rather than the departure procedure.
  if (!hasEnrouteLeg) return { via: "" };

  // A leg carries the airway it is reached by, so only an airway's exit fix is
  // needed; drop the fixes inside it.
  if (fix.via_airway !== "DCT" && navlog[index + 1] && fix.via_airway === navlog[index + 1].via_airway)
    return null;

  return { via: isLoadableAirway(fix.via_airway) ? fix.via_airway : "" };
};


export const ofpToFlightPlanRoute = async (ofp, facLoader, options = {}) => {
  const { useAirways = false } = options;
  const route = FlightPlanRouteUtils.emptyRoute();
  const warnings = [];
  const { general } = ofp;
  const navlog = asArray(ofp.navlog.fix);

  const departure = await facLoader.tryGetFacility(
    FacilityType.Airport,
    airportIcaoValue(ofp.origin.icao_code || ofp.origin.faa_code),
  );
  const destination = await facLoader.tryGetFacility(
    FacilityType.Airport,
    airportIcaoValue(ofp.destination.icao_code || ofp.destination.faa_code),
  );
  if (departure) {
    route.departureAirport = departure.icaoStruct;
    // Only name a procedure the database actually has - the loader silently
    // falls back to a plain origin/destination otherwise.
    if (general.sid_ident) {
      if (departure.departures && departure.departures.find((dep) => dep.name === general.sid_ident)) {
        route.departure = general.sid_ident;
        route.departureTransition = general.sid_trans && typeof general.sid_trans === "string" ? general.sid_trans : "";
      } else {
        warnings.push(`SID ${general.sid_ident} NOT IN DB`);
      }
    }

    const runway = RunwayUtils.matchOneWayRunwayFromDesignation(
      departure,
      ofp.origin.plan_rwy,
    );
    if (runway) {
      RunwayUtils.getIdentifierFromOneWayRunway(runway, route.departureRunway);
    } else if (ofp.origin.plan_rwy) {
      warnings.push(`DEP RWY ${ofp.origin.plan_rwy} NOT IN DB`);
    }
  } else {
    route.departureAirport = { __Type: "JS_ICAO", type: "A", region: "", airport: "", ident: ofp.origin.icao_code || ofp.origin.faa_code } 
    warnings.push(`${ofp.origin.icao_code} NOT IN DB`);
  }

  if (destination) {
    route.destinationAirport = destination.icaoStruct;

    if (general.star_ident) {
      if (destination.arrivals && destination.arrivals.find((arr) => arr.name === general.star_ident)) {
        route.arrival = general.star_ident;
        route.arrivalTransition = general.star_trans && typeof general.star_trans === "string" ? general.star_trans : "";
      } else {
        warnings.push(`STAR ${general.star_ident} NOT IN DB`);
      }
    }

    const runway = RunwayUtils.matchOneWayRunwayFromDesignation(
      destination,
      ofp.destination.plan_rwy,
    );
    if (runway) {
      RunwayUtils.getIdentifierFromOneWayRunway(runway, route.destinationRunway);
    } else if (ofp.destination.plan_rwy) {
      warnings.push(`DEST RWY ${ofp.destination.plan_rwy} NOT IN DB`);
    }
  } else {
    route.destinationAirport = { __Type: "JS_ICAO", type: "A", region: "", airport: "", ident: ofp.destination.icao_code || ofp.destination.faa_code } 
    warnings.push(`${ofp.destination.icao_code} NOT IN DB`);
  }

  if (!departure && !destination) throw new Error("AIRPORTS NOT IN DB");

  const loaded = { sid: route.departure !== "", star: route.arrival !== "" };

  for (const [index, fix] of navlog.entries()) {
    const classification = classifyFix(
      fix,
      index,
      navlog,
      general,
      loaded,
      route.enroute.length > 0,
      useAirways,
    );
    if (!classification) continue;

    const leg = FlightPlanRouteUtils.emptyEnrouteLeg();
    const icao = await resolveFixIcao(facLoader, fix);
    
    if (icao) {
      leg.icaoStruct = icao;
      leg.fixIcao = icao;
      leg.via = classification.via;
    } else {

      leg.hasLatLon = true;
      leg.lat = Number.parseFloat(fix.pos_lat);
      leg.lon = Number.parseFloat(fix.pos_long);
      leg.name = fix.ident || "";
      warnings.push(`${fix.ident} AS LAT/LON`);
    }

    route.enroute.push(leg);
  }

  const cruiseAltitude = Number.parseInt(general.initial_altitude, 10);
  if (Number.isFinite(cruiseAltitude)) {

    route.cruiseAltitude = {
      __Type: "JS_FlightAltitude",
      altitude: cruiseAltitude,
      isFlightLevel: false,
    };
  }

  route.isVfr = VFR_FLIGHT_RULES.includes(ofp.atc.flight_rules);

  return { route, warnings };
};


export const loadSimbriefFlightPlan = async (facLoader, options = {}) => {
  const { id, sendToEfb = true, fileWithAtc = true, useAirways = false } = options;

  let ofp;
  let route;
  let warnings;

  try {
    ofp = (await fetchSimbriefOfp(id));
    ({ route, warnings } = await ofpToFlightPlanRoute(ofp, facLoader, { useAirways }));
  } catch (err) {
    console.error("SimBrief flight plan uplink failed", err);
    return { ok: false, error: err.message, ofp };
  }

  if (FlightPlanRouteUtils.isRouteEmpty(route, false))
    return { ok: false, error: "EMPTY ROUTE", ofp, route, warnings };

  try {
    const manager = await FlightPlanRouteManager.getManager();
    await manager.sendRouteToAvionics(route);
    if (sendToEfb) await manager.sendRouteToEfb(route);
    if (fileWithAtc) await manager.fileRouteWithAtc(route);
  } catch (err) {
    console.error("SimBrief flight plan uplink failed", err);
    return { ok: false, error: `UPLINK FAIL: ${err.message}`, ofp, route, warnings };
  }

  return { ok: true, ofp, route, warnings };
};

export default loadSimbriefFlightPlan;
