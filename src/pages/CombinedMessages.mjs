import { PageLinkField, Subject } from "@microsoft/msfs-sdk";
import { FmcCmuCommons, WT21FmcPage } from "@microsoft/msfs-wt21-fmc";
import { fetchAcarsMessages } from "../AcarsService.mjs";
import { convertUnixToHHMM } from "../Hoppie.mjs";

export default class DatalinkCombinedMessagesPage extends WT21FmcPage {
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
    this.messages = Subject.create([]);
    this.clockField = FmcCmuCommons.createClockField(this, this.bus);
    this.bus
      .getSubscriber()
      .on("acars_message_removal")
      .handle((idv) => {
        const current = this.messages.get().filter((e) => e.message._id !== idv);
        
        this.messages.set(current);
        this.invalidate();
      });
    this.bus
      .getSubscriber()
      .on("acars_incoming_message")
      .handle((message) => {
        if (!message.cpdlc)
          return;
        const current = this.messages.get();
        const entry = {
          message,
          link: PageLinkField.createLink(
            this,
            `<${message.from} ${message.content.substr(0, 22 - message.from.length)}`,
            "/datalink-extra/message",
            false,
            {
              message,
            },
          ),
        };
     
          current.unshift(entry);
        
        this.messages.set(current);
        this.invalidate();
      });
    this.bus
      .getSubscriber()
      .on("acars_message_state_update")
      .handle((e) => {
        const current = this.messages.get();

   
          const msg = current.find((t) => t.message._id === e.id);
          if (msg) {
            msg.respondSend = e.option;
          }
        
        this.messages.set(current);
      });
    fetchAcarsMessages(this.bus, "all", "atc").then((messages) => {
      const current = this.messages.get();
      for (const message of messages) {
        const entry = {
          message,
          link: PageLinkField.createLink(
            this,
            `<${message.content.substr(0, 23)}`,
            "/datalink-extra/message",
            false,
            {
              message,
            },
          ),
        };
   
          current.unshift(entry);
        
      }
      this.messages.set(current);
      this.invalidate();
    });
  }

  render() {
    const reqType = this.params.get("type");
    return this.messages.get().reduce((acc, val) => {
      if (acc[acc.length - 1].length === 5)
        acc.push([])
      acc[acc.length - 1].push(val);
      return acc;
    }, [[]]).map((page) => {
      const array = Array(10)
        .fill()
        .map((e) => []);
      page.forEach((val, index) => {
        const nn = index * 2;
        array[nn] = [`${convertUnixToHHMM(val.message.ts)}[blue]`];
        array[nn + 1] = [val.link];
      });

      return [
        ["FANS[blue]", this.PagingIndicator, "MESSAGES[blue]"],
        ...array,
        [],
        [
          PageLinkField.createLink(this, "<RETURN", reqType === "aoc" ? "/datalink-menu": "/datalink-extra/fans"),
          "",
          this.clockField,
        ],
      ];
    });
  }
}