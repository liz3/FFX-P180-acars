import wt21Shared, { FmcUserSettings } from "@microsoft/msfs-wt21-shared";
import { createClient } from "./Hoppie.mjs";
import { FlightPlanRouteManager } from "@microsoft/msfs-sdk";
import loadSimbriefFlightPlan from "./SimbriefFplan.mjs";

const acars = {
  client: null,
  messages: [],
  casState: {
    dl: false,
    atc: false,
    atc_pfd: false,
  },
};
const updateReadState = (bus, id) => {
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
export const fetchAcarsMessages = (bus, dir, type = "aoc") => {
  return new Promise((resolve) => {
    const sub = bus
      .getSubscriber()
      .on(`acars_messages_${dir}_response`)
      .handle((v) => {
        sub.destroy();
        resolve(v.messages);
      });
    bus.getPublisher().pub(`acars_messages_${dir}`, { type }, true, false);
  });
};

export const fetchAcarsStatus = (bus) => {
  return new Promise((resolve) => {
    const sub = bus
      .getSubscriber()
      .on(`acars_status_response`)
      .handle((v) => {
        sub.destroy();
        resolve(v);
      });
    bus.getPublisher().pub(`acars_status_req`, null, true, false);
  });
};

export const deleteMessage = (bus, id) => {
  bus.getPublisher().pub(`acars_del_msg`, id, true, false);
};
export const getAtcCallsign = async () => {
  try {
    const id = GetStoredData("h800xp_acars_simbrief_id");
    if (id && id.length) {
      const response = await fetch(
        `https://www.simbrief.com/api/xml.fetcher.php?json=1&userid=${id}`,
      );
      const json = await response.json();
      if (json.atc) return json.atc.callsign;
    }
  } catch (err) {}
  return null;
};
const correctNetwork = {
  hopppie: "hoppie",
  batc: "beyondatc",
  "sayi.ai": "sayintentions",
};
let soundTm = null;
const initClient = (callsign, publisher) => {
  acars.client = createClient(
    GetStoredData("h800xp_acars_hoppie_code"),
    callsign,
    "P180",
    (message) => {
      acars.messages.push(message);
      if (message.type === "send") {
        publisher.pub("acars_outgoing_message", message, true, false);
      } else {
        console.log(message, acars)
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
    GetStoredData("h800xp_acars_network_setting")
      ? correctNetwork[
          GetStoredData("h800xp_acars_network_setting").toLowerCase()
        ]
      : "hoppie",
  );
  acars.client._stationCallback = (opt) => {
    publisher.pub("acars_station_status", opt, true, false);
  };
};
const acarsService = (bus, facLoader) => {
  const publisher = bus.getPublisher();
  bus
    .getSubscriber()
    .on("acars_message_send")
    .handle((v) => {
      if (acars.client)
        acars.client[v.key].apply(
          this,
          Array.isArray(v.arguments) ? v.arguments : Object.value(v.arguments),
        );
      return true;
    });
  bus
    .getSubscriber()
    .on("acars_message_ack")
    .handle((v) => {
      if (acars.client) {
        const message = acars.messages.find((e) => e._id === v.id);
        if (message) {
          message.response(v.option);
          // updateReadState(bus, v.id);
          publisher.pub(
            "acars_message_state_update",
            {
              id: v.id,
              option: v.option,
            },
            true,
            false,
          );
        }
      }
      return true;
    });
  bus
    .getSubscriber()
    .on("acars_read_state")
    .handle((v) => {
      updateReadState(bus, v.id);
      return true;
    });
  bus
    .getSubscriber()
    .on("acars_messages_send")
    .handle((v) => {
      publisher.pub(
        "acars_messages_send_response",
        {
          messages: acars.messages.filter(
            (e) =>
              e.type === "send" &&
              (v.type === "aoc"
                ? !e.cpdlc
                : e.cpdlc),
          ),
        },
        true,
        false,
      );
      return true;
    });
  bus
    .getSubscriber()
    .on("acars_status_req")
    .handle((v) => {
      publisher.pub(
        "acars_status_response",
        {
          active: acars.client ? acars.client.active_station : null,
          pending: acars.client ? acars.client.pending_station : null,
        },
        true,
        false,
      );
      return true;
    });
  bus
    .getSubscriber()
    .on("acars_del_msg")
    .handle((v) => {
      acars.messages = acars.messages.filter((e) => e._id !== v);
      publisher.pub("acars_message_removal", v, true, false);
      return true;
    });
  bus
    .getSubscriber()
    .on("acars_messages_recv")
    .handle((v) => {
      publisher.pub(
        "acars_messages_recv_response",
        {
          messages: acars.messages.filter(
            (e) =>
              e.type !== "send" &&
              (v.type === "aoc"
                ? !e.cpdlc
                : e.cpdlc),
          ),
        },
        true,
        false,
      );
      return true;
    });
  bus
    .getSubscriber()
    .on("acars_messages_all")
    .handle((v) => {
      publisher.pub(
        "acars_messages_all_response",
        {
          messages: acars.messages.filter((e) =>
            v.type === "aoc" ? e.cpdlc === undefined : e.cpdlc,
          ),
        },
        true,
        false,
      );
      return true;
    });
  bus
    .getSubscriber()
    .on("h800xp_acars_network_setting")
    .handle((v) => {
      const callsign = acars.client ? acars.client.callsign : null;
      if (callsign) initClient(callSign, publisher);

      return true;
    });

  bus
    .getSubscriber()
    .on("h800xp_acars_fetch_fplan")
    .handle((v) => {
      if (acars.fetchingSb)
        return true;
      acars.fetchingSb = true;
      loadSimbriefFlightPlan(facLoader, { fileWithAtc: false, useAirways: false }).then((result) => {
        if (result.ok) {
          if (result.ofp.atc && result.ofp.atc.callsign) {
            FmcUserSettings.getManager(bus)
              .getSetting("flightNumber")
              .set(result.ofp.atc.callsign);
          }
        }
        acars.fetchingSb = false;
        publisher.pub(
          "h800xp_acars_fetch_fplan_done",
          {res: result.ok},
          true,
          false,
        );
      }).catch(() => {
        acars.fetchingSb = false;
        publisher.pub(
          "h800xp_acars_fetch_fplan_done",
          {res: false},
          true,
          false,
        );
      })
      return true;
    });



  wt21Shared.FmcUserSettings.getManager(bus)
    .getSetting("flightNumber")
    .sub((value) => {
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

export default acarsService;
