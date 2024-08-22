import { Notice, Plugin, View } from "obsidian";
import { AppHelper } from "./app-helper";
import { MainView, VIEW_TYPE_MAIN } from "./ui/MainView";
import { DEFAULT_SETTINGS, Settings, TLSettingTab } from "./settings";

export default class TLPlugin extends Plugin {
  appHelper: AppHelper;
  settings: Settings;
  settingTab: TLSettingTab;

  async onload() {
    this.appHelper = new AppHelper(this.app);

    await this.loadSettings();
    this.settingTab = new TLSettingTab(this.app, this);
    this.addSettingTab(this.settingTab);

    this.registerView(
      VIEW_TYPE_MAIN,
      (leaf) => new MainView(leaf, this.settings),
    );

    this.app.workspace.onLayoutReady(async () => {
      if (this.settings.autoStartOnLaunch) {
        await this.attachTLView();
      }
    });
    this.addCommand({
      id: "post-new-time-log",
      name: "Post new time log",
      callback: () => {
        console.log('pressed!');
        window.dispatchEvent(new CustomEvent('postNewTimeLog'));
      },
      hotkeys: [
        {
          modifiers: ['Ctrl'],
          key: 'enter',
        },
      ],
    });
  }

  async onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_MAIN);
  }

  async attachTLView() {
    const existed = this.app.workspace.getLeavesOfType(VIEW_TYPE_MAIN).at(0);
    if (existed) {
      existed.setViewState({ type: VIEW_TYPE_MAIN, active: true });
      return;
    }

    const targetLeaf =
      this.settings.leaf === "left"
        ? this.app.workspace.getLeftLeaf(false)
        : this.settings.leaf === "current"
          ? this.app.workspace.getActiveViewOfType(View)?.leaf
          : this.settings.leaf === "right"
            ? this.app.workspace.getRightLeaf(false)
            : undefined;
    if (!targetLeaf) {
      new Notice(`表示リーフの設定が不正です: ${this.settings.leaf}`);
      return;
    }

    await targetLeaf.setViewState({
      type: VIEW_TYPE_MAIN,
      active: true,
    });
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  async loadSettings(): Promise<void> {
    const currentSettings = await this.loadData();
    this.settings = { ...DEFAULT_SETTINGS, ...currentSettings };
  }
}
