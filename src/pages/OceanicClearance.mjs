import { DisplayField, PageLinkField, Subject, TextInputField } from "@microsoft/msfs-sdk";
import { FmcCmuCommons, StringInputFormat, WT21FmcPage } from "@microsoft/msfs-wt21-fmc";
import { FmcUserSettings } from "@microsoft/msfs-wt21-shared";

export default class DatalinkOceanicRequestPage extends WT21FmcPage {
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
    this.flightId = Subject.create(FmcUserSettings.getManager(this.bus)
      .getSetting("flightNumber")
      .get());
    this.facility = Subject.create("");
    this.entryPoint = Subject.create("");
    this.time = Subject.create("");
    this.mach = Subject.create("");
    this.fltLvl = Subject.create("");
    this.send = Subject.create(false);

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
              key: "sendOceanicClearance",
              arguments: [
                this.flightId.get(),
                this.facility.get(),
                this.entryPoint.get(),
                this.time.get(),
                this.fltLvl.get(),
                this.mach.get(),
                freeText,
              ],
            },
            true,
            false,
          );

          [
            this.facility,
            this.entryPoint,
            this.time,
            this.fltLvl,
            this.mach,
          ].forEach((e) => e.set(""));
          Array(4)
            .fill()
            .forEach((_, i) => this[`freeText${i}`].set(""));

          this.checkReady();
        }
        return true;
      },
    }).bind(this.send);

    this.flightIdField = new TextInputField(this, {
      formatter: new StringInputFormat({
        nullValueString: "-------",
        maxLength: 7,
      }),
      onSelected: async (scratchpadContents) => {
        this.flightId.set(scratchpadContents);
        this.checkReady();
        return true;
      },
    }).bind(this.flightId);
    this.facilityField = new TextInputField(this, {
      formatter: new StringInputFormat({
        nullValueString: "----",
        maxLength: 4,
      }),
      onSelected: async (scratchpadContents) => {
        this.facility.set(scratchpadContents);
        this.checkReady();
        return true;
      },
    }).bind(this.facility);

    this.entryPointField = new TextInputField(this, {
      formatter: new StringInputFormat({
        nullValueString: "-----",
        maxLength: 5,
      }),
      onSelected: async (scratchpadContents) => {
        this.entryPoint.set(scratchpadContents);
        this.checkReady();
        return true;
      },
    }).bind(this.entryPoint);

    this.timeField = new TextInputField(this, {
      formatter: new StringInputFormat({
        nullValueString: "□□:□□",
        maxLength: 5,
      }),
      onSelected: async (scratchpadContents) => {
        if (
          !scratchpadContents.length === 4 ||
          Number.isNaN(Number.parseInt(scratchpadContents))
        ) {
          return false;
        }
        this.time.set(
          `${scratchpadContents.substr(0, 2)}:${scratchpadContents.substr(2)}`,
        );
        this.checkReady();
        return true;
      },
    }).bind(this.time);

    this.machField = new TextInputField(this, {
      formatter: new StringInputFormat({
        nullValueString: ".□□",
        maxLength: 3,
      }),
      onSelected: async (scratchpadContents) => {
        if (
          !scratchpadContents.length > 3 ||
          Number.isNaN(Number.parseFloat("0" + scratchpadContents))
        ) {
          return false;
        }
        this.mach.set(`.${scratchpadContents.replace(".", "")}`);
        this.checkReady();
        return true;
      },
    }).bind(this.mach);
    this.fltLvlField = new TextInputField(this, {
      formatter: new StringInputFormat({
        nullValueString: "□□□",
        maxLength: 3,
      }),
      onSelected: async (scratchpadContents) => {
        if (
          !scratchpadContents.length > 3 ||
          Number.isNaN(Number.parseInt(scratchpadContents))
        ) {
          return false;
        }
        this.fltLvl.set(scratchpadContents);
        this.checkReady();
        return true;
      },
    }).bind(this.fltLvl);

    FmcUserSettings.getManager(bus)
      .getSetting("flightNumber")
      .sub((value) => {
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
      this.fltLvl,
    ];
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
          PageLinkField.createLink(this, "<RETURN", "/datalink-menu"),
          "",
          this.clockField,
        ],
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
          PageLinkField.createLink(this, "<RETURN", "/datalink-menu"),
          "",
          this.clockField,
        ],
      ],
    ];
  }
}