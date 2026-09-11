import { DisplayField, PageLinkField, Subject, TextInputField } from "@microsoft/msfs-sdk";
import {
  FmcCmuCommons,
  StringInputFormat,
  WT21FmcPage,
} from "@microsoft/msfs-wt21-fmc";
import { fetchAcarsStatus } from "../AcarsService.mjs";
import { FmcUserSettings } from "@microsoft/msfs-wt21-shared";

export class CpdlcStatusPage extends WT21FmcPage {
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
    this.facility = Subject.create(null);
    this.send = Subject.create(null);
    this.logoff = Subject.create(null);
    this.status = Subject.create(null);
    this.activeStation = Subject.create(null);
    this.pendingStation = Subject.create(null);
    this.fltId = Subject.create(FmcUserSettings.getManager(this.bus)
      .getSetting("flightNumber")
      .get());
    this.activeField = new DisplayField(this, {
      formatter: {
        nullValueString: "--------[green]",
        /** @inheritDoc */
        format(value) {
          return `${value}[green]`;
        },
      },
    }).bind(this.activeStation);
    this.pendingField = new DisplayField(this, {
      formatter: {
        nullValueString: "--------[green]",
        /** @inheritDoc */
        format(value) {
          return `${value}[green]`;
        },
      },
    }).bind(this.pendingStation);
    this.fltIdField = new TextInputField(this, {
      formatter: new StringInputFormat({
        nullValueString: "-------",
        maxLength: 7,
      }),
      onSelected: async (scratchpadContents) => {
        FmcUserSettings.getManager(this.bus)
          .getSetting("flightNumber")
          .set(scratchpadContents);
        return true;
      },
      onDelete: async () => {
        FmcUserSettings.getManager(this.bus)
          .getSetting("flightNumber")
          .set(null);
      },
    }).bind(this.fltId);
    this.statusField = new DisplayField(this, {
      formatter: {
        nullValueString: "",
        /** @inheritDoc */
        format(value) {
          return `${value}[green s-text]`;
        },
      },
    }).bind(this.status);

    this.facilityField = new TextInputField(this, {
      formatter: new StringInputFormat({
        nullValueString: "----",
        maxLength: 4,
      }),
      onSelected: async (scratchpadContents) => {
        this.facility.set(scratchpadContents);
        return true;
      },
      onDelete: async () => {
        this.facility.set(null);
      },
    }).bind(this.facility);
    this.logonButton = new DisplayField(this, {
      formatter: {
        nullValueString: "",
        /** @inheritDoc */
        format(value) {
          if (!value || !value.length) return "";
          return `${value}[blue]`;
        },
      },
      onSelected: async () => {
        const fac = this.facility.get();
        if (!fac || fac.length !== 4)
          return false;
    
        this.bus.getPublisher().pub(
          "acars_message_send",
          {
            key: "sendLogonRequest",
            arguments: [this.facility.get()],
          },
          true,
          false,
        );
        
        return true;
 
      }
    }).bind(this.send);

    this.logoffButton = new DisplayField(this, {
      formatter: {
        nullValueString: "",
        /** @inheritDoc */
        format(value) {
          return "";
        },
      },
      onSelected: async () => {
        if (this.activeStation.get()) {
          this.bus.getPublisher().pub(
            "acars_message_send",
            {
              key: "sendLogoffRequest",
              arguments: [],
            },
            true,
            false,
          );
          return true;
        }
        return false;
      },
    }).bind(Subject.create(""));

    
    this.logoffText = new DisplayField(this, {
      formatter: {
        nullValueString: "",
        /** @inheritDoc */
        format(value) {
          if (!value || !value.length) return "";
          return `${value}[blue]`;
        },
      },
    }).bind(this.logoff);



    this.facility.sub((v) => {
      if (v.length === 4 && !this.send.get()) this.send.set("SEND LOGON*");
      else if (v.length != 4 && this.send.get()) this.send.set(null);
    });
    
    this.bus
      .getSubscriber()
      .on("acars_station_status")
      .handle((message) => {
        this.logoff.set(message.active ? "LOGOFF*" : null);
        this.activeStation.set(message.active && message.active.length ? message.active : null);
        this.pendingStation.set(message.pending &&
          message.pending.length ? message.pending : null,
        );
        this.status.set(
          message.active
            ? `LOGGED ON TO ${message.active}`
            : message.pending
              ? `NOTIFIED ${message.pending}`
              : null,
        );
        this.invalidate();
      });

    FmcUserSettings.getManager(bus)
      .getSetting("flightNumber")
      .sub((value) => {
        this.fltId.set(value);
        this.invalidate();
      });
    fetchAcarsStatus(this.bus).then(message => {
      this.logoff.set(message.active ? "LOGOFF*" : null);
      this.activeStation.set(message.active && message.active.length ? message.active : null);
      this.pendingStation.set(message.pending &&
        message.pending.length ? message.pending : null,
      );
      this.status.set(
        message.active
          ? `LOGGED ON TO ${message.active}`
          : message.pending
            ? `NOTIFIED ${message.pending}`
            : "LOGON REQUIRED",
      );
      this.invalidate();
    })
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
          PageLinkField.createLink(this, "<RETURN", "/datalink-extra/fans"),
          "",
          this.clockField,
        ],
      ],
    ];
  }
}
