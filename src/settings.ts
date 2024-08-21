import { App, PluginSettingTab, Setting } from "obsidian";
import MFDIPlugin from "./main";
import { mirrorMap } from "./utils/collections";
import { TextComponentEvent } from "./obsutils/settings";
import TLPlugin from "./main";

export interface Settings {
  leaf: string;
  autoStartOnLaunch: boolean;
  enableCalloutFormat: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  leaf: "left",
  autoStartOnLaunch: false,
  enableCalloutFormat: false,
};

const leafOptions = ["left", "current", "right"];

export class TLSettingTab extends PluginSettingTab {
  plugin: TLPlugin;

  constructor(app: App, plugin: TLPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl("h3", { text: "🌍 全体" });

    new Setting(containerEl)
      .setName("表示リーフ")
      .setDesc("MFDI Viewを表示するリーフを指定します。")
      .addDropdown((tc) =>
        tc
          .addOptions(mirrorMap(leafOptions, (x) => x))
          .setValue(this.plugin.settings.leaf)
          .onChange(async (value) => {
            this.plugin.settings.leaf = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Obsidian起動時に自動起動・アクティブにする")
      .setDesc(
        "有効にするとObsidian起動時にMFDIのViewが自動で起動し、アクティブになります。",
      )
      .addToggle((tc) => {
        tc.setValue(this.plugin.settings.autoStartOnLaunch).onChange(
          async (value) => {
            this.plugin.settings.autoStartOnLaunch = value;
            await this.plugin.saveSettings();
          },
        );
      });

    new Setting(containerEl)
      .setName("書き込むフォーマットをcallout形式にする")
      .setDesc(
        "有効にするとcallout形式で書き込みます。以前のcodeブロック形式は、引き続き読み込むことができます。",
      )
      .addToggle((tc) => {
        tc.setValue(this.plugin.settings.enableCalloutFormat).onChange(
          async (value) => {
            this.plugin.settings.enableCalloutFormat = value;
            await this.plugin.saveSettings();
          },
        );
      });
  }
}
