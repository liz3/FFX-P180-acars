import { AbstractFmcPageExtension, DisplayField, Subject } from "@microsoft/msfs-sdk";
import { SimpleStringFormat } from "@microsoft/msfs-wt21-fmc";

class RouteMenuExtension extends AbstractFmcPageExtension {
  constructor(page) {
    super(page);
    this.simbriefId = Subject.create(GetStoredData("h800xp_acars_simbrief_id"));
    this.text = Subject.create("FPLN RECALL");
    this.fetching = false;
    page.bus
      .getSubscriber()
      .on("simbrief_id")
      .handle((v) => {
        this.simbriefId.set(v);
      });
    page.bus
      .getSubscriber()
      .on("h800xp_acars_fetch_fplan_done")
      .handle((v) => {
        this.fetching = false;
        this.text.set("FPLN RECALL");
        if (v.res) {
          this.page.screen.navigateTo(
            `/route`,
          );
         
        }
      });
    this.simbriefField = new DisplayField(this.page, {
      formatter: {
        nullValueString: "<FPLN RECALL[disabled]",
        /** @inheritDoc */
        format(value) {
          return `<${value}`;
        },

      },
      onSelected: async () => {
        if (this.fetching)
          return true;
        this.fetching = true;
        this.text.set("FPLN UPLK LOAD...[disabled]");
        page.bus.getPublisher().pub("h800xp_acars_fetch_fplan", null, true, false);
        return true;
      },
    }).bind(this.text);
  }

  onPageRendered(renderedTemplates) {
    const elem = this.simbriefId.get();
    renderedTemplates[0][6] = [
      elem && elem.length ? this.simbriefField : "<FPLN RECALL[disabled]",
    ];
  }
}
export default RouteMenuExtension;