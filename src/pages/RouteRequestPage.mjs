import { DisplayField, PageLinkField, Subject, SwitchLabel, TextInputField } from "@microsoft/msfs-sdk";
import { FmcCmuCommons, StringInputFormat, WT21FmcPage } from "@microsoft/msfs-wt21-fmc";
import { fetchAcarsStatus } from "../AcarsService.mjs";

export class DatalinkDirectToPage extends WT21FmcPage {
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
    this.facility = Subject.create("");
    this.send = Subject.create(false);
    this.reason = Subject.create(0);
    this.opts = ["WEATHER", "A/C PERF"];
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
    fetchAcarsStatus(this.bus).then((res) => {
      this.station.set(res.active);
      this.invalidate();
    });
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
              key: "sendDirectTo",
              arguments: [
                this.facility.get(),
                this.reason.get() === 0 ? "weather" : "performance",
                freeText,
              ],
            },
            true,
            false,
          );

          [this.facility].forEach((e) => e.set(""));
          Array(4)
            .fill()
            .forEach((_, i) => this[`freeText${i}`].set(""));
          this.checkReady();
        }
        return true;
      },
    }).bind(this.send);

    this.facilityField = new TextInputField(this, {
      formatter: new StringInputFormat({
        nullValueString: "-----",
        maxLength: 5,
      }),
      onSelected: async (scratchpadContents) => {
        this.facility.set(scratchpadContents);
        this.checkReady();
        return true;
      },
    }).bind(this.facility);
    this.reasonField = new SwitchLabel(this, {
      optionStrings: this.opts,
      activeStyle: "green",
    }).bind(this.reason);
  }
  checkReady() {
    const array = [this.facility, this.station];
    this.send.set(
      !array.find((e) => {
        const v = e.get();
        return !v || !v.length;
      }),
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
          PageLinkField.createLink(this, "<RETURN", "/datalink-extra/cpdlc/request-menu"),
          "",
          this.clockField,
        ],
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
          PageLinkField.createLink(this, "<RETURN", "/datalink-extra/cpdlc/request-menu"),
          "",
          this.clockField,
        ],
      ],
    ];
  }
}