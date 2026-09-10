import { DisplayField, PageLinkField, Subject, TextInputField } from "@microsoft/msfs-sdk";
import { FmcCmuCommons, StringInputFormat, WT21FmcPage } from "@microsoft/msfs-wt21-fmc";


export default class DatalinkTelexPage extends WT21FmcPage {
  constructor(
    bus,
    screen,
    props,
    fms,
    /** @deprecated */
    baseInstrument, // TODO we should really not have this here
    renderCallback,
  ) {
    try {
      super(bus, screen, props, fms, baseInstrument, renderCallback);
      this.clockField = FmcCmuCommons.createClockField(this, this.bus);
      this.facility = Subject.create("");
      this.send = Subject.create(false);

      for (let i = 0; i < 7; i++) {
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
            const freeText = Array(7)
              .fill()
              .map((_, i) => this[`freeText${i}`].get())
              .filter((e) => e && e.length)
              .join(" ");
            this.bus.getPublisher().pub(
              "acars_message_send",
              {
                key: "sendTelex",
                arguments: [this.facility.get(), freeText],
              },
              true,
              false,
            );
            [this.facility].forEach((e) => e.set(""));
            Array(7)
              .fill()
              .forEach((_, i) => this[`freeText${i}`].set(""));
            this.checkReady();
          }
          return true;
        },
      }).bind(this.send);

      this.facilityField = new TextInputField(this, {
        formatter: new StringInputFormat({
          nullValueString: "-------",
          maxLength: 7,
        }),
        onSelected: async (scratchpadContents) => {
          this.facility.set(scratchpadContents);
          this.checkReady();
          return true;
        },
      }).bind(this.facility);
    } catch (err) {
      console.log("error");
    }
  }
  checkReady() {
    const array = [this.facility];
    const freeText = Array(7)
      .fill()
      .map((_, i) => this[`freeText${i}`].get())
      .filter((e) => e && e.length)
      .join(" ");
    this.send.set(
      freeText.length &&
        !array.find((e) => {
          const v = e.get();
          return !v || !v.length;
        }),
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
          PageLinkField.createLink(this, "<RETURN", "/datalink-extra/fans"),
          "",
          this.clockField,
        ],
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
          PageLinkField.createLink(this, "<RETURN", "/datalink-extra/fans"),
          "",
          this.clockField,
        ],
      ],
    ];
  }
}