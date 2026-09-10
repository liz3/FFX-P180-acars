
import { DisplayField, PageLinkField, Subject, SwitchLabel, TextInputField } from "@microsoft/msfs-sdk";
import { FmcCmuCommons, StringInputFormat, WT21FmcPage } from "@microsoft/msfs-wt21-fmc";

export default class DatalinkTwipPage extends WT21FmcPage {
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
    this.send = Subject.create(false);
    this.reqType = Subject.create(0);
    this.clockField = FmcCmuCommons.createClockField(this, this.bus);
    this.facility = Subject.create("");
    this.opts = ["METAR", "TAF"];
    this.typeSwitch = new SwitchLabel(this, {
      optionStrings: this.opts,
      activeStyle: "green",
    }).bind(this.reqType);

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
          this.bus.getPublisher().pub(
            "acars_message_send",
            {
              key: "atisRequest",
              arguments: [this.facility.get(),  this.opts[this.reqType.get()]],
            },
            true,
            false,
          );

          [this.facility].forEach((e) => e.set(""));
          this.checkReady();
        }
        return true;
      },
    }).bind(this.send);

    this.facilityField = new TextInputField(this, {
      formatter: new StringInputFormat({
        nullValueString: "□□□□",
        maxLength: 4,
      }),
      onSelected: async (scratchpadContents) => {
        this.facility.set(scratchpadContents);
        this.checkReady();
        return true;
      },
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
          PageLinkField.createLink(this, "<RETURN", "/datalink-menu"),
          "",
          this.clockField,
        ],
      ],
    ];
  }
}