import { ItemView, WorkspaceLeaf } from "obsidian";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { ReactView } from "./ReactView";
import { createRoot, Root } from "react-dom/client";
import { AppHelper } from "src/app-helper";
import { Settings } from "src/settings";

export const VIEW_TYPE_MAIN = "main-view";

export class MainView extends ItemView {
  root: Root;
  appHelper: AppHelper;
  settings: Settings;

  constructor(leaf: WorkspaceLeaf, settings: Settings) {
    super(leaf);
    this.appHelper = new AppHelper(this.app);
    this.settings = settings;
  }

  getViewType() {
    return VIEW_TYPE_MAIN;
  }

  getDisplayText() {
    return "Example view";
  }

  async onOpen() {
    const root = createRoot(this.containerEl.children[1]);
    root.render(
      <React.StrictMode>
        <ReactView app={this.app} settings={this.settings} />
      </React.StrictMode>,
    );
  }

  async onClose() {
    ReactDOM.unmountComponentAtNode(this.containerEl.children[1]);
  }
}
