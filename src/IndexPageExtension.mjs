
import {
  WT21FmcAvionicsPlugin,
  UserSettingsPage,
  RouteMenuPage,
  StringInputFormat,
} from "@microsoft/msfs-wt21-fmc";
import msfsSdk, {
  AbstractFmcPageExtension,
  PageLinkField,
  Subject,
} from "@microsoft/msfs-sdk";

class IndexPageExtension extends AbstractFmcPageExtension {
  constructor(page) {
    super(page);
  }

  onPageRendered(renderedTemplates) {
    renderedTemplates[0][12][0] = PageLinkField.createLink(
      this.page,
      "<FANS",
      "/datalink-extra/fans",
    );

  }
}
export default IndexPageExtension;