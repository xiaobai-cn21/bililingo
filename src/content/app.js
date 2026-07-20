import { CaptionObserver, findPlayer, findVideo } from "./caption-source.js";
import { LearningOverlay } from "./overlay.js";
import { readSettings, writeSettings } from "../shared/settings.js";
import { tokenizeChineseWithDictionary } from "./tokenizer.js";

export class BilingoApp {
  constructor() {
    this.settings = null;
    this.video = null;
    this.player = null;
    this.overlay = null;
    this.captionObserver = null;
    this.pageObserver = null;
    this.lastUrl = location.href;
    this.attaching = false;
    this.originalPlayerPosition = null;
    this.onVideoSeeking = null;
    this.captionState = "paused";
    this.captionRequest = 0;
  }

  async start() {
    this.settings = await readSettings();
    this.bindStorage();
    this.bindRuntimeMessages();
    this.observePage();
    await this.attachWhenReady();
  }

  bindStorage() {
    chrome.storage.onChanged.addListener((_changes, area) => {
      if (area !== "local") return;
      void readSettings().then((settings) => {
        this.settings = settings;
        this.overlay?.updateSettings(settings);
        this.updateCaptionObserver();
      });
    });
  }

  bindRuntimeMessages() {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (!message || message.type !== "bilingo:get-status") return false;
      sendResponse({
        eligible: Boolean(this.video && this.player),
        enabled: Boolean(this.settings?.enabled),
        captionState: this.settings?.enabled ? this.captionState : "paused",
      });
      return false;
    });
  }

  observePage() {
    this.pageObserver = new MutationObserver(() => {
      if (location.href !== this.lastUrl) {
        this.lastUrl = location.href;
        this.detach();
      }
      if (!this.overlay || !document.contains(this.video))
        void this.attachWhenReady();
    });
    this.pageObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  async attachWhenReady() {
    if (this.attaching) return;
    this.attaching = true;
    try {
      for (let attempt = 0; attempt < 30; attempt += 1) {
        const video = findVideo();
        const player = findPlayer(video);
        if (video && player) {
          this.attach(video, player);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } finally {
      this.attaching = false;
    }
  }

  attach(video, player) {
    if (this.video === video && this.overlay) return;
    this.detach();
    this.video = video;
    this.player = player;
    if (getComputedStyle(player).position === "static") {
      this.originalPlayerPosition = player.style.position;
      player.style.position = "relative";
    }
    this.overlay = new LearningOverlay({
      player,
      video,
      onEnable: async () => {
        this.settings = await writeSettings({ enabled: true });
        this.overlay?.updateSettings(this.settings);
        this.updateCaptionObserver();
      },
      onOffsetChange: async (verticalOffset) => {
        this.settings = await writeSettings({ verticalOffset });
        this.overlay?.updateSettings(this.settings);
      },
    });
    this.overlay.updateSettings(this.settings);
    this.onVideoSeeking = () => {
      this.overlay?.clearCaption();
      this.captionObserver?.refresh();
    };
    video.addEventListener("seeking", this.onVideoSeeking);
    this.updateCaptionObserver();
  }

  updateCaptionObserver() {
    this.captionObserver?.stop();
    this.captionObserver = null;
    if (!this.settings?.enabled || !this.overlay) {
      this.captionState = "paused";
      this.overlay?.setStatus("");
      return;
    }
    this.captionObserver = new CaptionObserver({
      root: this.player,
      onCaption: (text) => void this.handleCaption(text),
      onState: (state) => this.handleCaptionState(state),
    });
    this.captionObserver.start();
  }

  async handleCaption(text) {
    const request = ++this.captionRequest;
    if (!text) {
      this.overlay?.clearCaption();
      return;
    }
    const tokens = await tokenizeChineseWithDictionary(text);
    if (request !== this.captionRequest) return;
    if (!tokens.length) return;
    this.overlay.showCaption({
      text,
      tokens,
    });
  }

  handleCaptionState(state) {
    this.captionState = state;
    const messages = {
      waiting: "正在等待原生字幕 / Waiting for native captions…",
      ready: "",
      "no-captions":
        "未检测到字幕，请在播放器中开启字幕 / No captions detected",
      "temporarily-unavailable":
        "字幕集成暂时不可用 / Caption integration temporarily unavailable",
    };
    this.overlay?.setStatus(messages[state] ?? "");
  }

  detach() {
    this.captionRequest += 1;
    this.captionObserver?.stop();
    this.captionObserver = null;
    if (this.video && this.onVideoSeeking) {
      this.video.removeEventListener("seeking", this.onVideoSeeking);
    }
    this.onVideoSeeking = null;
    this.overlay?.destroy();
    this.overlay = null;
    if (this.player && this.originalPlayerPosition !== null) {
      this.player.style.position = this.originalPlayerPosition;
    }
    this.originalPlayerPosition = null;
    this.video = null;
    this.player = null;
    this.captionState = this.settings?.enabled ? "waiting" : "paused";
  }
}

if (globalThis.location?.hostname === "www.bilibili.com") {
  new BilingoApp().start().catch((error) => {
    console.error("Bilingo failed to initialize", error);
  });
}
