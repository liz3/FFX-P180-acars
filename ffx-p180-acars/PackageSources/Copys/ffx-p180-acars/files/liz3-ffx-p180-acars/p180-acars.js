
       function require(m) {
         const MODS = {
          "@microsoft/msfs-sdk": window.msfssdk,
          "@microsoft/msfs-wt21-fmc": window.wt21_fmc,
          "@microsoft/msfs-wt21-shared": window.msfswt21shared
         }
        if(MODS[m])
          return MODS[m];
         throw new Error(`Unknown module ${m}`);
       }
    
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // src/app.mjs
  var import_msfs_sdk23 = __require("@microsoft/msfs-sdk");
  var import_msfs_wt21_fmc21 = __require("@microsoft/msfs-wt21-fmc");

  // src/SettingsExtension.mjs
  var import_msfs_wt21_fmc = __require("@microsoft/msfs-wt21-fmc");
  var import_msfs_sdk = __toESM(__require("@microsoft/msfs-sdk"), 1);
  var AcarsSettingsExtension = class extends import_msfs_sdk.AbstractFmcPageExtension {
    constructor(page) {
      super(page);
      this.simbriefId = import_msfs_sdk.Subject.create(GetStoredData("h800xp_acars_simbrief_id"));
      this.hoppieId = import_msfs_sdk.Subject.create(GetStoredData("h800xp_acars_hoppie_code"));
      this.cduSetting = import_msfs_sdk.Subject.create(
        GetStoredData("h800xp_acars_winwing_setting") === "true" ? 1 : 0
      );
      this.codeVisibility = import_msfs_sdk.Subject.create(0);
      this.networkOptions = ["HOPPIE", "SAYI.AI", "BATC"];
      this.networkOption = import_msfs_sdk.Subject.create(
        GetStoredData("h800xp_acars_network_setting") ? this.networkOptions.indexOf(
          GetStoredData("h800xp_acars_network_setting").toUpperCase()
        ) : 0
      );
      this.cduSwitch = new import_msfs_sdk.default.SwitchLabel(page, {
        optionStrings: ["OFF", "ON"],
        activeStyle: "green"
      }).bind(this.cduSetting);
      this.codeVisibilitySwitch = new import_msfs_sdk.default.SwitchLabel(page, {
        optionStrings: ["OFF", "ON"],
        activeStyle: "green"
      }).bind(this.codeVisibility);
      this.networkSwitch = new import_msfs_sdk.default.SwitchLabel(page, {
        optionStrings: this.networkOptions,
        activeStyle: "green"
      }).bind(this.networkOption);
      this.networkOption.sub((v) => {
        SetStoredData("h800xp_acars_network_setting", this.networkOptions[v]);
        page.bus.getPublisher().pub("h800xp_acars_network_setting", this.networkOptions[v], true, false);
      });
      this.cduSetting.sub((v) => {
        SetStoredData("h800xp_acars_winwing_setting", v === 1 ? "true" : "false");
        page.bus.getPublisher().pub("h800xp_acars_winwing_setting", v === 1, true, false);
      });
      this.simbriefField = new import_msfs_sdk.default.TextInputField(page, {
        formatter: new import_msfs_wt21_fmc.StringInputFormat({ nullValueString: "-----" }),
        onSelected: async (scratchpadContents) => {
          if (scratchpadContents.length) {
            SetStoredData("h800xp_acars_simbrief_id", scratchpadContents.toString());
            this.simbriefId.set(scratchpadContents);
            page.bus.getPublisher().pub("simbrief_id", scratchpadContents, true, false);
          }
          return Promise.resolve(null);
        },
        onDelete: async () => {
          SetStoredData("h800xp_acars_simbrief_id", null);
          page.bus.getPublisher().pub("simbrief_id", "");
          this.simbriefId.set("");
          return true;
        },
        prefix: ""
      }).bind(this.simbriefId);
      this.hoppieField = new import_msfs_sdk.default.TextInputField(page, {
        formatter: {
          nullValueString: "-----",
          format: (v) => this.codeVisibility.get() ? v : "X".repeat(v.length)
        },
        onSelected: (scratchpadContents) => {
          return new Promise((resolve) => {
            const currentVis = this.codeVisibility.get();
            const id = `${Date.now()}--hoppie-input`;
            const input = document.createElement("input");
            input.style.display = "absolute";
            let s = false;
            input.addEventListener("input", (event) => {
              const v = event.target.value;
              this.codeVisibility.set(currentVis);
              SetStoredData("h800xp_acars_hoppie_code", v);
              this.hoppieId.set(v);
              page.bus.getPublisher().pub("hoppie_code", v);
              s = true;
              event.target.blur();
              event.target.remove();
              Coherent.trigger("UNFOCUS_INPUT_FIELD", id);
              resolve("");
            });
            input.addEventListener("blur", (event) => {
              if (s) return;
              this.hoppieId.set("");
              event.target.blur();
              event.target.remove();
              Coherent.trigger("UNFOCUS_INPUT_FIELD", id);
              this.codeVisibility.set(currentVis);
              resolve("");
            });
            document.body.appendChild(input);
            input.focus();
            Coherent.trigger("FOCUS_INPUT_FIELD", id, "", "", "", false);
            this.codeVisibility.set(1);
            this.hoppieId.set("PASTE NOW");
          });
        },
        onDelete: async () => {
          SetStoredData("h800xp_acars_hoppie_code", null);
          page.bus.getPublisher().pub("hoppie_code", "");
          this.hoppieId.set("");
          return true;
        },
        prefix: ""
      }).bind(this.hoppieId);
    }
    onPageRendered(renderedTemplates) {
      renderedTemplates[0][5] = [" NETWORK[blue]"];
      renderedTemplates[0][6] = [this.networkSwitch];
      renderedTemplates[0][7] = [" SIMBRIEF ID[blue]", "WINWING CDU[blue]"];
      renderedTemplates[0][8] = [this.simbriefField, this.cduSwitch];
      renderedTemplates[0][9] = ["", "SHOW CODE[blue]"];
      renderedTemplates[0][10] = ["", this.codeVisibilitySwitch];
      renderedTemplates[0][11] = [" LOGON CODE[blue]"];
      renderedTemplates[0][12] = [this.hoppieField];
    }
  };
  var SettingsExtension_default = AcarsSettingsExtension;

  // src/CduRenderer.mjs
  var MF_CAPT_URL = "ws://localhost:8320/winwing/cdu-captain";
  var MF_FO_URL = "ws://localhost:8320/winwing/cdu-co-pilot";
  var MF_CDU_ROWS = 14;
  var MF_CDU_COLS = 24;
  var MfCharSize = Object.freeze({
    Large: 0,
    Small: 1
  });
  var MfColour = Object.freeze({
    Amber: "a",
    Brown: "o",
    Cyan: "c",
    Green: "g",
    Grey: "e",
    Khaki: "k",
    Magenta: "m",
    Red: "r",
    White: "w",
    Yellow: "y"
  });
  var CduRenderer = class {
    constructor(renderer, binder) {
      this.renderer = renderer;
      this.binder = binder;
      this.active = GetStoredData("h800xp_acars_winwing_setting") === "true";
      this.rowData = Array.from({ length: MF_CDU_ROWS * MF_CDU_COLS }, () => []);
      this.socketUri = !!this.binder.isPrimaryInstrument ? MF_CAPT_URL : MF_FO_URL;
      this.binder.bus.getSubscriber().on("simTime").atFrequency(4).handle(() => this.update());
      this.binder.bus.getSubscriber().on("h800xp_acars_winwing_setting").handle((v) => {
        this.active = v;
        if (!this.active) {
          if (this.socket) {
            try {
              this.socket.close();
            } catch (err) {
            }
            this.socket = null;
          }
        } else {
          this.connect();
        }
      });
      const oldRenderToDom = renderer.renderToDom.bind(renderer);
      renderer.renderToDom = (...args) => {
        oldRenderToDom(...args);
        this.needsUpdate = true;
      };
      this.charMap = {
        "\xA0": " ",
        "\u25A1": "\u2610",
        "\u2B26": "\xB0"
      };
      this.charRegex = new RegExp(`[${Object.keys(this.charMap).join("")}]`);
      this.colourMap = /* @__PURE__ */ new Map([
        ["blue", MfColour.Cyan],
        ["green", MfColour.Green],
        ["disabled", MfColour.Grey],
        ["magenta", MfColour.Magenta],
        ["yellow", MfColour.Yellow],
        ["white", MfColour.White]
      ]);
      if (this.active)
        this.connect();
    }
    connect() {
      this.socket = new WebSocket(this.socketUri);
      this.socket.onerror = () => {
        try {
          this.socket.close();
        } catch (err) {
        }
        if (this.active)
          setTimeout(() => {
            this.connect();
          }, 5e3);
      };
      this.socket.onopen = () => {
        this.needsUpdate = true;
      };
    }
    update() {
      if (!this.needsUpdate) return;
      this.needsUpdate = false;
      for (let r = 0; r < this.renderer.options.screenCellHeight && r < MF_CDU_ROWS; r++) {
        for (let c = 0; c < this.renderer.options.screenCellWidth && c < MF_CDU_COLS; c++) {
          this.copyWtColDataToOutput(r, c);
        }
      }
      if (this.isScratchpadBlank()) {
        const bottomMessage = this.getBottomMessage();
        let outputIndex = this.getFirstScratchpadIndex();
        for (let i = 0; i < bottomMessage.length; i++, outputIndex++) {
          this.rowData[outputIndex][0] = bottomMessage[i];
        }
      }
      if (this.socket && this.socket.readyState === 1) {
        this.socket.send(
          JSON.stringify({ Target: "Display", Data: this.rowData })
        );
      }
    }
    copyWtColDataToOutput(rowIndex, colIndex) {
      const outputIndex = rowIndex * MF_CDU_COLS + colIndex;
      const cellData = this.renderer.columnData[rowIndex][colIndex];
      this.rowData[outputIndex][0] = cellData.content.replace(
        this.charRegex,
        (c) => this.charMap[c]
      );
      this.rowData[outputIndex][1] = this.getColour(cellData);
      this.rowData[outputIndex][2] = rowIndex % 2 === 1 && rowIndex !== MF_CDU_ROWS - 1 || cellData.styles.includes("s-text") ? MfCharSize.Small : MfCharSize.Large;
    }
    getBottomMessage() {
      if (!this.renderer) {
        return "";
      }
      const row = this.renderer.options.screenCellHeight - 1;
      return this.renderer.columnData[row].reduce((msg, cell) => msg += cell.content, "").replace(/EXEC$/, "").trim();
    }
    getFirstScratchpadIndex() {
      return (MF_CDU_ROWS - 1) * MF_CDU_COLS + 1;
    }
    isScratchpadBlank() {
      const firstScratchpadIndex = this.getFirstScratchpadIndex();
      const lastScratchpadIndex = firstScratchpadIndex + MF_CDU_COLS - 2;
      for (let i = firstScratchpadIndex; i < lastScratchpadIndex; i++) {
        if (this.rowData[i] && this.rowData[i][0] != " ") {
          return false;
        }
      }
      return true;
    }
    getColour(cellData) {
      for (let k of this.colourMap.keys()) {
        if (cellData.styles.includes(k)) {
          return this.colourMap.get(k);
        }
      }
      return MfColour.White;
    }
  };
  var CduRenderer_default = CduRenderer;

  // src/AcarsService.mjs
  var import_msfs_wt21_shared = __toESM(__require("@microsoft/msfs-wt21-shared"), 1);

  // src/Hoppie.mjs
  var parseMessages = (input) => {
    const messagePattern = /\{(\w+)\s+(\w+)\s+\{([^}]+)\}\}/g;
    let match;
    const messages = [];
    while ((match = messagePattern.exec(input)) !== null) {
      const message = {
        ts: Date.now(),
        from: match[1],
        type: match[2],
        payload: match[3]
      };
      if (message.type === "cpdlc" || message.type === "telex") {
        const parts = message.payload.split("/");
        if (message.type === "cpdlc") {
          message.cpdlc = {
            protocol: parts[1],
            min: parts[2],
            mrn: parts[3],
            ra: parts[4],
            content: parts[5]
          };
          if (!message.cpdlc.protocol)
            continue;
          message.content = message.cpdlc.content;
          if (message.content) {
          }
        } else {
          message.content = message.payload.trim();
        }
      } else {
        message.content = message.payload;
      }
      message.content = message.content.replace(/@/g, "");
      message.content = message.content.replace(/\n/g, " ");
      messages.push(message);
    }
    return messages;
  };
  var sendAcarsMessage = async (state, receiver, payload, messageType) => {
    const params = new URLSearchParams([
      ["from", state.callsign],
      ["type", messageType],
      ["to", receiver],
      ["packet", payload]
    ]);
    if (state.code)
      params.append("logon", state.code);
    return fetch(`${state._service_url}?${params.toString()}`, {
      method: "GET"
    });
  };
  var responseOptions = (c) => {
    const map = {
      WU: ["WILCO", "UNABLE"],
      AN: ["AFFIRMATIVE", "NEGATIVE"],
      R: ["ROGER", "UNABLE"],
      RA: ["ROGER", "UNABLE"],
      Y: ["YES", "NO"],
      N: ["YES", "NO"]
    };
    if (map[c]) return [...map[c], "STANDBY"];
    return null;
  };
  var forwardStateUpdate = (state) => {
    if (state._stationCallback)
      state._stationCallback({
        active: state.active_station,
        pending: state.pending_station
      });
  };
  var messageStateUpdate = (state, message) => {
    if (message.type === "cpdlc" && message.content === "LOGON ACCEPTED" && state.pending_station) {
      state.active_station = message.from;
      state.pending_station = null;
      forwardStateUpdate(state);
    } else if (message.type === "cpdlc" && message.content === "LOGOFF" && state.active_station) {
      state.active_station = null;
      state.pending_station = null;
      forwardStateUpdate(state);
    }
  };
  var cpdlcStringBuilder = (state, request, replyId = "") => {
    if (state._min_count === 63) {
      state._min_count = 0;
    }
    state._min_count++;
    return `/data2/${state._min_count}/${replyId}/N/${request}`;
  };
  var getRandomPollInterval = () => {
    return Math.floor(Math.random() * (75e3 - 45e3 + 1)) + 45e3;
  };
  var FAST_POLL_INTERVAL = 1e3 * 20;
  var FAST_POLL_DURATION = 1e3 * 60 * 2;
  var getPollInterval = (state) => {
    if (state._expectingResponse && Date.now() < state._expectingResponse) {
      return FAST_POLL_INTERVAL;
    }
    if (state._expectingResponse) {
      state._expectingResponse = null;
    }
    return getRandomPollInterval();
  };
  var startPollingIfNeeded = (state) => {
    if (!state._pollingStarted) {
      state._pollingStarted = true;
      poll(state);
    }
  };
  var handleSuccessfulSend = (state, text) => {
    if (text.startsWith("ok")) {
      startPollingIfNeeded(state);
      state._expectingResponse = Date.now() + FAST_POLL_DURATION;
      return true;
    }
    return false;
  };
  var poll = (state) => {
    const interval = getPollInterval(state);
    state._interval = setTimeout(() => {
      sendAcarsMessage(state, "SERVER", "Nothing", "poll").then((response) => {
        if (response.ok) {
          response.text().then((raw) => {
            const messages = parseMessages(raw);
            if (messages.length > 0 && state._expectingResponse) {
              state._expectingResponse = null;
            }
            for (const message of messages) {
              if (message.from === state.callsign && message.type === "inforeq") {
                continue;
              }
              if (state.active_station && message.from === state.active_station && message.content.startsWith("HANDOVER")) {
                state.active_station = null;
                const station = message.content.split(" ")[1];
                if (station) {
                  const corrected = station.trim().replace("@", "");
                  state.sendLogonRequest(corrected);
                  continue;
                }
              }
              message._id = state.idc++;
              messageStateUpdate(state, message);
              if (message.type === "cpdlc" && message.cpdlc.ra) {
                const opts = responseOptions(message.cpdlc.ra);
                if (opts)
                  message.response = async (code) => {
                    message.respondSend = code;
                    if (state._min_count === 63) {
                      state._min_count = 0;
                    }
                    state._min_count++;
                    sendAcarsMessage(
                      state,
                      message.from,
                      `/data2/${state._min_count}/${message.cpdlc.min}/${code === "STANDBY" ? "NE" : "N"}/${code}`,
                      "cpdlc"
                    );
                  };
                message.options = opts;
                message.respondSend = null;
              }
              state.message_stack[message._id] = message;
              state._callback(message);
            }
            poll(state);
          }).catch((err) => {
            poll(state);
          });
        } else {
          poll(state);
        }
      }).catch((err) => {
        poll(state);
      });
    }, interval);
  };
  var addMessage = (state, content, cpdlc = false) => {
    state._callback({
      type: "send",
      content,
      from: state.callsign,
      ts: Date.now(),
      _id: state.idc++,
      cpdlc: cpdlc ? {} : null
    });
    return content;
  };
  var convertUnixToHHMM = (unixTimestamp) => {
    const date = new Date(unixTimestamp);
    let hours = date.getUTCHours();
    let minutes = date.getUTCMinutes();
    hours = hours.toString().padStart(2, "0");
    minutes = minutes.toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };
  var SERVICES = {
    hoppie: "https://www.hoppie.nl/acars/system/connect.html",
    sayintentions: "https://acars.sayintentions.ai/acars/system/connect.html",
    beyondatc: "http://localhost:57698/connect.html"
  };
  var beyondAtcAtisRequest = async (state, icao, type) => {
    if (type === "TAF") {
      state._callback({
        type: "inforeq",
        content: "TAF not supported",
        from: "BEYONDATC",
        ts: Date.now(),
        _id: state.idc++
      });
      return false;
    }
    const baseUrl = state._service_url.replace("/connect.html", "");
    const endpoint = type === "METAR" ? "metar" : "atis";
    try {
      const response = await fetch(`${baseUrl}/acars/${endpoint}/${icao}`);
      if (!response.ok) {
        const errorText = await response.text();
        state._callback({
          type: "inforeq",
          content: `Error: ${errorText}`,
          from: "BEYONDATC",
          ts: Date.now(),
          _id: state.idc++
        });
        return false;
      }
      const text = await response.text();
      state._callback({
        type: "inforeq",
        content: text,
        from: icao,
        ts: Date.now(),
        _id: state.idc++
      });
      return true;
    } catch (err) {
      state._callback({
        type: "inforeq",
        content: `Error: ${err.message}`,
        from: "BEYONDATC",
        ts: Date.now(),
        _id: state.idc++
      });
      return false;
    }
  };
  var createClient = (code, callsign, aicraftType, messageCallback, service = "hoppie") => {
    const state = {
      code,
      callsign,
      _callback: messageCallback,
      active_station: null,
      pending_station: null,
      _min_count: 0,
      aircraft: aicraftType,
      idc: 0,
      message_stack: {},
      _service_url: SERVICES[service],
      _expectingResponse: null,
      _pollingStarted: false
    };
    state.dispose = () => {
      if (state._interval) clearInterval(state._interval);
      state._interval = null;
    };
    state.sendTelex = async (to, message) => {
      const response = await sendAcarsMessage(
        state,
        to,
        addMessage(state, message.toUpperCase()),
        "telex"
      );
      if (!response.ok) return false;
      return handleSuccessfulSend(state, await response.text());
    };
    state.atisRequestDirect = async (icao, type, dir = "D") => {
      if (service === "beyondatc") {
        return beyondAtcAtisRequest(state, icao, type);
      }
      const response = await sendAcarsMessage(
        state,
        state.callsign,
        `${(type === "ATIS" ? "VATATIS" : type).toUpperCase()} ${icao}${type === "ATIS" && service !== "sayintentions" ? "_" + dir : ""}`,
        "inforeq"
      );
      if (!response.ok) return [false, []];
      let text = await response.text();
      const parsed = parseMessages(text);
      if (parsed.length === 1 && parsed[0].content && parsed[0].content.replace(/\n/, " ") === "THIS ATIS IS NOT AVAILABLE") {
        const response2 = await sendAcarsMessage(
          state,
          state.callsign,
          `${(type === "ATIS" ? "VATATIS" : type).toUpperCase()} ${icao}`,
          "inforeq"
        );
        if (!response2.ok) return [false, []];
        text = await response2.text();
      }
      return [text.startsWith("ok"), parseMessages(text)];
    };
    state.atisRequest = async (icao, type, dir = "D") => {
      const [success, list] = await state.atisRequestDirect(icao, type, dir);
      if (success)
        for (const message of list) {
          message._id = state.idc++;
          state._callback(
            message
          );
        }
      return success;
    };
    state.sendPositionReport = async (fl, mach, wp, wpEta, nextWp, nextWpEta, followWp) => {
      if (!state.active_station) return;
      const content = `OVER ${wp} AT ${wpEta}Z FL${fl}, ESTIMATING ${nextWp} AT ${nextWpEta}Z, THEREAFTER ${followWp}. CURRENT SPEED M${mach}`.toUpperCase();
      const response = await sendAcarsMessage(
        state,
        state.active_station,
        `/DATA1/*/*/*/*/FL${fl}/*/${mach}/

${content}`,
        "position"
      );
      addMessage(state, content);
      const text = await response.text();
      return text.startsWith("ok");
    };
    state.sendLogonRequest = async (to) => {
      if (to === state.active_station) return;
      state.pending_station = to;
      const response = await sendAcarsMessage(
        state,
        to,
        cpdlcStringBuilder(state, addMessage(state, `REQUEST LOGON`, true)),
        "cpdlc"
      );
      if (!response.ok) return false;
      forwardStateUpdate(state);
      return handleSuccessfulSend(state, await response.text());
    };
    state.sendLogoffRequest = async () => {
      if (!state.active_station) return;
      const station = state.active_station;
      state.active_station = null;
      const response = await sendAcarsMessage(
        state,
        station,
        cpdlcStringBuilder(state, addMessage(state, `LOGOFF`, true)),
        "cpdlc"
      );
      if (!response.ok) return false;
      const text = await response.text();
      forwardStateUpdate(state);
      return text.startsWith("ok");
    };
    state.sendOceanicClearance = async (cs, to, entryPoint, eta, level, mach, freeText) => {
      const response = await sendAcarsMessage(
        state,
        to,
        addMessage(
          state,
          `REQUEST OCEANIC CLEARANCE ${cs} ${state.aircraft} ESTIMATING ${entryPoint} AT ${eta}Z FLIGHT LEVEL ${level} REQUEST MACH ${mach}${freeText.length ? ` ${freeText}` : ""}`.toUpperCase()
        ),
        "telex"
      );
      if (!response.ok) return false;
      return handleSuccessfulSend(state, await response.text());
    };
    state.sendPdc = async (to, dep, arr, stand, atis, freeText) => {
      const response = await sendAcarsMessage(
        state,
        to,
        addMessage(
          state,
          `REQUEST PREDEP CLEARANCE ${state.callsign} ${state.aircraft} TO ${arr} AT ${dep} ${stand} ATIS ${atis}${freeText.length ? ` ${freeText}` : ""}`.toUpperCase()
        ),
        "telex"
      );
      if (!response.ok) return false;
      return handleSuccessfulSend(state, await response.text());
    };
    state.sendLevelChange = async (lvl, climb, reason, freeText) => {
      const response = await sendAcarsMessage(
        state,
        state.active_station,
        cpdlcStringBuilder(
          state,
          addMessage(
            state,
            `REQUEST ${climb ? "CLIMB" : "DESCEND"} TO FL${lvl} DUE TO ${{ weather: "weather", performance: "aircraft performance" }[reason.toLowerCase()]}${freeText.length ? ` ${freeText}` : ""}`.toUpperCase(),
            true
          )
        ),
        "cpdlc"
      );
      if (!response.ok) return false;
      return handleSuccessfulSend(state, await response.text());
    };
    state.sendSpeedChange = async (unit, value, reason, freeText) => {
      const response = await sendAcarsMessage(
        state,
        state.active_station,
        cpdlcStringBuilder(
          state,
          addMessage(
            state,
            `REQUEST ${unit === "knots" ? `${value} kts` : `M${value}`} DUE TO ${{ weather: "weather", performance: "aircraft performance" }[reason.toLowerCase()]}${freeText.length ? ` ${freeText}` : ""}`.toUpperCase(),
            true
          )
        ),
        "cpdlc"
      );
      if (!response.ok) return false;
      return handleSuccessfulSend(state, await response.text());
    };
    state.sendDirectTo = async (waypoint, reason, freeText) => {
      const response = await sendAcarsMessage(
        state,
        state.active_station,
        cpdlcStringBuilder(
          state,
          addMessage(
            state,
            `REQUEST DIRECT TO ${waypoint} DUE TO ${{ weather: "weather", performance: "aircraft performance" }[reason.toLowerCase()]}${freeText.length ? ` ${freeText}` : ""}`.toUpperCase(),
            true
          )
        ),
        "cpdlc"
      );
      if (!response.ok) return false;
      return handleSuccessfulSend(state, await response.text());
    };
    startPollingIfNeeded(state);
    return state;
  };

  // src/AcarsService.mjs
  var import_msfs_sdk3 = __require("@microsoft/msfs-sdk");

  // src/SimbriefFplan.mjs
  var import_msfs_sdk2 = __require("@microsoft/msfs-sdk");
  var SIMBRIEF_ID_KEY = "h800xp_acars_simbrief_id";
  var SB_TYPE_TO_ICAO_TYPE = {
    apt: "A",
    ndb: "N",
    vor: "V",
    wpt: "W",
    ltlg: ""
  };
  var VFR_FLIGHT_RULES = ["V", "Z"];
  var PSEUDO_FIXES = ["TOC", "TOD"];
  var isLoadableAirway = (via) => !!via && via !== "DCT" && via.length <= 7 && !/^NAT[A-Z]$/.test(via);
  var asArray = (value) => Array.isArray(value) ? value : value ? [value] : [];
  var getSimbriefId = () => {
    const id = GetStoredData(SIMBRIEF_ID_KEY);
    return id && id.length ? id.toString() : null;
  };
  var fetchSimbriefOfp = async (id = getSimbriefId()) => {
    if (!id) throw new Error("NO SIMBRIEF ID");
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
  var airportIcaoValue = (ident) => import_msfs_sdk2.ICAO.value("A", "", "", ident);
  var resolveFixIcao = async (facLoader, fix) => {
    console.log("resolve fix", fix);
    const type = SB_TYPE_TO_ICAO_TYPE[fix.type];
    if (!type) return null;
    const icao = import_msfs_sdk2.ICAO.value(
      type,
      fix.icao_region || "",
      fix.region_code && typeof fix.region_code === "string" && fix.region_code !== "ENRT" ? fix.region_code : "",
      fix.ident
    );
    try {
      console.log(import_msfs_sdk2.ICAO.getFacilityTypeFromValue(icao), icao);
      const facility = await facLoader.tryGetFacility(
        import_msfs_sdk2.ICAO.getFacilityTypeFromValue(icao),
        icao
      );
      return facility ? icao : null;
    } catch (err) {
      return null;
    }
  };
  var procedureOfFix = (fix, general) => {
    if (general.sid_ident && fix.via_airway === general.sid_ident) return "sid";
    if (general.star_ident && fix.via_airway === general.star_ident) return "star";
    if (fix.is_sid_star !== "1") return null;
    return fix.stage === "DSC" ? "star" : "sid";
  };
  var classifyFix = (fix, index, navlog, general, loaded, hasEnrouteLeg, useAirways) => {
    if (fix.type === "apt") return null;
    if (PSEUDO_FIXES.includes(fix.ident)) return null;
    const procedure = procedureOfFix(fix, general);
    if (procedure) {
      if (loaded[procedure]) return null;
      return { via: "" };
    }
    if (general.sid_trans && fix.ident === general.sid_trans) return null;
    if (general.star_trans && fix.ident === general.star_trans && fix.via_airway === "DCT")
      return null;
    if (!useAirways) return { via: "" };
    if (!hasEnrouteLeg) return { via: "" };
    if (fix.via_airway !== "DCT" && navlog[index + 1] && fix.via_airway === navlog[index + 1].via_airway)
      return null;
    return { via: isLoadableAirway(fix.via_airway) ? fix.via_airway : "" };
  };
  var ofpToFlightPlanRoute = async (ofp, facLoader, options = {}) => {
    const { useAirways = false } = options;
    const route = import_msfs_sdk2.FlightPlanRouteUtils.emptyRoute();
    const warnings = [];
    const { general } = ofp;
    const navlog = asArray(ofp.navlog.fix);
    const departure = await facLoader.tryGetFacility(
      import_msfs_sdk2.FacilityType.Airport,
      airportIcaoValue(ofp.origin.icao_code || ofp.origin.faa_code)
    );
    const destination = await facLoader.tryGetFacility(
      import_msfs_sdk2.FacilityType.Airport,
      airportIcaoValue(ofp.destination.icao_code || ofp.destination.faa_code)
    );
    if (departure) {
      route.departureAirport = departure.icaoStruct;
      if (general.sid_ident) {
        if (departure.departures && departure.departures.find((dep) => dep.name === general.sid_ident)) {
          route.departure = general.sid_ident;
          route.departureTransition = general.sid_trans && typeof general.sid_trans === "string" ? general.sid_trans : "";
        } else {
          warnings.push(`SID ${general.sid_ident} NOT IN DB`);
        }
      }
      const runway = import_msfs_sdk2.RunwayUtils.matchOneWayRunwayFromDesignation(
        departure,
        ofp.origin.plan_rwy
      );
      if (runway) {
        import_msfs_sdk2.RunwayUtils.getIdentifierFromOneWayRunway(runway, route.departureRunway);
      } else if (ofp.origin.plan_rwy) {
        warnings.push(`DEP RWY ${ofp.origin.plan_rwy} NOT IN DB`);
      }
    } else {
      route.departureAirport = { __Type: "JS_ICAO", type: "A", region: "", airport: "", ident: ofp.origin.icao_code || ofp.origin.faa_code };
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
      const runway = import_msfs_sdk2.RunwayUtils.matchOneWayRunwayFromDesignation(
        destination,
        ofp.destination.plan_rwy
      );
      if (runway) {
        import_msfs_sdk2.RunwayUtils.getIdentifierFromOneWayRunway(runway, route.destinationRunway);
      } else if (ofp.destination.plan_rwy) {
        warnings.push(`DEST RWY ${ofp.destination.plan_rwy} NOT IN DB`);
      }
    } else {
      route.destinationAirport = { __Type: "JS_ICAO", type: "A", region: "", airport: "", ident: ofp.destination.icao_code || ofp.destination.faa_code };
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
        useAirways
      );
      if (!classification) continue;
      const leg = import_msfs_sdk2.FlightPlanRouteUtils.emptyEnrouteLeg();
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
        isFlightLevel: false
      };
    }
    route.isVfr = VFR_FLIGHT_RULES.includes(ofp.atc.flight_rules);
    return { route, warnings };
  };
  var loadSimbriefFlightPlan = async (facLoader, options = {}) => {
    const { id, sendToEfb = true, fileWithAtc = true, useAirways = false } = options;
    let ofp;
    let route;
    let warnings;
    try {
      ofp = await fetchSimbriefOfp(id);
      ({ route, warnings } = await ofpToFlightPlanRoute(ofp, facLoader, { useAirways }));
    } catch (err) {
      console.error("SimBrief flight plan uplink failed", err);
      return { ok: false, error: err.message, ofp };
    }
    if (import_msfs_sdk2.FlightPlanRouteUtils.isRouteEmpty(route, false))
      return { ok: false, error: "EMPTY ROUTE", ofp, route, warnings };
    try {
      const manager = await import_msfs_sdk2.FlightPlanRouteManager.getManager();
      await manager.sendRouteToAvionics(route);
      if (sendToEfb) await manager.sendRouteToEfb(route);
      if (fileWithAtc) await manager.fileRouteWithAtc(route);
    } catch (err) {
      console.error("SimBrief flight plan uplink failed", err);
      return { ok: false, error: `UPLINK FAIL: ${err.message}`, ofp, route, warnings };
    }
    return { ok: true, ofp, route, warnings };
  };
  var SimbriefFplan_default = loadSimbriefFlightPlan;

  // src/AcarsService.mjs
  var acars = {
    client: null,
    messages: [],
    casState: {
      dl: false,
      atc: false,
      atc_pfd: false
    }
  };
  var updateReadState = (bus, id) => {
    if (typeof id === "number") {
      const message = acars.messages.find((e) => e._id === id);
      if (!message || message.viewed) return;
      message.viewed = true;
    }
    const publisher = bus.getPublisher();
    if (acars.casState.dl) {
      if (!acars.messages.some((e) => e.type !== "send" && !e.viewed && !e.cpdlc)) {
        acars.casState.dl = false;
        publisher.pub("clear_message", "800xp_acars_dl_message", true, false);
      }
    }
    if (acars.casState.atc_pfd) {
      if (!acars.messages.some((e) => e.type !== "send" && !e.viewed && e.cpdlc && e.options && !e.respondSend)) {
        acars.casState.atc_pfd = false;
        publisher.pub("clear_message", "800xp_acars_atc_message_pfd", true, false);
      } else {
        return;
      }
    }
    if (acars.casState.atc) {
      if (!acars.messages.some((e) => e.type !== "send" && !e.viewed && e.cpdlc)) {
        acars.casState.atc = false;
        publisher.pub("clear_message", "800xp_acars_atc_message", true, false);
      }
    }
  };
  var fetchAcarsMessages = (bus, dir, type = "aoc") => {
    return new Promise((resolve) => {
      const sub = bus.getSubscriber().on(`acars_messages_${dir}_response`).handle((v) => {
        sub.destroy();
        resolve(v.messages);
      });
      bus.getPublisher().pub(`acars_messages_${dir}`, { type }, true, false);
    });
  };
  var fetchAcarsStatus = (bus) => {
    return new Promise((resolve) => {
      const sub = bus.getSubscriber().on(`acars_status_response`).handle((v) => {
        sub.destroy();
        resolve(v);
      });
      bus.getPublisher().pub(`acars_status_req`, null, true, false);
    });
  };
  var correctNetwork = {
    hopppie: "hoppie",
    batc: "beyondatc",
    "sayi.ai": "sayintentions"
  };
  var soundTm = null;
  var initClient = (callsign, publisher) => {
    acars.client = createClient(
      GetStoredData("h800xp_acars_hoppie_code"),
      callsign,
      "P180",
      (message) => {
        acars.messages.push(message);
        if (message.type === "send") {
          publisher.pub("acars_outgoing_message", message, true, false);
        } else {
          console.log(message, acars);
          if (message.cpdlc) {
            if (!acars.casState.atc) {
              acars.casState.atc = true;
              publisher.pub("post_message", "800xp_acars_atc_message", true, false);
            }
            if (message.options && !acars.casState.atc_pfd) {
              acars.casState.atc_pfd = true;
              publisher.pub("post_message", "800xp_acars_atc_message_pfd", true, false);
            }
          } else {
            if (!acars.casState.dl) {
              acars.casState.dl = true;
              publisher.pub("post_message", "800xp_acars_dl_message", true, false);
            }
          }
          publisher.pub("acars_incoming_message", message, true, false);
          if (!soundTm) {
            SimVar.SetSimVarValue("L:P180_sys_test_ldngr", "number", 1);
            soundTm = setTimeout(() => {
              SimVar.SetSimVarValue("L:P180_sys_test_ldngr", "number", 0);
              soundTm = null;
            }, 500);
          }
        }
      },
      GetStoredData("h800xp_acars_network_setting") ? correctNetwork[GetStoredData("h800xp_acars_network_setting").toLowerCase()] : "hoppie"
    );
    acars.client._stationCallback = (opt) => {
      publisher.pub("acars_station_status", opt, true, false);
    };
  };
  var acarsService = (bus, facLoader) => {
    const publisher = bus.getPublisher();
    bus.getSubscriber().on("acars_message_send").handle((v) => {
      if (acars.client)
        acars.client[v.key].apply(
          void 0,
          Array.isArray(v.arguments) ? v.arguments : Object.value(v.arguments)
        );
      return true;
    });
    bus.getSubscriber().on("acars_message_ack").handle((v) => {
      if (acars.client) {
        const message = acars.messages.find((e) => e._id === v.id);
        if (message) {
          message.response(v.option);
          publisher.pub(
            "acars_message_state_update",
            {
              id: v.id,
              option: v.option
            },
            true,
            false
          );
        }
      }
      return true;
    });
    bus.getSubscriber().on("acars_read_state").handle((v) => {
      updateReadState(bus, v.id);
      return true;
    });
    bus.getSubscriber().on("acars_messages_send").handle((v) => {
      publisher.pub(
        "acars_messages_send_response",
        {
          messages: acars.messages.filter(
            (e) => e.type === "send" && (v.type === "aoc" ? !e.cpdlc : e.cpdlc)
          )
        },
        true,
        false
      );
      return true;
    });
    bus.getSubscriber().on("acars_status_req").handle((v) => {
      publisher.pub(
        "acars_status_response",
        {
          active: acars.client ? acars.client.active_station : null,
          pending: acars.client ? acars.client.pending_station : null
        },
        true,
        false
      );
      return true;
    });
    bus.getSubscriber().on("acars_del_msg").handle((v) => {
      acars.messages = acars.messages.filter((e) => e._id !== v);
      publisher.pub("acars_message_removal", v, true, false);
      return true;
    });
    bus.getSubscriber().on("acars_messages_recv").handle((v) => {
      publisher.pub(
        "acars_messages_recv_response",
        {
          messages: acars.messages.filter(
            (e) => e.type !== "send" && (v.type === "aoc" ? !e.cpdlc : e.cpdlc)
          )
        },
        true,
        false
      );
      return true;
    });
    bus.getSubscriber().on("acars_messages_all").handle((v) => {
      publisher.pub(
        "acars_messages_all_response",
        {
          messages: acars.messages.filter(
            (e) => v.type === "aoc" ? e.cpdlc === void 0 : e.cpdlc
          )
        },
        true,
        false
      );
      return true;
    });
    bus.getSubscriber().on("h800xp_acars_network_setting").handle((v) => {
      const callsign = acars.client ? acars.client.callsign : null;
      if (callsign) initClient(callSign, publisher);
      return true;
    });
    bus.getSubscriber().on("h800xp_acars_fetch_fplan").handle((v) => {
      if (acars.fetchingSb)
        return true;
      acars.fetchingSb = true;
      SimbriefFplan_default(facLoader, { fileWithAtc: false, useAirways: false }).then((result) => {
        if (result.ok) {
          if (result.ofp.atc && result.ofp.atc.callsign) {
            import_msfs_wt21_shared.FmcUserSettings.getManager(bus).getSetting("flightNumber").set(result.ofp.atc.callsign);
          }
        }
        acars.fetchingSb = false;
        publisher.pub(
          "h800xp_acars_fetch_fplan_done",
          { res: result.ok },
          true,
          false
        );
      }).catch(() => {
        acars.fetchingSb = false;
        publisher.pub(
          "h800xp_acars_fetch_fplan_done",
          { res: false },
          true,
          false
        );
      });
      return true;
    });
    import_msfs_wt21_shared.default.FmcUserSettings.getManager(bus).getSetting("flightNumber").sub((value) => {
      if (!value || !value.length) {
        const current = acars.client;
        if (current) {
          current.dispose();
        }
        acars.client = null;
        publisher.pub("acars_new_client", null, true, false);
        return;
      }
      initClient(value, publisher);
    });
  };
  var AcarsService_default = acarsService;

  // src/pages/AtisPage.mjs
  var import_msfs_sdk4 = __require("@microsoft/msfs-sdk");
  var import_msfs_wt21_fmc2 = __require("@microsoft/msfs-wt21-fmc");
  var DatalinkAtisPage = class extends import_msfs_wt21_fmc2.WT21FmcPage {
    constructor(bus, screen, props, fms, baseInstrument, renderCallback) {
      super(bus, screen, props, fms, baseInstrument, renderCallback);
      this.send = import_msfs_sdk4.Subject.create(false);
      this.reqType = import_msfs_sdk4.Subject.create(0);
      this.clockField = import_msfs_wt21_fmc2.FmcCmuCommons.createClockField(this, this.bus);
      this.facility = import_msfs_sdk4.Subject.create("");
      this.opts = ["DEPARTURE", "ARRIVAL"];
      this.typeSwitch = new import_msfs_sdk4.SwitchLabel(this, {
        optionStrings: this.opts,
        activeStyle: "green"
      }).bind(this.reqType);
      this.sendButton = new import_msfs_sdk4.DisplayField(this, {
        formatter: {
          nullValueString: "SEND",
          /** @inheritDoc */
          format(value) {
            return `SEND[${value ? "blue" : "white"}]`;
          }
        },
        onSelected: async () => {
          if (this.send.get()) {
            this.bus.getPublisher().pub(
              "acars_message_send",
              {
                key: "atisRequest",
                arguments: [this.facility.get(), "ATIS", this.opts[this.reqType.get()]]
              },
              true,
              false
            );
            [this.facility].forEach((e) => e.set(""));
            this.checkReady();
          }
          return true;
        }
      }).bind(this.send);
      this.facilityField = new import_msfs_sdk4.TextInputField(this, {
        formatter: new import_msfs_wt21_fmc2.StringInputFormat({
          nullValueString: "\u25A1\u25A1\u25A1\u25A1",
          maxLength: 4
        }),
        onSelected: async (scratchpadContents) => {
          this.facility.set(scratchpadContents);
          this.checkReady();
          return true;
        }
      }).bind(this.facility);
    }
    checkReady() {
      this.send.set(this.facility.get());
    }
    render() {
      return [
        [
          ["DL[blue]", "", "ATIS REQ[blue]"],
          ["FACILITY[blue]"],
          [this.facilityField],
          ["TYPE[blue]", ""],
          [this.typeSwitch],
          [],
          [],
          [],
          [],
          [""],
          ["", this.sendButton],
          [""],
          [
            import_msfs_sdk4.PageLinkField.createLink(this, "<RETURN", "/datalink-menu"),
            "",
            this.clockField
          ]
        ]
      ];
    }
  };

  // src/pages/SendMessages.mjs
  var import_msfs_sdk5 = __require("@microsoft/msfs-sdk");
  var import_msfs_wt21_fmc3 = __require("@microsoft/msfs-wt21-fmc");
  var DatalinkSendMessagesPage = class extends import_msfs_wt21_fmc3.WT21FmcPage {
    constructor(bus, screen, props, fms, baseInstrument, renderCallback) {
      super(bus, screen, props, fms, baseInstrument, renderCallback);
      this.messages = import_msfs_sdk5.Subject.create([]);
      this.clockField = import_msfs_wt21_fmc3.FmcCmuCommons.createClockField(this, this.bus);
      this.bus.getSubscriber().on("acars_message_removal").handle((idv) => {
        const current = this.messages.get().filter((e) => e.message._id !== idv);
        this.messages.set(current);
        this.invalidate();
      });
      this.bus.getSubscriber().on("acars_outgoing_message").handle((message) => {
        const current = this.messages.get();
        const entry = {
          message,
          link: import_msfs_sdk5.PageLinkField.createLink(
            this,
            `<${message.content.substr(0, 23)}`,
            "/datalink-extra/message",
            false,
            {
              message
            }
          )
        };
        current.unshift(entry);
        this.messages.set(current);
        this.invalidate();
      });
      fetchAcarsMessages(this.bus, "send").then((messages) => {
        const current = this.messages.get();
        for (const message of messages) {
          const entry = {
            message,
            link: import_msfs_sdk5.PageLinkField.createLink(
              this,
              `<${message.content.substr(0, 23)}`,
              "/datalink-extra/message",
              false,
              {
                message
              }
            )
          };
          current.unshift(entry);
        }
        this.messages.set(current);
        this.invalidate();
      });
    }
    render() {
      const reqType = this.params.get("type");
      return this.messages.get().filter((message) => {
        if (reqType === "aoc" && message.cpdlc || reqType !== "aoc" && !message.cpdlc)
          return false;
        return true;
      }).reduce((acc, val) => {
        if (acc[acc.length - 1].length === 5)
          acc.push([]);
        acc[acc.length - 1].push(val);
        return acc;
      }, [[]]).map((page) => {
        const array = Array(10).fill().map((e) => []);
        page.forEach((val, index) => {
          const nn = index * 2;
          array[nn] = [`${convertUnixToHHMM(val.message.ts)}[blue]`];
          array[nn + 1] = [val.link];
        });
        return [
          ["DL[blue]", this.PagingIndicator, "SEND MSGS[blue]"],
          ...array,
          [],
          [
            import_msfs_sdk5.PageLinkField.createLink(this, "<RETURN", reqType === "aoc" ? "/datalink-menu" : "/datalink-extra/fans"),
            "",
            this.clockField
          ]
        ];
      });
    }
  };

  // src/pages/ReceivedMessages.mjs
  var import_msfs_sdk6 = __require("@microsoft/msfs-sdk");
  var import_msfs_wt21_fmc4 = __require("@microsoft/msfs-wt21-fmc");
  var DatalinkReceivedMessagesPage = class extends import_msfs_wt21_fmc4.WT21FmcPage {
    constructor(bus, screen, props, fms, baseInstrument, renderCallback) {
      super(bus, screen, props, fms, baseInstrument, renderCallback);
      this.messages = import_msfs_sdk6.Subject.create([]);
      this.clockField = import_msfs_wt21_fmc4.FmcCmuCommons.createClockField(this, this.bus);
      this.bus.getSubscriber().on("acars_message_removal").handle((idv) => {
        const current = this.messages.get().filter((e) => e.message._id !== idv);
        this.messages.set(current);
        this.invalidate();
      });
      this.bus.getSubscriber().on("acars_incoming_message").handle((message) => {
        const current = this.messages.get();
        const entry = {
          message,
          link: import_msfs_sdk6.PageLinkField.createLink(
            this,
            `<${message.from} ${message.content.substr(0, 22 - message.from.length)}`,
            "/datalink-extra/message",
            false,
            {
              message
            }
          )
        };
        current.unshift(entry);
        this.messages.set(current);
        this.invalidate();
      });
      this.bus.getSubscriber().on("acars_message_state_update").handle((e) => {
        const current = this.messages.get();
        const msg = current.find((t) => t.message._id === e.id);
        if (msg) {
          msg.respondSend = e.option;
        }
        this.messages.set(current);
      });
      fetchAcarsMessages(this.bus, "recv").then((messages) => {
        for (const message of messages) {
          const current = this.messages.get();
          const entry = {
            message,
            link: import_msfs_sdk6.PageLinkField.createLink(
              this,
              `<${message.content.substr(0, 23)}`,
              "/datalink-extra/message",
              false,
              {
                message
              }
            )
          };
          current.unshift(entry);
          this.messages.set(current);
        }
        this.invalidate();
      });
    }
    render() {
      const reqType = this.params.get("type");
      return this.messages.get().filter((message) => {
        if (reqType === "aoc" && message.cpdlc || reqType !== "aoc" && !message.cpdlc)
          return false;
        return true;
      }).reduce(
        (acc, val) => {
          if (acc[acc.length - 1].length === 5) acc.push([]);
          acc[acc.length - 1].push(val);
          return acc;
        },
        [[]]
      ).map((page) => {
        const array = Array(10).fill().map((e) => []);
        page.forEach((val, index) => {
          const nn = index * 2;
          array[nn] = [`${convertUnixToHHMM(val.message.ts)}[blue]`];
          array[nn + 1] = [val.link];
        });
        return [
          ["DL[blue]", this.PagingIndicator, "RCVD MSGS[blue]"],
          ...array,
          [],
          [
            import_msfs_sdk6.PageLinkField.createLink(
              this,
              "<RETURN",
              reqType === "aoc" ? "/datalink-menu" : "/datalink-extra/fans"
            ),
            "",
            this.clockField
          ]
        ];
      });
    }
  };

  // src/DataLinkPageExtension.mjs
  var import_msfs_wt21_fmc5 = __require("@microsoft/msfs-wt21-fmc");
  var import_msfs_sdk7 = __toESM(__require("@microsoft/msfs-sdk"), 1);
  var DatalinkPageExtension = class extends import_msfs_sdk7.AbstractFmcPageExtension {
    constructor(page) {
      super(page);
    }
    onPageRendered(renderedTemplates) {
      renderedTemplates[0][2][0] = import_msfs_sdk7.PageLinkField.createLink(
        this.page,
        "<RCVD MSGS",
        "/datalink-extra/recv-msgs",
        false,
        {
          type: "aoc"
        }
      );
      renderedTemplates[0][4][0] = import_msfs_sdk7.PageLinkField.createLink(
        this.page,
        "<SEND MSGS",
        "/datalink-extra/send-msgs",
        false,
        {
          type: "aoc"
        }
      );
      renderedTemplates[0][8][0] = import_msfs_sdk7.PageLinkField.createLink(
        this.page,
        "<TWIP",
        "/datalink-extra/twip"
      );
      renderedTemplates[0][10][0] = import_msfs_sdk7.PageLinkField.createLink(
        this.page,
        "<ATIS",
        "/datalink-extra/atis"
      );
      renderedTemplates[0][4][1] = import_msfs_sdk7.PageLinkField.createLink(
        this.page,
        "DEPART CLX>",
        "/datalink-extra/predep"
      );
      renderedTemplates[0][6][1] = import_msfs_sdk7.PageLinkField.createLink(
        this.page,
        "OCEANIC CLX>",
        "/datalink-extra/oceanic"
      );
    }
  };
  var DataLinkPageExtension_default = DatalinkPageExtension;

  // src/pages/FansPage.mjs
  var import_msfs_sdk8 = __require("@microsoft/msfs-sdk");
  var import_msfs_wt21_fmc6 = __require("@microsoft/msfs-wt21-fmc");
  var FansPage = class extends import_msfs_wt21_fmc6.WT21FmcPage {
    constructor(bus, screen, props, fms, baseInstrument, renderCallback) {
      super(bus, screen, props, fms, baseInstrument, renderCallback);
      this.clockField = import_msfs_wt21_fmc6.FmcCmuCommons.createClockField(this, this.bus);
    }
    render() {
      return [
        [
          ["FANS[blue]", "", "MAIN MENU[blue]"],
          [],
          [
            import_msfs_sdk8.PageLinkField.createLink(
              this,
              "<LOGON/STATUS",
              "/datalink-extra/cpdlc/status"
            ),
            import_msfs_sdk8.PageLinkField.createLink(
              this,
              "MSG LOG>",
              "/datalink-extra/cpdlc/messages",
              false,
              {
                type: "atc"
              }
            )
          ],
          [],
          [
            import_msfs_sdk8.PageLinkField.createLink(
              this,
              "<REQUEST",
              "/datalink-extra/cpdlc/request-menu"
            ),
            import_msfs_sdk8.PageLinkField.createLink(this, "EMERGENCY>", "", true)
          ],
          [],
          [
            import_msfs_sdk8.PageLinkField.createLink(this, "<POS REP", "/datalink-extra/posrep"),
            import_msfs_sdk8.PageLinkField.createLink(this, "REPORTS DUE>", "", true)
          ],
          [],
          [import_msfs_sdk8.PageLinkField.createLink(this, "<FREE TEXT", "/datalink-extra/telex")],
          [],
          ["", import_msfs_sdk8.PageLinkField.createLink(this, "ADS>", "", true)],
          [],
          ["", "", this.clockField]
        ]
      ];
    }
  };

  // src/IndexPageExtension.mjs
  var import_msfs_wt21_fmc7 = __require("@microsoft/msfs-wt21-fmc");
  var import_msfs_sdk9 = __toESM(__require("@microsoft/msfs-sdk"), 1);
  var IndexPageExtension = class extends import_msfs_sdk9.AbstractFmcPageExtension {
    constructor(page) {
      super(page);
    }
    onPageRendered(renderedTemplates) {
      renderedTemplates[0][12][0] = import_msfs_sdk9.PageLinkField.createLink(
        this.page,
        "<FANS",
        "/datalink-extra/fans"
      );
    }
  };
  var IndexPageExtension_default = IndexPageExtension;

  // src/pages/MessagePage.mjs
  var import_msfs_sdk10 = __require("@microsoft/msfs-sdk");
  var import_msfs_wt21_fmc8 = __require("@microsoft/msfs-wt21-fmc");
  var DatalinkMessagePage = class extends import_msfs_wt21_fmc8.WT21FmcPage {
    constructor(bus, screen, props, fms, baseInstrument, renderCallback) {
      super(bus, screen, props, fms, baseInstrument, renderCallback);
      this.clockField = import_msfs_wt21_fmc8.FmcCmuCommons.createClockField(this, this.bus);
      this.options = [];
      this.updateHandler = bus.getSubscriber().on("acars_message_state_update").handle((e) => {
        const message = this.params.get("message");
        if (message && e.id === message._id) {
          message.respondSend = e.option;
          message.viewed = true;
          this.options = [
            ...message.options.map((e2) => message.respondSend === e2 ? e2 : "")
          ];
          this.invalidate();
        }
      });
    }
    onDestroy() {
      this.updateHandler.destroy();
    }
    onPause() {
      this.updateHandler.pause();
    }
    onResume() {
      this.updateHandler.resume();
    }
    formatContent(message) {
      const textList = [];
      let current = [];
      const mwl = 24;
      for (const word of message.content.split(" ")) {
        current.push(word);
        const j = current.join(" ");
        if (j.length > mwl) {
          const l = current.pop();
          if (current.length) textList.push(current.join(" "));
          if (l.length >= mwl) {
            textList.push(l);
            current = [];
          } else {
            current = [l];
          }
        }
      }
      textList.push(current.join(" "));
      return textList;
    }
    getOpts(message) {
      if (message.options && !message.respondSend) {
        return message.options.map(
          (opt, i) => new import_msfs_sdk10.DisplayField(this, {
            formatter: {
              format: () => {
                return i !== 1 ? `*${opt}[blue]` : `${opt}*[blue]`;
              }
            },
            onSelected: async () => {
              if (message.respondSend) return true;
              this.bus.getPublisher().pub(
                "acars_message_ack",
                {
                  option: opt,
                  id: message._id
                },
                true,
                false
              );
              return true;
            }
          }).bind(import_msfs_sdk10.Subject.create(opt))
        );
      }
      return [];
    }
    checkReadState(message) {
      this.bus.getPublisher().pub(
        "acars_read_state",
        {
          id: message._id
        },
        true,
        false
      );
    }
    render() {
      const message = this.params.get("message");
      const titleLeft = message.cpdlc ? "FANS" : "DL";
      const status = message.cpdlc ? message.respondSend ? message.respondSend : "OPEN" : "OPEN";
      this.checkReadState(message);
      const title = `${convertUnixToHHMM(message.ts).replace(":", "")}Z-${message.from}`;
      const ret = import_msfs_sdk10.PageLinkField.createLink(
        this,
        "<RETURN",
        message.cpdlc ? "/datalink-extra/cpdlc/messages" : `/datalink-extra/${message.type === "send" ? "send-msgs" : "recv-msgs"}`,
        false,
        {
          type: message.cpdlc ? "atc" : "aoc"
        }
      );
      const opts = this.getOpts(message);
      const rowsPerPage = message.options ? 5 : 9;
      const pages = this.formatContent(message).reduce(
        (acc, val) => {
          if (acc[acc.length - 1].length === rowsPerPage) acc.push([]);
          acc[acc.length - 1].push([val]);
          return acc;
        },
        [[]]
      );
      return pages.map((contentRows) => {
        const base = [
          [
            `${titleLeft}[blue]`,
            pages.length > 1 ? this.PagingIndicator : "",
            "MESSAGE[blue]"
          ],
          [`${title}[green s-text]`, `${status}[green s-text]`],
          ...contentRows
        ];
        if (contentRows.length < rowsPerPage) {
          for (let i = 0; i < rowsPerPage - contentRows.length; i += 1)
            base.push([]);
        }
        if (message.options) {
          base.push(["", "", "--------RESPONSE--------[blue s-text]"]);
          if (opts.length) {
            base.push([opts[0]]);
            base.push([]);
            base.push([opts[2], opts[1]]);
          } else {
            base.push([message.respondSend]);
            base.push([]);
            base.push([]);
          }
        }
        base.push([]);
        base.push([ret, "", this.clockField]);
        return base;
      });
    }
  };

  // src/pages/FansRequestsPage.mjs
  var import_msfs_sdk11 = __require("@microsoft/msfs-sdk");
  var import_msfs_wt21_fmc9 = __require("@microsoft/msfs-wt21-fmc");
  var FansRequestPage = class extends import_msfs_wt21_fmc9.WT21FmcPage {
    constructor(bus, screen, props, fms, baseInstrument, renderCallback) {
      super(bus, screen, props, fms, baseInstrument, renderCallback);
      this.clockField = import_msfs_wt21_fmc9.FmcCmuCommons.createClockField(this, this.bus);
    }
    render() {
      return [
        [
          ["FANS[blue]", "", "REQUESTS[blue]"],
          [],
          [
            import_msfs_sdk11.PageLinkField.createLink(
              this,
              "<ALTITUDE",
              "/datalink-extra/cpdlc/level"
            )
          ],
          [],
          [
            import_msfs_sdk11.PageLinkField.createLink(this, "<OFFSET", "", true),
            import_msfs_sdk11.PageLinkField.createLink(this, "FMC DESCEND>", "", true)
          ],
          [],
          [
            import_msfs_sdk11.PageLinkField.createLink(
              this,
              "<SPEED",
              "/datalink-extra/cpdlc/speed"
            ),
            import_msfs_sdk11.PageLinkField.createLink(this, "WHEN CAN WE>", "", true)
          ],
          [],
          [
            import_msfs_sdk11.PageLinkField.createLink(
              this,
              "<ROUTE",
              "/datalink-extra/cpdlc/direct"
            ),
            import_msfs_sdk11.PageLinkField.createLink(this, "VOICE REQ>", "", true)
          ],
          [],
          [],
          [],
          [
            import_msfs_sdk11.PageLinkField.createLink(this, "<RETURN", "/datalink-extra/fans"),
            "",
            this.clockField
          ]
        ]
      ];
    }
  };

  // src/pages/CpdlcStatusPage.mjs
  var import_msfs_sdk12 = __require("@microsoft/msfs-sdk");
  var import_msfs_wt21_fmc10 = __require("@microsoft/msfs-wt21-fmc");
  var import_msfs_wt21_shared2 = __require("@microsoft/msfs-wt21-shared");
  var CpdlcStatusPage = class extends import_msfs_wt21_fmc10.WT21FmcPage {
    constructor(bus, screen, props, fms, baseInstrument, renderCallback) {
      super(bus, screen, props, fms, baseInstrument, renderCallback);
      this.clockField = import_msfs_wt21_fmc10.FmcCmuCommons.createClockField(this, this.bus);
      this.facility = import_msfs_sdk12.Subject.create(null);
      this.send = import_msfs_sdk12.Subject.create(null);
      this.logoff = import_msfs_sdk12.Subject.create(null);
      this.status = import_msfs_sdk12.Subject.create(null);
      this.activeStation = import_msfs_sdk12.Subject.create(null);
      this.pendingStation = import_msfs_sdk12.Subject.create(null);
      this.fltId = import_msfs_sdk12.Subject.create(import_msfs_wt21_shared2.FmcUserSettings.getManager(this.bus).getSetting("flightNumber").get());
      this.activeField = new import_msfs_sdk12.DisplayField(this, {
        formatter: {
          nullValueString: "--------[green]",
          /** @inheritDoc */
          format(value) {
            return `${value}[green]`;
          }
        }
      }).bind(this.activeStation);
      this.pendingField = new import_msfs_sdk12.DisplayField(this, {
        formatter: {
          nullValueString: "--------[green]",
          /** @inheritDoc */
          format(value) {
            return `${value}[green]`;
          }
        }
      }).bind(this.pendingStation);
      this.fltIdField = new import_msfs_sdk12.TextInputField(this, {
        formatter: new import_msfs_wt21_fmc10.StringInputFormat({
          nullValueString: "-------",
          maxLength: 7
        }),
        onSelected: async (scratchpadContents) => {
          import_msfs_wt21_shared2.FmcUserSettings.getManager(this.bus).getSetting("flightNumber").set(scratchpadContents);
          return true;
        },
        onDelete: async () => {
          import_msfs_wt21_shared2.FmcUserSettings.getManager(this.bus).getSetting("flightNumber").set(null);
        }
      }).bind(this.fltId);
      this.statusField = new import_msfs_sdk12.DisplayField(this, {
        formatter: {
          nullValueString: "",
          /** @inheritDoc */
          format(value) {
            return `${value}[green s-text]`;
          }
        }
      }).bind(this.status);
      this.facilityField = new import_msfs_sdk12.TextInputField(this, {
        formatter: new import_msfs_wt21_fmc10.StringInputFormat({
          nullValueString: "----",
          maxLength: 4
        }),
        onSelected: async (scratchpadContents) => {
          this.facility.set(scratchpadContents);
          return true;
        },
        onDelete: async () => {
          this.facility.set(null);
        }
      }).bind(this.facility);
      this.logonButton = new import_msfs_sdk12.DisplayField(this, {
        formatter: {
          nullValueString: "",
          /** @inheritDoc */
          format(value) {
            if (!value || !value.length) return "";
            return `${value}[blue]`;
          }
        },
        onSelected: async () => {
          const fac = this.facility.get();
          if (!fac || fac.length !== 4)
            return false;
          this.bus.getPublisher().pub(
            "acars_message_send",
            {
              key: "sendLogonRequest",
              arguments: [this.facility.get()]
            },
            true,
            false
          );
          return true;
        }
      }).bind(this.send);
      this.logoffButton = new import_msfs_sdk12.DisplayField(this, {
        formatter: {
          nullValueString: "",
          /** @inheritDoc */
          format(value) {
            return "";
          }
        },
        onSelected: async () => {
          if (this.activeStation.get()) {
            this.bus.getPublisher().pub(
              "acars_message_send",
              {
                key: "sendLogoffRequest",
                arguments: []
              },
              true,
              false
            );
            return true;
          }
          return false;
        }
      }).bind(import_msfs_sdk12.Subject.create(""));
      this.logoffText = new import_msfs_sdk12.DisplayField(this, {
        formatter: {
          nullValueString: "",
          /** @inheritDoc */
          format(value) {
            if (!value || !value.length) return "";
            return `${value}[blue]`;
          }
        }
      }).bind(this.logoff);
      this.facility.sub((v) => {
        if (v.length === 4 && !this.send.get()) this.send.set("SEND LOGON*");
        else if (v.length != 4 && this.send.get()) this.send.set(null);
      });
      this.bus.getSubscriber().on("acars_station_status").handle((message) => {
        this.logoff.set(message.active ? "LOGOFF*" : null);
        this.activeStation.set(message.active && message.active.length ? message.active : null);
        this.pendingStation.set(
          message.pending && message.pending.length ? message.pending : null
        );
        this.status.set(
          message.active ? `LOGGED ON TO ${message.active}` : message.pending ? `NOTIFIED ${message.pending}` : null
        );
        this.invalidate();
      });
      import_msfs_wt21_shared2.FmcUserSettings.getManager(bus).getSetting("flightNumber").sub((value) => {
        this.fltId.set(value);
        this.invalidate();
      });
      fetchAcarsStatus(this.bus).then((message) => {
        this.logoff.set(message.active ? "LOGOFF*" : null);
        this.activeStation.set(message.active && message.active.length ? message.active : null);
        this.pendingStation.set(
          message.pending && message.pending.length ? message.pending : null
        );
        this.status.set(
          message.active ? `LOGGED ON TO ${message.active}` : message.pending ? `NOTIFIED ${message.pending}` : "LOGON REQUIRED"
        );
        this.invalidate();
      });
    }
    render() {
      return [
        [
          ["FANS[blue]", "", "LOGON/STATUS[blue]"],
          [` CDA[blue]`, "", this.activeField],
          [` NDA[blue]`, this.logoffButton, this.pendingField],
          ["", this.logoffText],
          ["", "", "------------------------[blue]"],
          [],
          [],
          ["FLT ID[blue]", "LOGON TO[blue]"],
          [this.fltIdField, this.facilityField],
          ["", "", this.statusField],
          ["", this.logonButton],
          [],
          [
            import_msfs_sdk12.PageLinkField.createLink(this, "<RETURN", "/datalink-extra/fans"),
            "",
            this.clockField
          ]
        ]
      ];
    }
  };

  // src/pages/CombinedMessages.mjs
  var import_msfs_sdk13 = __require("@microsoft/msfs-sdk");
  var import_msfs_wt21_fmc11 = __require("@microsoft/msfs-wt21-fmc");
  var DatalinkCombinedMessagesPage = class extends import_msfs_wt21_fmc11.WT21FmcPage {
    constructor(bus, screen, props, fms, baseInstrument, renderCallback) {
      super(bus, screen, props, fms, baseInstrument, renderCallback);
      this.messages = import_msfs_sdk13.Subject.create([]);
      this.clockField = import_msfs_wt21_fmc11.FmcCmuCommons.createClockField(this, this.bus);
      this.bus.getSubscriber().on("acars_message_removal").handle((idv) => {
        const current = this.messages.get().filter((e) => e.message._id !== idv);
        this.messages.set(current);
        this.invalidate();
      });
      this.bus.getSubscriber().on("acars_incoming_message").handle((message) => {
        if (!message.cpdlc)
          return;
        const current = this.messages.get();
        const entry = {
          message,
          link: import_msfs_sdk13.PageLinkField.createLink(
            this,
            `<${message.from} ${message.content.substr(0, 22 - message.from.length)}`,
            "/datalink-extra/message",
            false,
            {
              message
            }
          )
        };
        current.unshift(entry);
        this.messages.set(current);
        this.invalidate();
      });
      this.bus.getSubscriber().on("acars_message_state_update").handle((e) => {
        const current = this.messages.get();
        const msg = current.find((t) => t.message._id === e.id);
        if (msg) {
          msg.respondSend = e.option;
        }
        this.messages.set(current);
      });
      fetchAcarsMessages(this.bus, "all", "atc").then((messages) => {
        const current = this.messages.get();
        for (const message of messages) {
          const entry = {
            message,
            link: import_msfs_sdk13.PageLinkField.createLink(
              this,
              `<${message.content.substr(0, 23)}`,
              "/datalink-extra/message",
              false,
              {
                message
              }
            )
          };
          current.unshift(entry);
        }
        this.messages.set(current);
        this.invalidate();
      });
    }
    render() {
      const reqType = this.params.get("type");
      return this.messages.get().reduce((acc, val) => {
        if (acc[acc.length - 1].length === 5)
          acc.push([]);
        acc[acc.length - 1].push(val);
        return acc;
      }, [[]]).map((page) => {
        const array = Array(10).fill().map((e) => []);
        page.forEach((val, index) => {
          const nn = index * 2;
          array[nn] = [`${convertUnixToHHMM(val.message.ts)}[blue]`];
          array[nn + 1] = [val.link];
        });
        return [
          ["FANS[blue]", this.PagingIndicator, "MESSAGES[blue]"],
          ...array,
          [],
          [
            import_msfs_sdk13.PageLinkField.createLink(this, "<RETURN", reqType === "aoc" ? "/datalink-menu" : "/datalink-extra/fans"),
            "",
            this.clockField
          ]
        ];
      });
    }
  };

  // src/pages/TwipPage.mjs
  var import_msfs_sdk14 = __require("@microsoft/msfs-sdk");
  var import_msfs_wt21_fmc12 = __require("@microsoft/msfs-wt21-fmc");
  var DatalinkTwipPage = class extends import_msfs_wt21_fmc12.WT21FmcPage {
    constructor(bus, screen, props, fms, baseInstrument, renderCallback) {
      super(bus, screen, props, fms, baseInstrument, renderCallback);
      this.send = import_msfs_sdk14.Subject.create(false);
      this.reqType = import_msfs_sdk14.Subject.create(0);
      this.clockField = import_msfs_wt21_fmc12.FmcCmuCommons.createClockField(this, this.bus);
      this.facility = import_msfs_sdk14.Subject.create("");
      this.opts = ["METAR", "TAF"];
      this.typeSwitch = new import_msfs_sdk14.SwitchLabel(this, {
        optionStrings: this.opts,
        activeStyle: "green"
      }).bind(this.reqType);
      this.sendButton = new import_msfs_sdk14.DisplayField(this, {
        formatter: {
          nullValueString: "SEND",
          /** @inheritDoc */
          format(value) {
            return `SEND[${value ? "blue" : "white"}]`;
          }
        },
        onSelected: async () => {
          if (this.send.get()) {
            this.bus.getPublisher().pub(
              "acars_message_send",
              {
                key: "atisRequest",
                arguments: [this.facility.get(), this.opts[this.reqType.get()]]
              },
              true,
              false
            );
            [this.facility].forEach((e) => e.set(""));
            this.checkReady();
          }
          return true;
        }
      }).bind(this.send);
      this.facilityField = new import_msfs_sdk14.TextInputField(this, {
        formatter: new import_msfs_wt21_fmc12.StringInputFormat({
          nullValueString: "\u25A1\u25A1\u25A1\u25A1",
          maxLength: 4
        }),
        onSelected: async (scratchpadContents) => {
          this.facility.set(scratchpadContents);
          this.checkReady();
          return true;
        }
      }).bind(this.facility);
    }
    checkReady() {
      this.send.set(this.facility.get());
    }
    render() {
      return [
        [
          ["DL[blue]", "", "TWIP REQ[blue]"],
          ["FACILITY[blue]"],
          [this.facilityField],
          ["TYPE[blue]", ""],
          [this.typeSwitch],
          [],
          [],
          [],
          [],
          [""],
          ["", this.sendButton],
          [""],
          [
            import_msfs_sdk14.PageLinkField.createLink(this, "<RETURN", "/datalink-menu"),
            "",
            this.clockField
          ]
        ]
      ];
    }
  };

  // src/pages/PosReport.mjs
  var import_msfs_sdk15 = __require("@microsoft/msfs-sdk");
  var import_msfs_wt21_fmc13 = __require("@microsoft/msfs-wt21-fmc");
  var DatalinkPosReportPage = class extends import_msfs_wt21_fmc13.WT21FmcPage {
    constructor() {
      super(...arguments);
      try {
        this.clockField = import_msfs_wt21_fmc13.FmcCmuCommons.createClockField(this, this.bus);
        this.distance = import_msfs_sdk15.Subject.create(0);
        this.groundSpeed = import_msfs_sdk15.Subject.create(0);
        this.speed = import_msfs_sdk15.Subject.create(
          `${SimVar.GetSimVarValue("AIRSPEED MACH", "mach").toFixed(2)}`.substr(1)
        );
        this.speedField = new import_msfs_sdk15.TextInputField(this, {
          formatter: {
            nullValueString: ".--",
            maxLength: 3,
            format(value) {
              return `M${value}[blue]`;
            },
            async parse(input) {
              return input;
            }
          },
          onModified: async (scratchpadContents) => {
            if (scratchpadContents.startsWith("M"))
              scratchpadContents = scratchpadContents.substr(1);
            if (Number.isNaN(Number.parseInt(scratchpadContents))) return false;
            this.speed.set(scratchpadContents);
            this.checkReady();
            return true;
          }
        }).bind(this.speed);
        this.waypoint = import_msfs_sdk15.Subject.create("");
        this.waypointField = new import_msfs_sdk15.TextInputField(this, {
          formatter: {
            nullValueString: "-----",
            maxLength: 5,
            format(value) {
              return value ? `${value}[blue]` : this.nullValueString;
            },
            async parse(input) {
              return input;
            }
          },
          onModified: async (scratchpadContents) => {
            this.waypoint.set(scratchpadContents);
            this.checkReady();
            return true;
          }
        }).bind(this.waypoint);
        this.fWaypoint = import_msfs_sdk15.Subject.create("");
        this.fWaypointField = new import_msfs_sdk15.TextInputField(this, {
          formatter: {
            nullValueString: "-----",
            maxLength: 5,
            format(value) {
              return value ? `${value}[blue]` : this.nullValueString;
            },
            async parse(input) {
              return input;
            }
          },
          onModified: async (scratchpadContents) => {
            this.fWaypoint.set(scratchpadContents);
            this.checkReady();
            return true;
          }
        }).bind(this.fWaypoint);
        this.nWaypoint = import_msfs_sdk15.Subject.create("");
        this.nWaypointField = new import_msfs_sdk15.TextInputField(this, {
          formatter: {
            nullValueString: "-----",
            maxLength: 5,
            format(value) {
              return value ? `${value}[blue]` : this.nullValueString;
            },
            async parse(input) {
              return input;
            }
          },
          onModified: async (scratchpadContents) => {
            this.nWaypoint.set(scratchpadContents);
            this.checkReady();
            return true;
          }
        }).bind(this.nWaypoint);
        this.ata = import_msfs_sdk15.Subject.create(null);
        this.ataField = new import_msfs_sdk15.TextInputField(this, {
          formatter: {
            nullValueString: "--:--",
            maxLength: 5,
            format(value) {
              return value ? `${value.substr(0, 2)}:${value.substr(2)}[blue]` : this.nullValueString;
            },
            async parse(input) {
              return input.replace("Z", "");
            }
          },
          onModified: async (scratchpadContents) => {
            if (Number.isNaN(Number.parseInt(scratchpadContents))) return false;
            this.ata.set(scratchpadContents);
            this.checkReady();
            return true;
          }
        }).bind(this.ata);
        this.eta = import_msfs_sdk15.Subject.create(null);
        this.etaField = new import_msfs_sdk15.TextInputField(this, {
          formatter: {
            nullValueString: "--:--",
            maxLength: 5,
            format(value) {
              return value ? `${value.substr(0, 2)}:${value.substr(2)}[blue]` : this.nullValueString;
            },
            async parse(input) {
              return input.replace("Z", "");
            }
          },
          onModified: async (scratchpadContents) => {
            if (Number.isNaN(Number.parseInt(scratchpadContents))) return false;
            this.eta.set(scratchpadContents);
            this.checkReady();
            return true;
          }
        }).bind(this.eta);
        this.send = import_msfs_sdk15.Subject.create(false);
        this.station = import_msfs_sdk15.Subject.create(null);
        this.bus.getSubscriber().on("acars_station_status").handle((message) => {
          this.station.set(message.active);
          this.checkReady();
          this.invalidate();
        });
        this.stationField = new import_msfs_sdk15.DisplayField(this, {
          formatter: {
            nullValueString: "----",
            /** @inheritDoc */
            format(value) {
              return `${value}[blue]`;
            }
          }
        }).bind(this.station);
        fetchAcarsStatus(this.bus).then((res) => {
          this.station.set(res.active);
          this.invalidate();
        }).catch((err) => null);
        this.value = import_msfs_sdk15.Subject.create(null);
        this.levelField = new import_msfs_sdk15.TextInputField(this, {
          formatter: {
            nullValueString: "---",
            maxLength: 3,
            format(value) {
              return `FL${value}[blue]`;
            },
            async parse(input) {
              return input;
            }
          },
          onModified: async (scratchpadContents) => {
            if (scratchpadContents.startsWith("FL"))
              scratchpadContents = scratchpadContents.substr(2);
            if (Number.isNaN(Number.parseInt(scratchpadContents))) return false;
            this.value.set(scratchpadContents);
            this.checkReady();
            return true;
          }
        }).bind(this.value);
        this.sendButton = new import_msfs_sdk15.DisplayField(this, {
          formatter: {
            nullValueString: "SEND",
            /** @inheritDoc */
            format(value) {
              return `SEND[${value ? "blue" : "white"}]`;
            }
          },
          onSelected: async () => {
            if (this.send.get()) {
              const args = [
                this.value,
                this.speed,
                this.waypoint,
                this.ata,
                this.fWaypoint,
                this.eta,
                this.nWaypoint
              ];
              this.bus.getPublisher().pub(
                "acars_message_send",
                {
                  key: "sendPositionReport",
                  arguments: args.map((e) => e.get())
                },
                true,
                false
              );
              args.forEach((e) => e.set(null));
              this.checkReady();
            }
            return true;
          }
        }).bind(this.send);
        this.distanceSub = this.bus.getSubscriber().on("lnavdata_waypoint_distance").handle((v) => {
          this.distance.set(v);
        });
        this.speedSub = this.bus.getSubscriber().on("ground_speed").handle((v) => {
          this.groundSpeed.set(v);
        });
      } catch (err) {
        console.log(err);
      }
    }
    checkReady() {
      const array = [
        this.waypoint,
        this.fWaypoint,
        this.nWaypoint,
        this.ata,
        this.eta,
        this.speed,
        this.value,
        this.station
      ];
      this.send.set(
        !array.find((e) => {
          if (!e) return true;
          const v = e.get();
          return v === null || (typeof v === "string" ? v.length === 0 : false);
        })
      );
    }
    onDestroy() {
      this.speedSub.destroy();
      this.distanceSub.destroy();
    }
    onPause() {
    }
    onResume() {
      this.speed.set(`${SimVar.GetSimVarValue("AIRSPEED MACH", "mach").toFixed(2)}`.substr(1));
      this.updatePosData();
    }
    updatePosData() {
      const gs = this.groundSpeed.get();
      const distance = this.distance.get();
      const fp = this.fms.getPrimaryFlightPlan();
      if (!gs || !distance || !fp) return;
      {
        const activeLeg = fp.getLeg(fp.activeLateralLeg);
        if (activeLeg) this.waypoint.set(activeLeg.name);
      }
      {
        const activeLeg = fp.getLeg(fp.activeLateralLeg + 1);
        if (activeLeg) this.fWaypoint.set(activeLeg.name);
      }
      {
        const activeLeg = fp.getLeg(fp.activeLateralLeg + 2);
        if (activeLeg) this.nWaypoint.set(activeLeg.name);
      }
      {
        const time = /* @__PURE__ */ new Date();
        const rem = 60 * (distance / gs);
        time.setUTCHours(time.getUTCHours() + Math.floor(rem / 60));
        time.setUTCMinutes(time.getUTCMinutes() + Math.floor(rem % 60));
        this.ata.set(
          `${time.getUTCHours().toString().padStart(2, "0")}${time.getUTCMinutes().toString().padStart(2, "0")}`
        );
      }
      {
        const leg = fp.getLeg(fp.activeLateralLeg + 1);
        if (leg) {
          const time = /* @__PURE__ */ new Date();
          const rem = 60 * ((this.distance.get() + leg.calculated.distance / 1852) / this.groundSpeed.get());
          time.setUTCHours(time.getUTCHours() + Math.floor(rem / 60));
          time.setUTCMinutes(time.getUTCMinutes() + Math.floor(rem % 60));
          this.eta.set(
            `${time.getUTCHours().toString().padStart(2, "0")}${time.getUTCMinutes().toString().padStart(2, "0")}`
          );
        }
      }
      {
        const v = SimVar.GetSimVarValue("INDICATED ALTITUDE", "feet");
        this.value.set((v / 100).toFixed(0));
      }
      this.checkReady();
    }
    render() {
      return [
        [
          ["FANS[blue]", this.PagingIndicator, "POS REPORT[blue]"],
          ["MACH", "FL"],
          [this.speedField, this.levelField],
          ["OVHD", "ATA"],
          [this.waypointField, this.ataField],
          ["TO", "ETA"],
          [this.fWaypointField, this.etaField],
          ["NEXT", ""],
          [this.nWaypointField, ""],
          [],
          [this.stationField, this.sendButton],
          [],
          [
            import_msfs_sdk15.PageLinkField.createLink(this, "<RETURN", "/datalink-extra/fans"),
            "",
            this.clockField
          ]
        ]
      ];
    }
  };

  // src/pages/LevelPage.mjs
  var import_msfs_sdk16 = __require("@microsoft/msfs-sdk");
  var import_msfs_wt21_fmc14 = __require("@microsoft/msfs-wt21-fmc");
  var DatalinkLevelPage = class extends import_msfs_wt21_fmc14.WT21FmcPage {
    constructor(bus, screen, props, fms, baseInstrument, renderCallback) {
      super(bus, screen, props, fms, baseInstrument, renderCallback);
      this.clockField = import_msfs_wt21_fmc14.FmcCmuCommons.createClockField(this, this.bus);
      this.send = import_msfs_sdk16.Subject.create(false);
      this.value = import_msfs_sdk16.Subject.create("");
      this.reason = import_msfs_sdk16.Subject.create(0);
      this.unit = import_msfs_sdk16.Subject.create(0);
      this.opts = ["WEATHER", "A/C PERF"];
      this.units = ["CLIMB", "DESCEND"];
      this.station = import_msfs_sdk16.Subject.create(null);
      this.bus.getSubscriber().on("acars_station_status").handle((message) => {
        this.station.set(message.active);
        this.checkReady();
        this.invalidate();
      });
      this.stationField = new import_msfs_sdk16.DisplayField(this, {
        formatter: {
          nullValueString: "----",
          /** @inheritDoc */
          format(value) {
            return `${value}[blue]`;
          }
        }
      }).bind(this.station);
      fetchAcarsStatus(this.bus).then((res) => {
        this.station.set(res.active);
        this.invalidate();
      });
      for (let i = 0; i < 4; i++) {
        this[`freeText${i}`] = import_msfs_sdk16.Subject.create("");
        this[`freeTextField${i}`] = new import_msfs_sdk16.TextInputField(this, {
          formatter: new import_msfs_wt21_fmc14.StringInputFormat({
            nullValueString: "(----------------------)[blue]",
            maxLength: 24
          }),
          onSelected: async (scratchpadContents) => {
            this[`freeText${i}`].set(scratchpadContents);
            this.checkReady();
            return true;
          }
        }).bind(this[`freeText${i}`]);
      }
      this.sendButton = new import_msfs_sdk16.DisplayField(this, {
        formatter: {
          nullValueString: "SEND",
          /** @inheritDoc */
          format(value) {
            return `SEND[${value ? "blue" : "white"}]`;
          }
        },
        onSelected: async () => {
          if (this.send.get()) {
            const freeText = Array(4).fill().map((_, i) => this[`freeText${i}`].get()).filter((e) => e && e.length).join(" ");
            this.bus.getPublisher().pub(
              "acars_message_send",
              {
                key: "sendLevelChange",
                arguments: [
                  this.value.get(),
                  this.unit.get() === 0,
                  this.reason.get() === 0 ? "weather" : "performance",
                  freeText
                ]
              },
              true,
              false
            );
            [this.value].forEach((e) => e.set(""));
            Array(4).fill().forEach((_, i) => this[`freeText${i}`].set(""));
            this.checkReady();
          }
          return true;
        }
      }).bind(this.send);
      this.levelField = new import_msfs_sdk16.TextInputField(this, {
        formatter: new import_msfs_wt21_fmc14.StringInputFormat({
          nullValueString: "\u25A1\u25A1\u25A1",
          maxLength: 3,
          format(value) {
            return `FL${value}`;
          }
        }),
        onSelected: async (scratchpadContents) => {
          if (scratchpadContents.startsWith("FL"))
            scratchpadContents = scratchpadContents.substr(2);
          if (Number.isNaN(Number.parseInt(scratchpadContents))) return false;
          this.value.set(scratchpadContents);
          this.checkReady();
          return true;
        }
      }).bind(this.value);
      this.reasonField = new import_msfs_sdk16.SwitchLabel(this, {
        optionStrings: this.opts,
        activeStyle: "green"
      }).bind(this.reason);
      this.unitField = new import_msfs_sdk16.SwitchLabel(this, {
        optionStrings: this.units,
        activeStyle: "green"
      }).bind(this.unit);
    }
    checkReady() {
      const array = [this.value, this.station];
      this.send.set(
        !array.find((e) => {
          const v = e.get();
          return v === null || typeof v === "string" ? v.length === 0 : false;
        })
      );
    }
    render() {
      return [
        [
          ["FANS[blue]", this.PagingIndicator, "ALTITUDE REQ[blue]"],
          ["FL[blue]", "DIR[blue]"],
          [this.levelField, this.unitField],
          ["REASON[blue]"],
          [this.reasonField],
          [],
          [],
          [],
          [],
          [],
          [this.stationField, this.sendButton],
          [""],
          [
            import_msfs_sdk16.PageLinkField.createLink(this, "<RETURN", "/datalink-extra/cpdlc/request-menu"),
            "",
            this.clockField
          ]
        ],
        [
          ["FANS[blue]", this.PagingIndicator, "ALTITUDE REQ[blue]"],
          [" REMARKS[blue]"],
          [this.freeTextField0],
          [],
          [this.freeTextField1],
          [],
          [this.freeTextField2],
          [],
          [this.freeTextField3],
          [],
          [this.stationField, this.sendButton],
          [],
          [
            import_msfs_sdk16.PageLinkField.createLink(this, "<RETURN", "/datalink-extra/cpdlc/request-menu"),
            "",
            this.clockField
          ]
        ]
      ];
    }
  };

  // src/pages/SpeedPage.mjs
  var import_msfs_sdk17 = __require("@microsoft/msfs-sdk");
  var import_msfs_wt21_fmc15 = __require("@microsoft/msfs-wt21-fmc");
  var DatalinkSpeedPage = class extends import_msfs_wt21_fmc15.WT21FmcPage {
    constructor(bus, screen, props, fms, baseInstrument, renderCallback) {
      super(bus, screen, props, fms, baseInstrument, renderCallback);
      this.clockField = import_msfs_wt21_fmc15.FmcCmuCommons.createClockField(this, this.bus);
      this.send = import_msfs_sdk17.Subject.create(false);
      this.value = import_msfs_sdk17.Subject.create("");
      this.reason = import_msfs_sdk17.Subject.create(0);
      this.unit = import_msfs_sdk17.Subject.create(0);
      this.opts = ["WEATHER", "A/C PERF"];
      this.units = ["KTS", "MACH"];
      this.station = import_msfs_sdk17.Subject.create(null);
      this.bus.getSubscriber().on("acars_station_status").handle((message) => {
        this.station.set(message.active);
        this.checkReady();
        this.invalidate();
      });
      this.stationField = new import_msfs_sdk17.DisplayField(this, {
        formatter: {
          nullValueString: "----",
          /** @inheritDoc */
          format(value) {
            return `${value}[blue]`;
          }
        }
      }).bind(this.station);
      for (let i = 0; i < 4; i++) {
        this[`freeText${i}`] = import_msfs_sdk17.Subject.create("");
        this[`freeTextField${i}`] = new import_msfs_sdk17.TextInputField(this, {
          formatter: new import_msfs_wt21_fmc15.StringInputFormat({
            nullValueString: "(----------------------)[blue]",
            maxLength: 24
          }),
          onSelected: async (scratchpadContents) => {
            this[`freeText${i}`].set(scratchpadContents);
            this.checkReady();
            return true;
          }
        }).bind(this[`freeText${i}`]);
      }
      this.sendButton = new import_msfs_sdk17.DisplayField(this, {
        formatter: {
          nullValueString: "SEND",
          /** @inheritDoc */
          format(value) {
            return `SEND[${value ? "blue" : "white"}]`;
          }
        },
        onSelected: async () => {
          if (this.send.get()) {
            const freeText = Array(4).fill().map((_, i) => this[`freeText${i}`].get()).filter((e) => e && e.length).join(" ");
            this.bus.getPublisher().pub(
              "acars_message_send",
              {
                key: "sendSpeedChange",
                arguments: [
                  this.unit.get() === 0 ? "knots" : "mach",
                  this.value.get(),
                  this.reason.get() === 0 ? "weather" : "performance",
                  freeText
                ]
              },
              true,
              false
            );
            [this.value].forEach((e) => e.set(""));
            Array(4).fill().forEach((_, i) => this[`freeText${i}`].set(""));
            this.checkReady();
          }
          return true;
        }
      }).bind(this.send);
      fetchAcarsStatus(this.bus).then((res) => {
        this.station.set(res.active);
        this.invalidate();
      });
      this.speedField = new import_msfs_sdk17.TextInputField(this, {
        formatter: new import_msfs_wt21_fmc15.StringInputFormat({
          nullValueString: "----",
          maxLength: 4,
          format(value) {
            return `${this.unit.get() === 1 ? "M" : ""}${value}`;
          }
        }),
        onSelected: async (scratchpadContents) => {
          if (Number.isNaN(Number.parseFloat(scratchpadContents))) return false;
          this.value.set(scratchpadContents);
          this.checkReady();
          return true;
        }
      }).bind(this.value);
      this.reasonField = new import_msfs_sdk17.SwitchLabel(this, {
        optionStrings: this.opts,
        activeStyle: "green"
      }).bind(this.reason);
      this.unitField = new import_msfs_sdk17.SwitchLabel(this, {
        optionStrings: this.units,
        activeStyle: "green"
      }).bind(this.unit);
    }
    checkReady() {
      const array = [this.value, this.station];
      this.send.set(
        !array.find((e) => {
          const v = e.get();
          return typeof v === "string" ? v.length === 0 : false;
        })
      );
    }
    render() {
      return [
        [
          ["FANS[blue]", this.PagingIndicator, "SPEED REQ[blue]"],
          ["SPEED[blue]", "UNIT[blue]"],
          [this.speedField, this.unitField],
          ["REASON[blue]"],
          [this.reasonField],
          [],
          [],
          [],
          [],
          [""],
          [this.stationField, this.sendButton],
          [""],
          [
            import_msfs_sdk17.PageLinkField.createLink(this, "<RETURN", "/datalink-extra/cpdlc/request-menu"),
            "",
            this.clockField
          ]
        ],
        [
          ["FANS[blue]", this.PagingIndicator, "SPEED REQ[blue]"],
          [" REMARKS[blue]"],
          [this.freeTextField0],
          [],
          [this.freeTextField1],
          [],
          [this.freeTextField2],
          [],
          [this.freeTextField3],
          [],
          [this.stationField, this.sendButton],
          [""],
          [
            import_msfs_sdk17.PageLinkField.createLink(this, "<RETURN", "/datalink-extra/cpdlc/request-menu"),
            "",
            this.clockField
          ]
        ]
      ];
    }
  };

  // src/pages/RouteRequestPage.mjs
  var import_msfs_sdk18 = __require("@microsoft/msfs-sdk");
  var import_msfs_wt21_fmc16 = __require("@microsoft/msfs-wt21-fmc");
  var DatalinkDirectToPage = class extends import_msfs_wt21_fmc16.WT21FmcPage {
    constructor(bus, screen, props, fms, baseInstrument, renderCallback) {
      super(bus, screen, props, fms, baseInstrument, renderCallback);
      this.clockField = import_msfs_wt21_fmc16.FmcCmuCommons.createClockField(this, this.bus);
      this.facility = import_msfs_sdk18.Subject.create("");
      this.send = import_msfs_sdk18.Subject.create(false);
      this.reason = import_msfs_sdk18.Subject.create(0);
      this.opts = ["WEATHER", "A/C PERF"];
      this.station = import_msfs_sdk18.Subject.create(null);
      this.bus.getSubscriber().on("acars_station_status").handle((message) => {
        this.station.set(message.active);
        this.checkReady();
        this.invalidate();
      });
      this.stationField = new import_msfs_sdk18.DisplayField(this, {
        formatter: {
          nullValueString: "----",
          /** @inheritDoc */
          format(value) {
            return `${value}[blue]`;
          }
        }
      }).bind(this.station);
      for (let i = 0; i < 4; i++) {
        this[`freeText${i}`] = import_msfs_sdk18.Subject.create("");
        this[`freeTextField${i}`] = new import_msfs_sdk18.TextInputField(this, {
          formatter: new import_msfs_wt21_fmc16.StringInputFormat({
            nullValueString: "(----------------------)[blue]",
            maxLength: 24
          }),
          onSelected: async (scratchpadContents) => {
            this[`freeText${i}`].set(scratchpadContents);
            this.checkReady();
            return true;
          }
        }).bind(this[`freeText${i}`]);
      }
      fetchAcarsStatus(this.bus).then((res) => {
        this.station.set(res.active);
        this.invalidate();
      });
      this.sendButton = new import_msfs_sdk18.DisplayField(this, {
        formatter: {
          nullValueString: "SEND",
          /** @inheritDoc */
          format(value) {
            return `SEND[${value ? "blue" : "white"}]`;
          }
        },
        onSelected: async () => {
          if (this.send.get()) {
            const freeText = Array(4).fill().map((_, i) => this[`freeText${i}`].get()).filter((e) => e && e.length).join(" ");
            this.bus.getPublisher().pub(
              "acars_message_send",
              {
                key: "sendDirectTo",
                arguments: [
                  this.facility.get(),
                  this.reason.get() === 0 ? "weather" : "performance",
                  freeText
                ]
              },
              true,
              false
            );
            [this.facility].forEach((e) => e.set(""));
            Array(4).fill().forEach((_, i) => this[`freeText${i}`].set(""));
            this.checkReady();
          }
          return true;
        }
      }).bind(this.send);
      this.facilityField = new import_msfs_sdk18.TextInputField(this, {
        formatter: new import_msfs_wt21_fmc16.StringInputFormat({
          nullValueString: "-----",
          maxLength: 5
        }),
        onSelected: async (scratchpadContents) => {
          this.facility.set(scratchpadContents);
          this.checkReady();
          return true;
        }
      }).bind(this.facility);
      this.reasonField = new import_msfs_sdk18.SwitchLabel(this, {
        optionStrings: this.opts,
        activeStyle: "green"
      }).bind(this.reason);
    }
    checkReady() {
      const array = [this.facility, this.station];
      this.send.set(
        !array.find((e) => {
          const v = e.get();
          return !v || !v.length;
        })
      );
    }
    render() {
      return [
        [
          ["FANS[blue]", this.PagingIndicator, "ROUTE REQ[blue]"],
          ["WAYPOINT[blue]"],
          [this.facilityField],
          ["REASON[blue]"],
          [this.reasonField],
          [],
          [],
          [],
          [],
          [""],
          [this.stationField, this.sendButton],
          [""],
          [
            import_msfs_sdk18.PageLinkField.createLink(this, "<RETURN", "/datalink-extra/cpdlc/request-menu"),
            "",
            this.clockField
          ]
        ],
        [
          ["FANS[blue]", this.PagingIndicator, "ROUTE REQ[blue]"],
          [" REMARKS[blue]"],
          [this.freeTextField0],
          [],
          [this.freeTextField1],
          [],
          [this.freeTextField2],
          [],
          [this.freeTextField3],
          [],
          [this.stationField, this.sendButton],
          [""],
          [
            import_msfs_sdk18.PageLinkField.createLink(this, "<RETURN", "/datalink-extra/cpdlc/request-menu"),
            "",
            this.clockField
          ]
        ]
      ];
    }
  };

  // src/pages/TelexPage.mjs
  var import_msfs_sdk19 = __require("@microsoft/msfs-sdk");
  var import_msfs_wt21_fmc17 = __require("@microsoft/msfs-wt21-fmc");
  var DatalinkTelexPage = class extends import_msfs_wt21_fmc17.WT21FmcPage {
    constructor(bus, screen, props, fms, baseInstrument, renderCallback) {
      try {
        super(bus, screen, props, fms, baseInstrument, renderCallback);
        this.clockField = import_msfs_wt21_fmc17.FmcCmuCommons.createClockField(this, this.bus);
        this.facility = import_msfs_sdk19.Subject.create("");
        this.send = import_msfs_sdk19.Subject.create(false);
        for (let i = 0; i < 7; i++) {
          this[`freeText${i}`] = import_msfs_sdk19.Subject.create("");
          this[`freeTextField${i}`] = new import_msfs_sdk19.TextInputField(this, {
            formatter: new import_msfs_wt21_fmc17.StringInputFormat({
              nullValueString: "(----------------------)[blue]",
              maxLength: 24
            }),
            onSelected: async (scratchpadContents) => {
              this[`freeText${i}`].set(scratchpadContents);
              this.checkReady();
              return true;
            }
          }).bind(this[`freeText${i}`]);
        }
        this.sendButton = new import_msfs_sdk19.DisplayField(this, {
          formatter: {
            nullValueString: "SEND",
            /** @inheritDoc */
            format(value) {
              return `SEND[${value ? "blue" : "white"}]`;
            }
          },
          onSelected: async () => {
            if (this.send.get()) {
              const freeText = Array(7).fill().map((_, i) => this[`freeText${i}`].get()).filter((e) => e && e.length).join(" ");
              this.bus.getPublisher().pub(
                "acars_message_send",
                {
                  key: "sendTelex",
                  arguments: [this.facility.get(), freeText]
                },
                true,
                false
              );
              [this.facility].forEach((e) => e.set(""));
              Array(7).fill().forEach((_, i) => this[`freeText${i}`].set(""));
              this.checkReady();
            }
            return true;
          }
        }).bind(this.send);
        this.facilityField = new import_msfs_sdk19.TextInputField(this, {
          formatter: new import_msfs_wt21_fmc17.StringInputFormat({
            nullValueString: "-------",
            maxLength: 7
          }),
          onSelected: async (scratchpadContents) => {
            this.facility.set(scratchpadContents);
            this.checkReady();
            return true;
          }
        }).bind(this.facility);
      } catch (err) {
        console.log("error");
      }
    }
    checkReady() {
      const array = [this.facility];
      const freeText = Array(7).fill().map((_, i) => this[`freeText${i}`].get()).filter((e) => e && e.length).join(" ");
      this.send.set(
        freeText.length && !array.find((e) => {
          const v = e.get();
          return !v || !v.length;
        })
      );
    }
    render() {
      return [
        [
          ["FANS[blue]", this.PagingIndicator, "FREE TEXT[blue]"],
          ["FACILITY[blue]"],
          [this.facilityField],
          [" REMARKS[blue]"],
          [this.freeTextField0],
          [],
          [this.freeTextField1],
          [],
          [this.freeTextField2],
          [],
          ["", this.sendButton],
          [],
          [
            import_msfs_sdk19.PageLinkField.createLink(this, "<RETURN", "/datalink-extra/fans"),
            "",
            this.clockField
          ]
        ],
        [
          ["FANS[blue]", this.PagingIndicator, "FREE TEXT[blue]"],
          [" REMARKS[blue]"],
          [this.freeTextField3],
          [],
          [this.freeTextField4],
          [],
          [this.freeTextField5],
          [],
          [this.freeTextField6],
          [],
          ["", this.sendButton],
          [""],
          [
            import_msfs_sdk19.PageLinkField.createLink(this, "<RETURN", "/datalink-extra/fans"),
            "",
            this.clockField
          ]
        ]
      ];
    }
  };

  // src/pages/PdcPage.mjs
  var import_msfs_sdk20 = __require("@microsoft/msfs-sdk");
  var import_msfs_wt21_fmc18 = __require("@microsoft/msfs-wt21-fmc");
  var import_msfs_wt21_shared3 = __require("@microsoft/msfs-wt21-shared");
  var DatalinkPreDepartureRequestPage = class extends import_msfs_wt21_fmc18.WT21FmcPage {
    constructor(bus, screen, props, fms, baseInstrument, renderCallback) {
      super(bus, screen, props, fms, baseInstrument, renderCallback);
      this.clockField = import_msfs_wt21_fmc18.FmcCmuCommons.createClockField(this, this.bus);
      this.flightId = import_msfs_sdk20.Subject.create("");
      this.facility = import_msfs_sdk20.Subject.create("");
      this.acType = import_msfs_sdk20.Subject.create("P180");
      this.atis = import_msfs_sdk20.Subject.create("");
      this.dep = import_msfs_sdk20.Subject.create("");
      this.arr = import_msfs_sdk20.Subject.create("");
      this.gate = import_msfs_sdk20.Subject.create("");
      this.send = import_msfs_sdk20.Subject.create(false);
      for (let i = 0; i < 4; i++) {
        this[`freeText${i}`] = import_msfs_sdk20.Subject.create("");
        this[`freeTextField${i}`] = new import_msfs_sdk20.TextInputField(this, {
          formatter: new import_msfs_wt21_fmc18.StringInputFormat({
            nullValueString: "(----------------------)[blue]",
            maxLength: 24
          }),
          onSelected: async (scratchpadContents) => {
            this[`freeText${i}`].set(scratchpadContents);
            this.checkReady();
            return true;
          }
        }).bind(this[`freeText${i}`]);
      }
      this.sendButton = new import_msfs_sdk20.DisplayField(this, {
        formatter: {
          nullValueString: "SEND",
          /** @inheritDoc */
          format(value) {
            return `SEND[${value ? "blue" : "white"}]`;
          }
        },
        onSelected: async () => {
          if (this.send.get()) {
            const freeText = Array(4).fill().map((_, i) => this[`freeText${i}`].get()).filter((e) => e && e.length).join(" ");
            this.bus.getPublisher().pub(
              "acars_message_send",
              {
                key: "sendPdc",
                arguments: [
                  this.facility.get(),
                  this.dep.get(),
                  this.arr.get(),
                  this.gate.get(),
                  this.atis.get(),
                  freeText
                ]
              },
              true,
              false
            );
            [this.atis, this.facility, this.gate].forEach((e) => e.set(""));
            Array(4).fill().forEach((_, i) => this[`freeText${i}`].set(""));
            this.checkReady();
          }
          return true;
        }
      }).bind(this.send);
      this.flightIdField = new import_msfs_sdk20.TextInputField(this, {
        formatter: new import_msfs_wt21_fmc18.StringInputFormat({
          nullValueString: "-------",
          maxLength: 7
        }),
        onSelected: async (scratchpadContents) => {
          this.flightId.set(scratchpadContents);
          this.checkReady();
          return true;
        }
      }).bind(this.flightId);
      this.facilityField = new import_msfs_sdk20.TextInputField(this, {
        formatter: new import_msfs_wt21_fmc18.StringInputFormat({
          nullValueString: "----",
          maxLength: 4
        }),
        onSelected: async (scratchpadContents) => {
          this.facility.set(scratchpadContents);
          this.checkReady();
          return true;
        }
      }).bind(this.facility);
      this.acTypeField = new import_msfs_sdk20.TextInputField(this, {
        formatter: new import_msfs_wt21_fmc18.StringInputFormat({
          nullValueString: "----",
          maxLength: 4
        }),
        onSelected: async (scratchpadContents) => {
          this.acType.set(scratchpadContents);
          return true;
        }
      }).bind(this.acType);
      this.atisField = new import_msfs_sdk20.TextInputField(this, {
        formatter: new import_msfs_wt21_fmc18.StringInputFormat({ nullValueString: "-", maxLength: 1 }),
        onSelected: async (scratchpadContents) => {
          this.atis.set(scratchpadContents);
          this.checkReady();
          return true;
        }
      }).bind(this.atis);
      this.depField = new import_msfs_sdk20.TextInputField(this, {
        formatter: new import_msfs_wt21_fmc18.StringInputFormat({
          nullValueString: "----",
          maxLength: 4
        }),
        onSelected: async (scratchpadContents) => {
          this.dep.set(scratchpadContents);
          this.checkReady();
          return true;
        }
      }).bind(this.dep);
      this.arrField = new import_msfs_sdk20.TextInputField(this, {
        formatter: new import_msfs_wt21_fmc18.StringInputFormat({
          nullValueString: "----",
          maxLength: 4
        }),
        onSelected: async (scratchpadContents) => {
          this.arr.set(scratchpadContents);
          this.checkReady();
          return true;
        }
      }).bind(this.arr);
      this.gateField = new import_msfs_sdk20.TextInputField(this, {
        formatter: new import_msfs_wt21_fmc18.StringInputFormat({
          nullValueString: "-------",
          maxLength: 7
        }),
        onSelected: async (scratchpadContents) => {
          this.gate.set(scratchpadContents);
          this.checkReady();
          return true;
        }
      }).bind(this.gate);
      this.bus.getSubscriber().on("fplOriginDestChanged").handle((evt) => {
        switch (evt.type) {
          case import_msfs_sdk20.OriginDestChangeType.OriginAdded: {
            if (evt.airport) {
              this.fms.facLoader.getFacility(
                import_msfs_sdk20.ICAO.getFacilityType(evt.airport),
                evt.airport
              ).then((airport) => {
                this.dep.set(airport.icaoStruct.ident);
              });
            }
            break;
          }
          case import_msfs_sdk20.OriginDestChangeType.DestinationAdded: {
            if (evt.airport) {
              this.fms.facLoader.getFacility(
                import_msfs_sdk20.ICAO.getFacilityType(evt.airport),
                evt.airport
              ).then((airport) => {
                this.arr.set(airport.icaoStruct.ident);
                this.flightId.set(
                  import_msfs_wt21_shared3.FmcUserSettings.getManager(this.bus).getSetting("flightNumber").get()
                );
              });
            }
            break;
          }
        }
      });
      this.flightId.set(
        import_msfs_wt21_shared3.FmcUserSettings.getManager(this.bus).getSetting("flightNumber").get()
      );
      if (this.fms.getPlanForFmcRender().destinationAirportIcao)
        this.arr.set(this.fms.getPlanForFmcRender().destinationAirportIcao.ident);
      if (this.fms.getPlanForFmcRender().originAirportIcao)
        this.dep.set(this.fms.getPlanForFmcRender().originAirportIcao.ident);
    }
    checkReady() {
      const array = [this.dep, this.arr, this.flightId, this.atis, this.facility];
      this.send.set(
        !array.find((e) => {
          const v = e.get();
          return !v || !v.length;
        })
      );
    }
    render() {
      return [
        [
          ["DL[blue]", this.PagingIndicator, "DEPART CLX[blue]"],
          ["ATS FLT ID[blue]", "FACILITY[blue]"],
          [this.flightIdField, this.facilityField],
          ["A/C TYPE[blue]", "ATIS[blue]"],
          [this.acTypeField, this.atisField],
          ["ORIG STA[blue]", "DEST STA[blue]"],
          [this.depField, this.arrField],
          ["GATE[blue]"],
          [this.gateField],
          [""],
          ["", this.sendButton],
          [""],
          [
            import_msfs_sdk20.PageLinkField.createLink(this, "<RETURN", "/datalink-menu"),
            "",
            this.clockField
          ]
        ],
        [
          ["DL[blue]", this.PagingIndicator, "DEPART CLX[blue]"],
          [" REMARKS[blue]"],
          [this.freeTextField0],
          [],
          [this.freeTextField1],
          [],
          [this.freeTextField2],
          [],
          [this.freeTextField3],
          [],
          ["", this.sendButton],
          [""],
          [
            import_msfs_sdk20.PageLinkField.createLink(this, "<RETURN", "/datalink-menu"),
            "",
            this.clockField
          ]
        ]
      ];
    }
  };

  // src/pages/OceanicClearance.mjs
  var import_msfs_sdk21 = __require("@microsoft/msfs-sdk");
  var import_msfs_wt21_fmc19 = __require("@microsoft/msfs-wt21-fmc");
  var import_msfs_wt21_shared4 = __require("@microsoft/msfs-wt21-shared");
  var DatalinkOceanicRequestPage = class extends import_msfs_wt21_fmc19.WT21FmcPage {
    constructor(bus, screen, props, fms, baseInstrument, renderCallback) {
      super(bus, screen, props, fms, baseInstrument, renderCallback);
      this.clockField = import_msfs_wt21_fmc19.FmcCmuCommons.createClockField(this, this.bus);
      this.flightId = import_msfs_sdk21.Subject.create(import_msfs_wt21_shared4.FmcUserSettings.getManager(this.bus).getSetting("flightNumber").get());
      this.facility = import_msfs_sdk21.Subject.create("");
      this.entryPoint = import_msfs_sdk21.Subject.create("");
      this.time = import_msfs_sdk21.Subject.create("");
      this.mach = import_msfs_sdk21.Subject.create("");
      this.fltLvl = import_msfs_sdk21.Subject.create("");
      this.send = import_msfs_sdk21.Subject.create(false);
      for (let i = 0; i < 4; i++) {
        this[`freeText${i}`] = import_msfs_sdk21.Subject.create("");
        this[`freeTextField${i}`] = new import_msfs_sdk21.TextInputField(this, {
          formatter: new import_msfs_wt21_fmc19.StringInputFormat({
            nullValueString: "(----------------------)[blue]",
            maxLength: 24
          }),
          onSelected: async (scratchpadContents) => {
            this[`freeText${i}`].set(scratchpadContents);
            this.checkReady();
            return true;
          }
        }).bind(this[`freeText${i}`]);
      }
      this.sendButton = new import_msfs_sdk21.DisplayField(this, {
        formatter: {
          nullValueString: "SEND",
          /** @inheritDoc */
          format(value) {
            return `SEND[${value ? "blue" : "white"}]`;
          }
        },
        onSelected: async () => {
          if (this.send.get()) {
            const freeText = Array(4).fill().map((_, i) => this[`freeText${i}`].get()).filter((e) => e && e.length).join(" ");
            this.bus.getPublisher().pub(
              "acars_message_send",
              {
                key: "sendOceanicClearance",
                arguments: [
                  this.flightId.get(),
                  this.facility.get(),
                  this.entryPoint.get(),
                  this.time.get(),
                  this.fltLvl.get(),
                  this.mach.get(),
                  freeText
                ]
              },
              true,
              false
            );
            [
              this.facility,
              this.entryPoint,
              this.time,
              this.fltLvl,
              this.mach
            ].forEach((e) => e.set(""));
            Array(4).fill().forEach((_, i) => this[`freeText${i}`].set(""));
            this.checkReady();
          }
          return true;
        }
      }).bind(this.send);
      this.flightIdField = new import_msfs_sdk21.TextInputField(this, {
        formatter: new import_msfs_wt21_fmc19.StringInputFormat({
          nullValueString: "-------",
          maxLength: 7
        }),
        onSelected: async (scratchpadContents) => {
          this.flightId.set(scratchpadContents);
          this.checkReady();
          return true;
        }
      }).bind(this.flightId);
      this.facilityField = new import_msfs_sdk21.TextInputField(this, {
        formatter: new import_msfs_wt21_fmc19.StringInputFormat({
          nullValueString: "----",
          maxLength: 4
        }),
        onSelected: async (scratchpadContents) => {
          this.facility.set(scratchpadContents);
          this.checkReady();
          return true;
        }
      }).bind(this.facility);
      this.entryPointField = new import_msfs_sdk21.TextInputField(this, {
        formatter: new import_msfs_wt21_fmc19.StringInputFormat({
          nullValueString: "-----",
          maxLength: 5
        }),
        onSelected: async (scratchpadContents) => {
          this.entryPoint.set(scratchpadContents);
          this.checkReady();
          return true;
        }
      }).bind(this.entryPoint);
      this.timeField = new import_msfs_sdk21.TextInputField(this, {
        formatter: new import_msfs_wt21_fmc19.StringInputFormat({
          nullValueString: "\u25A1\u25A1:\u25A1\u25A1",
          maxLength: 5
        }),
        onSelected: async (scratchpadContents) => {
          if (!scratchpadContents.length === 4 || Number.isNaN(Number.parseInt(scratchpadContents))) {
            return false;
          }
          this.time.set(
            `${scratchpadContents.substr(0, 2)}:${scratchpadContents.substr(2)}`
          );
          this.checkReady();
          return true;
        }
      }).bind(this.time);
      this.machField = new import_msfs_sdk21.TextInputField(this, {
        formatter: new import_msfs_wt21_fmc19.StringInputFormat({
          nullValueString: ".\u25A1\u25A1",
          maxLength: 3
        }),
        onSelected: async (scratchpadContents) => {
          if (!scratchpadContents.length > 3 || Number.isNaN(Number.parseFloat("0" + scratchpadContents))) {
            return false;
          }
          this.mach.set(`.${scratchpadContents.replace(".", "")}`);
          this.checkReady();
          return true;
        }
      }).bind(this.mach);
      this.fltLvlField = new import_msfs_sdk21.TextInputField(this, {
        formatter: new import_msfs_wt21_fmc19.StringInputFormat({
          nullValueString: "\u25A1\u25A1\u25A1",
          maxLength: 3
        }),
        onSelected: async (scratchpadContents) => {
          if (!scratchpadContents.length > 3 || Number.isNaN(Number.parseInt(scratchpadContents))) {
            return false;
          }
          this.fltLvl.set(scratchpadContents);
          this.checkReady();
          return true;
        }
      }).bind(this.fltLvl);
      import_msfs_wt21_shared4.FmcUserSettings.getManager(bus).getSetting("flightNumber").sub((value) => {
        this.flightId.set(value);
        this.invalidate();
      });
    }
    checkReady() {
      const array = [
        this.facility,
        this.flightId,
        this.entryPoint,
        this.time,
        this.mach,
        this.fltLvl
      ];
      this.send.set(
        !array.find((e) => {
          const v = e.get();
          return !v || !v.length;
        })
      );
    }
    render() {
      return [
        [
          ["DL[blue]", this.PagingIndicator, "OCEANIC CLX[blue]"],
          ["ATS FLT ID[blue]", "FACILITY[blue]"],
          [this.flightIdField, this.facilityField],
          ["ENRTY POINT[blue]", "AT TIME[blue]"],
          [this.entryPointField, this.timeField],
          ["MACH[blue]", "FLT LEVEL[blue]"],
          [this.machField, this.fltLvlField],
          [""],
          [],
          [""],
          ["", this.sendButton],
          [""],
          [
            import_msfs_sdk21.PageLinkField.createLink(this, "<RETURN", "/datalink-menu"),
            "",
            this.clockField
          ]
        ],
        [
          ["DL[blue]", this.PagingIndicator, "OCEANIC CLX[blue]"],
          [" REMARKS[blue]"],
          [this.freeTextField0],
          [],
          [this.freeTextField1],
          [],
          [this.freeTextField2],
          [],
          [this.freeTextField3],
          [],
          ["", this.sendButton],
          [""],
          [
            import_msfs_sdk21.PageLinkField.createLink(this, "<RETURN", "/datalink-menu"),
            "",
            this.clockField
          ]
        ]
      ];
    }
  };

  // src/app.mjs
  var import_msfs_wt21_shared5 = __require("@microsoft/msfs-wt21-shared");

  // src/RouteMenuExtension.mjs
  var import_msfs_sdk22 = __require("@microsoft/msfs-sdk");
  var import_msfs_wt21_fmc20 = __require("@microsoft/msfs-wt21-fmc");
  var RouteMenuExtension = class extends import_msfs_sdk22.AbstractFmcPageExtension {
    constructor(page) {
      super(page);
      this.simbriefId = import_msfs_sdk22.Subject.create(GetStoredData("h800xp_acars_simbrief_id"));
      this.text = import_msfs_sdk22.Subject.create("FPLN RECALL");
      this.fetching = false;
      page.bus.getSubscriber().on("simbrief_id").handle((v) => {
        this.simbriefId.set(v);
      });
      page.bus.getSubscriber().on("h800xp_acars_fetch_fplan_done").handle((v) => {
        this.fetching = false;
        this.text.set("FPLN RECALL");
        if (v.res) {
          this.page.screen.navigateTo(
            `/route`
          );
        }
      });
      this.simbriefField = new import_msfs_sdk22.DisplayField(this.page, {
        formatter: {
          nullValueString: "<FPLN RECALL[disabled]",
          /** @inheritDoc */
          format(value) {
            return `<${value}`;
          }
        },
        onSelected: async () => {
          if (this.fetching)
            return true;
          this.fetching = true;
          this.text.set("FPLN UPLK LOAD...[disabled]");
          page.bus.getPublisher().pub("h800xp_acars_fetch_fplan", null, true, false);
          return true;
        }
      }).bind(this.text);
    }
    onPageRendered(renderedTemplates) {
      const elem = this.simbriefId.get();
      renderedTemplates[0][6] = [
        elem && elem.length ? this.simbriefField : "<FPLN RECALL[disabled]"
      ];
    }
  };
  var RouteMenuExtension_default = RouteMenuExtension;

  // src/app.mjs
  var P180Acars = class extends import_msfs_wt21_fmc21.WT21FmcAvionicsPlugin {
    constructor(binder) {
      super(binder);
      this.binder = binder;
    }
    isP180() {
      if (this.cached !== void 0) return this.cached;
      const xml = document.querySelector("wt21-fmc").xmlConfig;
      console.log(new XMLSerializer().serializeToString(xml));
      if (xml && new XMLSerializer().serializeToString(xml).toLowerCase().includes("ffx_p180_2024")) {
        return this.cached = true;
      }
      this.cached = false;
      return this.cached;
    }
    onInit() {
    }
    onInstalled() {
    }
    registerFmcExtensions(context) {
      if (!this.isP180()) {
        return;
      }
      this.renderer = context.renderer;
      this.cduRenderer = new CduRenderer_default(this.renderer, this.binder);
      context.addPluginPageRoute(
        "/datalink-extra/atis",
        DatalinkAtisPage,
        void 0,
        {}
      );
      context.addPluginPageRoute(
        "/datalink-extra/twip",
        DatalinkTwipPage,
        void 0,
        {}
      );
      context.addPluginPageRoute("/datalink-extra/fans", FansPage, void 0, {});
      context.addPluginPageRoute(
        "/datalink-extra/cpdlc/request-menu",
        FansRequestPage,
        void 0,
        {}
      );
      context.addPluginPageRoute(
        "/datalink-extra/send-msgs",
        DatalinkSendMessagesPage,
        void 0,
        {}
      );
      context.addPluginPageRoute(
        "/datalink-extra/cpdlc/messages",
        DatalinkCombinedMessagesPage,
        void 0,
        {}
      );
      context.addPluginPageRoute(
        "/datalink-extra/recv-msgs",
        DatalinkReceivedMessagesPage,
        void 0,
        {}
      );
      context.addPluginPageRoute(
        "/datalink-extra/message",
        DatalinkMessagePage,
        void 0,
        {}
      );
      context.addPluginPageRoute(
        "/datalink-extra/cpdlc/status",
        CpdlcStatusPage,
        void 0,
        {}
      );
      context.addPluginPageRoute(
        "/datalink-extra/posrep",
        DatalinkPosReportPage,
        void 0,
        {}
      );
      context.addPluginPageRoute(
        "/datalink-extra/cpdlc/direct",
        DatalinkDirectToPage,
        void 0,
        {}
      );
      context.addPluginPageRoute(
        "/datalink-extra/cpdlc/level",
        DatalinkLevelPage,
        void 0,
        {}
      );
      context.addPluginPageRoute(
        "/datalink-extra/cpdlc/speed",
        DatalinkSpeedPage,
        void 0,
        {}
      );
      context.addPluginPageRoute(
        "/datalink-extra/telex",
        DatalinkTelexPage,
        void 0,
        {}
      );
      context.addPluginPageRoute(
        "/datalink-extra/oceanic",
        DatalinkOceanicRequestPage,
        void 0,
        {}
      );
      context.addPluginPageRoute(
        "/datalink-extra/predep",
        DatalinkPreDepartureRequestPage,
        void 0,
        {}
      );
      context.attachPageExtension(import_msfs_wt21_fmc21.UserSettingsPage, SettingsExtension_default);
      context.attachPageExtension(import_msfs_wt21_fmc21.DataLinkMenuPage, DataLinkPageExtension_default);
      context.attachPageExtension(import_msfs_wt21_fmc21.IndexPage, IndexPageExtension_default);
      context.attachPageExtension(import_msfs_wt21_fmc21.RouteMenuPage, RouteMenuExtension_default);
      if (this.binder.isPrimaryInstrument) {
        import_msfs_wt21_shared5.MessageDefinitions.definitions.set("800xp_acars_dl_message", new import_msfs_wt21_shared5.OperatingMessage([new import_msfs_wt21_shared5.MessageDefinition("DL MESSAGE", import_msfs_wt21_shared5.MESSAGE_TARGET.FMC)], import_msfs_wt21_shared5.MESSAGE_LEVEL.White, 60));
        import_msfs_wt21_shared5.MessageDefinitions.definitions.set("800xp_acars_atc_message", new import_msfs_wt21_shared5.OperatingMessage([new import_msfs_wt21_shared5.MessageDefinition("ATC MESSAGE", import_msfs_wt21_shared5.MESSAGE_TARGET.FMC)], import_msfs_wt21_shared5.MESSAGE_LEVEL.White, 60));
        import_msfs_wt21_shared5.MessageDefinitions.definitions.set("800xp_acars_atc_message_pfd", new import_msfs_wt21_shared5.OperatingMessage([new import_msfs_wt21_shared5.MessageDefinition("ATC MESSAGE", import_msfs_wt21_shared5.MESSAGE_TARGET.MAP_MID)], import_msfs_wt21_shared5.MESSAGE_LEVEL.White, 60));
        this.client = AcarsService_default(this.binder.bus, this.binder.fms.facLoader);
      }
    }
  };
  (0, import_msfs_sdk23.registerPlugin)(P180Acars);
})();
