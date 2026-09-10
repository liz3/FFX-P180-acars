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

export default class FansRequestPage extends WT21FmcPage {
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
        ["FANS[blue]", "", "REQUESTS[blue]"],
        [],
        [
          PageLinkField.createLink(
            this,
            "<ALTITUDE",
            "/datalink-extra/cpdlc/level",
          ),
        ],
        [],
        [
          PageLinkField.createLink(this, "<OFFSET", "", true),
          PageLinkField.createLink(this, "FMC DESCEND>", "", true),
        ],
        [],
        [
          PageLinkField.createLink(
            this,
            "<SPEED",
            "/datalink-extra/cpdlc/speed",
          ),
          PageLinkField.createLink(this, "WHEN CAN WE>", "", true),
        ],
        [],
        [
          PageLinkField.createLink(
            this,
            "<ROUTE",
            "/datalink-extra/cpdlc/direct",
          ),
          PageLinkField.createLink(this, "VOICE REQ>", "", true),
        ],
        [],
        [],
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
