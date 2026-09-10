import { DisplayField, PageLinkField, Subject } from "@microsoft/msfs-sdk";
import { FmcCmuCommons, WT21FmcPage } from "@microsoft/msfs-wt21-fmc";
import { convertUnixToHHMM } from "../Hoppie.mjs";

export default class DatalinkMessagePage extends WT21FmcPage {
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
    this.options = [];
    // this.deleteField = new DisplayField(this, {
    //   formatter: {
    //     nullValueString: "DEL>[blue]",
    //     format: (value) => {
    //       return "DEL>[blue]";
    //     },
    //   },
    //   onSelected: async () => {
    //     const message = this.params.get("message");
    //     if (message) {
    //       this.screen.navigateTo(
    //         `/datalink-extra/${message.type === "send" ? "send-msgs" : "recv-msgs"}`,
    //         {type: message.cpdlc ? "atc" : "aoc"}
    //       );
    //       deleteMessage(this.bus, message._id);
    //     }
    //     return true;
    //   },
    // });
    this.updateHandler = bus
      .getSubscriber()
      .on("acars_message_state_update")
      .handle((e) => {
        const message = this.params.get("message");
        if (message && e.id === message._id) {
          message.respondSend = e.option;
          message.viewed = true;
          this.options = [
            ...message.options.map((e) => (message.respondSend === e ? e : "")),
          ];
          this.invalidate();
        }
      });
  }

  onDestroy() {
    this.updateHandler.destroy();
  }
  onPause() {
    this.updateHandler.pause();
  }
  onResume() {
    this.updateHandler.resume();
  }
  formatContent(message) {
    const textList = [];
    let current = [];
    const mwl = 24;
    for (const word of message.content.split(" ")) {
      current.push(word);
      const j = current.join(" ");
      if (j.length > mwl) {
        const l = current.pop();
        if (current.length) textList.push(current.join(" "));
        if (l.length >= mwl) {
          textList.push(l);
          current = [];
        } else {
          current = [l];
        }
      }
    }
    textList.push(current.join(" "));

    return textList;
  }
  getOpts(message) {
    if (message.options && !message.respondSend) {
      return message.options.map((opt, i) =>
        new DisplayField(this, {
          formatter: {
            format: () => {
              return i !== 1 ? `*${opt}[blue]` : `${opt}*[blue]`;
            },
          },
          onSelected: async () => {
            if (message.respondSend) return true;
            this.bus.getPublisher().pub(
              "acars_message_ack",
              {
                option: opt,
                id: message._id,
              },
              true,
              false,
            );
            return true;
          },
        }).bind(Subject.create(opt)),
      );
    }
    return [];
  }
  checkReadState(message) {

    if (!message.options || message.respondSend) {
      this.bus.getPublisher().pub(
        "acars_read_state",
        {
          
          id: message._id,
        },
        true,
        false,
      );
    }

  }
  render() {
    const message = this.params.get("message");
    const titleLeft = message.cpdlc ? "FANS" : "DL";
    const status = message.cpdlc
      ? message.respondSend
        ? message.respondSend
        : "OPEN"
      : "OPEN";
    this.checkReadState(message);
    const title = `${convertUnixToHHMM(message.ts).replace(":", "")}Z-${message.from}`;
    const ret = PageLinkField.createLink(
      this,
      "<RETURN",
      message.cpdlc ? "/datalink-extra/cpdlc/messages" : `/datalink-extra/${message.type === "send" ? "send-msgs" : "recv-msgs"}`,
      false,
      {
        type: message.cpdlc ? "atc" : "aoc",
      },
    );
    const opts = this.getOpts(message);
    const rowsPerPage = message.options ? 5 : 9;
    const pages = this.formatContent(message).reduce(
      (acc, val) => {
        if (acc[acc.length - 1].length === rowsPerPage) acc.push([]);
        acc[acc.length - 1].push([val]);
        return acc;
      },
      [[]],
    );
    return pages.map((contentRows) => {
      const base = [
        [
          `${titleLeft}[blue]`,
          pages.length > 1 ? this.PagingIndicator : "",
          "MESSAGE[blue]",
        ],
        [`${title}[green s-text]`, `${status}[green s-text]`],
        ...contentRows,
      ];
      if (contentRows.length < rowsPerPage) {
        for (let i = 0; i < rowsPerPage - contentRows.length; i += 1)
          base.push([]);
      }
      if (message.options) {
        base.push(["", "", "--------RESPONSE--------[blue s-text]"]);
        if (opts.length) {
          base.push([opts[0]]);
          base.push([]);
          base.push([opts[2], opts[1]]);
        } else {
          base.push([message.respondSend]);
          base.push([]);
          base.push([]);
        }
      }
      base.push([]);
      base.push([ret, "", this.clockField]);

      return base;
    });
  }
}
