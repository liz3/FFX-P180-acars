import {
  DisplayField,
  PageLinkField,
  Subject,
  SwitchLabel,
  TextInputField,
} from "@microsoft/msfs-sdk";
import {
  FmcCmuCommons,
  StringInputFormat,
  WT21FmcPage,
} from "@microsoft/msfs-wt21-fmc";

export default class FansPage extends WT21FmcPage {
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
  }

  render() {
    return [
      [
        ["FANS[blue]", "", "MAIN MENU[blue]"],
        [],
        [
          PageLinkField.createLink(
            this,
            "<LOGON/STATUS",
            "/datalink-extra/cpdlc/status",
          ),
          PageLinkField.createLink(
            this,
            "MSG LOG>",
            "/datalink-extra/cpdlc/messages",
            false,
            {
              type: "atc"
            }
          ),
        ],
        [],
        [
          PageLinkField.createLink(
            this,
            "<REQUEST",
            "/datalink-extra/cpdlc/request-menu",
          ),
          PageLinkField.createLink(this, "EMERGENCY>", "", true),
        ],
        [],
        [
          PageLinkField.createLink(this, "<POS REP", "/datalink-extra/posrep"),
          PageLinkField.createLink(this, "REPORTS DUE>", "", true),
        ],
        [],
        [PageLinkField.createLink(this, "<FREE TEXT", "/datalink-extra/telex")],
        [],
        ["", PageLinkField.createLink(this, "ADS>", "", true)],
        [],
        ["", "", this.clockField],
      ],
    ];
  }
}
