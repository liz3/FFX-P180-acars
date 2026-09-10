
import {
  WT21FmcAvionicsPlugin,
  UserSettingsPage,
  RouteMenuPage,
  StringInputFormat,
} from "@microsoft/msfs-wt21-fmc";
import msfsSdk, {
  AbstractFmcPageExtension,
  Subject,
} from "@microsoft/msfs-sdk";

class AcarsSettingsExtension extends AbstractFmcPageExtension {
  constructor(page) {
    super(page);
    this.simbriefId = Subject.create(GetStoredData("h800xp_acars_simbrief_id"));
    this.hoppieId = Subject.create(GetStoredData("h800xp_acars_hoppie_code"));
    this.cduSetting = Subject.create(
      GetStoredData("h800xp_acars_winwing_setting") === "true" ? 1 : 0,
    );
    this.codeVisibility = Subject.create(0);
    this.networkOptions = ["HOPPIE", "SAYI.AI", "BATC"];
    this.networkOption = Subject.create(
      GetStoredData("h800xp_acars_network_setting")
        ? this.networkOptions.indexOf(
            GetStoredData("h800xp_acars_network_setting").toUpperCase(),
          )
        : 0,
    );
    this.cduSwitch = new msfsSdk.SwitchLabel(page, {
      optionStrings: ["OFF", "ON"],
      activeStyle: "green",
    }).bind(this.cduSetting);
    this.codeVisibilitySwitch = new msfsSdk.SwitchLabel(page, {
      optionStrings: ["OFF", "ON"],
      activeStyle: "green",
    }).bind(this.codeVisibility);
    this.networkSwitch = new msfsSdk.SwitchLabel(page, {
      optionStrings: this.networkOptions,
      activeStyle: "green",
    }).bind(this.networkOption);
   this.networkOption.sub((v) => {
      SetStoredData("h800xp_acars_network_setting", this.networkOptions[v]);
      page.bus.getPublisher().pub("h800xp_acars_network_setting", this.networkOptions[v], true, false);
    });
    this.cduSetting.sub((v) => {
      SetStoredData("h800xp_acars_winwing_setting", v === 1 ? "true" : "false");
      page.bus.getPublisher().pub("h800xp_acars_winwing_setting", v === 1, true, false);
    });
    this.simbriefField = new msfsSdk.TextInputField(page, {
      formatter: new StringInputFormat({ nullValueString: "-----" }),
      onSelected: async (scratchpadContents) => {
        if (scratchpadContents.length) {
          SetStoredData("h800xp_acars_simbrief_id", scratchpadContents.toString());
          this.simbriefId.set(scratchpadContents);
          page.bus.getPublisher().pub("simbrief_id", scratchpadContents, true, false);
        }
        return Promise.resolve(null);
      },
      onDelete: async () => {
        SetStoredData("h800xp_acars_simbrief_id", null);
        page.bus.getPublisher().pub("simbrief_id", "");
        this.simbriefId.set("");
        return true;
      },
      prefix: "",
    }).bind(this.simbriefId);
    this.hoppieField = new msfsSdk.TextInputField(page, {
      formatter: {
        nullValueString: "-----",
        format: v=> this.codeVisibility.get() ? v : "X".repeat(v.length)
      },
      onSelected: (scratchpadContents) => {
        return new Promise((resolve) => {
          const currentVis = this.codeVisibility.get();
          const id = `${Date.now()}--hoppie-input`;
          const input = document.createElement("input");
          input.style.display = "absolute";
          let s = false;
          input.addEventListener("input", (event) => {
            const v = event.target.value;
            this.codeVisibility.set(currentVis);
            SetStoredData("h800xp_acars_hoppie_code", v);
            this.hoppieId.set(v);
            page.bus.getPublisher().pub("hoppie_code", v);
            s = true;
            event.target.blur();
            event.target.remove();
            Coherent.trigger("UNFOCUS_INPUT_FIELD", id);
            resolve("");
          });
          input.addEventListener("blur", (event) => {
            if (s) return;
            this.hoppieId.set("");
            event.target.blur();
            event.target.remove();
            Coherent.trigger("UNFOCUS_INPUT_FIELD", id);
               this.codeVisibility.set(currentVis);
            resolve("");
          });
          document.body.appendChild(input);
          input.focus();
          Coherent.trigger("FOCUS_INPUT_FIELD", id, "", "", "", false);
          this.codeVisibility.set(1);
          this.hoppieId.set("PASTE NOW");
        });
      },
      onDelete: async () => {
        SetStoredData("h800xp_acars_hoppie_code", null);
        page.bus.getPublisher().pub("hoppie_code", "");
        this.hoppieId.set("");
        return true;
      },
      prefix: "",
    }).bind(this.hoppieId);
  }

  onPageRendered(renderedTemplates) {
    renderedTemplates[0][5] = [" NETWORK[blue]"];
    renderedTemplates[0][6] = [this.networkSwitch];
    renderedTemplates[0][7] = [" SIMBRIEF ID[blue]", "WINWING CDU[blue]"];
    renderedTemplates[0][8] = [this.simbriefField, this.cduSwitch];
    renderedTemplates[0][9] = ["", "SHOW CODE[blue]"];
    renderedTemplates[0][10] = ["", this.codeVisibilitySwitch];
    renderedTemplates[0][11] = [" LOGON CODE[blue]"];
    renderedTemplates[0][12] = [this.hoppieField];
  }
}
export default AcarsSettingsExtension;