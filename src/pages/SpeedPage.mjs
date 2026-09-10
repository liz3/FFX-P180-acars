import { DisplayField, PageLinkField, Subject, SwitchLabel, TextInputField } from "@microsoft/msfs-sdk";
import { FmcCmuCommons, StringInputFormat, WT21FmcPage } from "@microsoft/msfs-wt21-fmc";
import { fetchAcarsStatus } from "../AcarsService.mjs";


export default class DatalinkSpeedPage extends WT21FmcPage {
  constructor(
    bus,
    screen,
    props,
    fms,
    /** @deprecated */
    baseInstrument, // TODO we should really not have this here
    renderCallback,
  ) {
    super(bus, screen, props, fms, baseInstrument, renderCallback);
    this.clockField = FmcCmuCommons.createClockField(this, this.bus);
    this.send = Subject.create(false);
    this.value = Subject.create("");
    this.reason = Subject.create(0);
    this.unit = Subject.create(0);
    this.opts = ["WEATHER", "A/C PERF"];
    this.units = ["KTS", "MACH"];
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

    for (let i = 0; i < 4; i++) {
      this[`freeText${i}`] = Subject.create("");
      this[`freeTextField${i}`] = new TextInputField(this, {
        formatter: new StringInputFormat({
          nullValueString: "(----------------------)[blue]",
          maxLength: 24,
        }),
        onSelected: async (scratchpadContents) => {
          this[`freeText${i}`].set(scratchpadContents);
          this.checkReady();
          return true;
        },
      }).bind(this[`freeText${i}`]);
    }

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
          const freeText = Array(4)
            .fill()
            .map((_, i) => this[`freeText${i}`].get())
            .filter((e) => e && e.length)
            .join(" ");
          this.bus.getPublisher().pub(
            "acars_message_send",
            {
              key: "sendSpeedChange",
              arguments: [
                this.unit.get() === 0 ? "knots" : "mach",
                this.value.get(),
                this.reason.get() === 0 ? "weather" : "performance",
                freeText,
              ],
            },
            true,
            false,
          );

          [this.value].forEach((e) => e.set(""));
          Array(4)
            .fill()
            .forEach((_, i) => this[`freeText${i}`].set(""));
          this.checkReady();
        }
        return true;
      },
    }).bind(this.send);
    fetchAcarsStatus(this.bus).then((res) => {
      this.station.set(res.active);
      this.invalidate();
    });
    this.speedField = new TextInputField(this, {
      formatter: new StringInputFormat({
        nullValueString: "----",
        maxLength: 4,
        format(value) {
          return `${this.unit.get() === 1 ? "M" : ""}${value}`;
        },
      }),
      onSelected: async (scratchpadContents) => {
        if (Number.isNaN(Number.parseFloat(scratchpadContents))) return false;
        this.value.set(scratchpadContents);
        this.checkReady();
        return true;
      },
    }).bind(this.value);
    this.reasonField = new SwitchLabel(this, {
      optionStrings: this.opts,
      activeStyle: "green",
    }).bind(this.reason);
    this.unitField = new SwitchLabel(this, {
      optionStrings: this.units,
      activeStyle: "green",
    }).bind(this.unit);
  }
  checkReady() {
    const array = [this.value, this.station];
    this.send.set(
      !array.find((e) => {
        const v = e.get();
        return typeof v === "string" ? v.length === 0 : false;
      }),
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
          PageLinkField.createLink(this, "<RETURN", "/datalink-extra/cpdlc/request-menu"),
          "",
          this.clockField,
        ],
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
          PageLinkField.createLink(this, "<RETURN", "/datalink-extra/cpdlc/request-menu"),
          "",
          this.clockField,
        ],
      ],
    ];
  }
}