import { DisplayField, PageLinkField, Subject, TextInputField } from "@microsoft/msfs-sdk";
import { FmcCmuCommons, WT21FmcPage } from "@microsoft/msfs-wt21-fmc";
import { fetchAcarsStatus } from "../AcarsService.mjs";

export default class DatalinkPosReportPage extends WT21FmcPage {
  constructor() {
    super(...arguments);
    try {
      this.clockField = FmcCmuCommons.createClockField(this, this.bus);
      this.distance = Subject.create(0);
      this.groundSpeed = Subject.create(0);

      this.speed = Subject.create(
        `${SimVar.GetSimVarValue("AIRSPEED MACH", "mach").toFixed(2)}`.substr(1),
      );
      this.speedField = new TextInputField(this, {
        formatter: {
          nullValueString: ".--",
          maxLength: 3,
          format(value) {
            return `M${value}[blue]`;
          },
          async parse(input) {
            return input;
          },
        },
        onModified: async (scratchpadContents) => {
          if (scratchpadContents.startsWith("M"))
            scratchpadContents = scratchpadContents.substr(1);
          if (Number.isNaN(Number.parseInt(scratchpadContents))) return false;
          this.speed.set(scratchpadContents);
          this.checkReady();
          return true;
        },
      }).bind(this.speed);
      // const fp = this.fms.getPrimaryFlightPlan();
      // const activeLeg = fp ? fp.getLeg(fp.activeLateralLeg) : null;
      this.waypoint = Subject.create("");
      this.waypointField = new TextInputField(this, {
        formatter: {
          nullValueString: "-----",
          maxLength: 5,
          format(value) {
            return value ? `${value}[blue]` : this.nullValueString;
          },
          async parse(input) {
            return input;
          },
        },
        onModified: async (scratchpadContents) => {
          this.waypoint.set(scratchpadContents);
          this.checkReady();
          return true;
        },
      }).bind(this.waypoint);
      // const activeLeg2 = fp ? fp.getLeg(fp.activeLateralLeg + 1) : null;
      this.fWaypoint = Subject.create("");
      this.fWaypointField = new TextInputField(this, {
        formatter: {
          nullValueString: "-----",
          maxLength: 5,
          format(value) {
            return value ? `${value}[blue]` : this.nullValueString;
          },
          async parse(input) {
            return input;
          },
        },
        onModified: async (scratchpadContents) => {
          this.fWaypoint.set(scratchpadContents);
          this.checkReady();
          return true;
        },
      }).bind(this.fWaypoint);

      // const activeLeg3 = fp ? fp.getLeg(fp.activeLateralLeg + 2) : null;
      this.nWaypoint = Subject.create("");
      this.nWaypointField = new TextInputField(this, {
        formatter: {
          nullValueString: "-----",
          maxLength: 5,
          format(value) {
            return value ? `${value}[blue]` : this.nullValueString;
          },
          async parse(input) {
            return input;
          },
        },
        onModified: async (scratchpadContents) => {
          this.nWaypoint.set(scratchpadContents);
          this.checkReady();
          return true;
        },
      }).bind(this.nWaypoint);

      this.ata = Subject.create(null);
      this.ataField = new TextInputField(this, {
        formatter: {
          nullValueString: "--:--",
          maxLength: 5,
          format(value) {
            return value
              ? `${value.substr(0, 2)}:${value.substr(2)}[blue]`
              : this.nullValueString;
          },
          async parse(input) {
            return input.replace("Z", "");
          },
        },
        onModified: async (scratchpadContents) => {
          if (Number.isNaN(Number.parseInt(scratchpadContents))) return false;
          this.ata.set(scratchpadContents);
          this.checkReady();
          return true;
        },
      }).bind(this.ata);

      this.eta = Subject.create(null);
      this.etaField = new TextInputField(this, {
        formatter: {
          nullValueString: "--:--",
          maxLength: 5,
          format(value) {
            return value
              ? `${value.substr(0, 2)}:${value.substr(2)}[blue]`
              : this.nullValueString;
          },
          async parse(input) {
            return input.replace("Z", "");
          },
        },
        onModified: async (scratchpadContents) => {
          if (Number.isNaN(Number.parseInt(scratchpadContents))) return false;
          this.eta.set(scratchpadContents);
          this.checkReady();
          return true;
        },
      }).bind(this.eta);

      this.send = Subject.create(false);

      this.station = Subject.create(null);
      this.bus
        .getSubscriber()
        .on("acars_station_status")
        .handle((message) => {
          this.station.set(message.active);
          this.checkReady();
          this.invalidate();
        });

      this.stationField = new DisplayField(this, {
        formatter: {
          nullValueString: "----",
          /** @inheritDoc */
          format(value) {
            return `${value}[blue]`;
          },
        },
      }).bind(this.station);

      fetchAcarsStatus(this.bus)
        .then((res) => {
          this.station.set(res.active);
          this.invalidate();
        })
        .catch((err) => null);
      this.value = Subject.create(null);
      this.levelField = new TextInputField(this, {
        formatter: {
          nullValueString: "---",
          maxLength: 3,
          format(value) {
            return `FL${value}[blue]`;
          },
          async parse(input) {
            return input;
          },
        },
        onModified: async (scratchpadContents) => {
          if (scratchpadContents.startsWith("FL"))
            scratchpadContents = scratchpadContents.substr(2);
          if (Number.isNaN(Number.parseInt(scratchpadContents))) return false;
          this.value.set(scratchpadContents);
          this.checkReady();
          return true;
        },
      }).bind(this.value);

      this.sendButton = new DisplayField(this, {
        formatter: {
          nullValueString: "SEND",
          /** @inheritDoc */
          format(value) {
            return `SEND[${value ? "blue" : "white"}]`;
          },
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
              this.nWaypoint,
            ];
            this.bus.getPublisher().pub(
              "acars_message_send",
              {
                key: "sendPositionReport",
                arguments:args.map(e => e.get()),
              },
              true,
              false,
            );
            args.forEach(e => e.set(null));

            this.checkReady();
          }
          return true;
        },
      }).bind(this.send);
      this.distanceSub = this.bus
        .getSubscriber()
        .on("lnavdata_waypoint_distance")
        .handle((v) => {
          
          this.distance.set(v);
         
        });
      this.speedSub = this.bus
        .getSubscriber()
        .on("ground_speed")
        .handle((v) => {
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
      this.station,
    ];
    this.send.set(
      !array.find((e) => {
        if (!e) return true;
        const v = e.get();

        return v === null || (typeof v === "string" ? v.length === 0 : false);
      }),
    );
  }
  onDestroy() {
    this.speedSub.destroy();
    this.distanceSub.destroy();
  }
  onPause() {

  }
  onResume() {
    this.speed.set(`${SimVar.GetSimVarValue("AIRSPEED MACH", "mach").toFixed(2)}`.substr(1))
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
      const time = new Date();
      const rem = 60 * (distance / gs);
      time.setUTCHours(time.getUTCHours() + Math.floor(rem / 60));
      time.setUTCMinutes(time.getUTCMinutes() + Math.floor(rem % 60));
      this.ata.set(
        `${time.getUTCHours().toString().padStart(2, "0")}${time.getUTCMinutes().toString().padStart(2, "0")}`,
      );
    }
    {
      const leg = fp.getLeg(fp.activeLateralLeg + 1);
      if (leg) {
        const time = new Date();
        const rem =
          60 *
          ((this.distance.get() + leg.calculated.distance / 1852) /
            this.groundSpeed.get());
        time.setUTCHours(time.getUTCHours() + Math.floor(rem / 60));
        time.setUTCMinutes(time.getUTCMinutes() + Math.floor(rem % 60));
        this.eta.set(
          `${time.getUTCHours().toString().padStart(2, "0")}${time.getUTCMinutes().toString().padStart(2, "0")}`,
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
          PageLinkField.createLink(this, "<RETURN", "/datalink-extra/fans"),
          "",
          this.clockField,
        ],
      ],
    ];
  }
}