import { CaptionObserver, findPlayer, findVideo } from "./caption-source.js";
import { LearningOverlay } from "./overlay.js";
import { readSettings, writeSettings } from "../shared/settings.js";
import { tokenizeChinese } from "./tokenizer.js";

class BilingoApp {
  constructor() {
    this.settings = null;
    this.video = null;
    this.player = null;
    this.overlay = null;
    this.captionObserver = null;
    this.pageObserver = null;
    this.lastUrl = location.href;
    this.captionStartedAt = 0;
    this.attaching = false;
  }

  async start() {
    this.settings = await readSettings();
    this.bindStorage();
    this.observePage();
    await this.attachWhenReady();
  }

  bindStorage() {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      const patch = Object.fromEntries(
        Object.entries(changes).map(([key, value]) => [key, value.newValue]),
      );
      void readSettings().then((settings) => {
        this.settings = settings;
        this.overlay?.updateSettings(settings);
        this.updateCaptionObserver();
      });
    });
  }

  observePage() {
    this.pageObserver = new MutationObserver(() => {
      if (location.href !== this.lastUrl) {
        this.lastUrl = location.href;
        this.detach();
      }
      if (!this.overlay || !document.contains(this.video)) void this.attachWhenReady();
    });
    this.pageObserver.observe(document.documentElement, { childList: true, subtree: true });
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
    if (getComputedStyle(player).position === "static") player.style.position = "relative";
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
    this.updateCaptionObserver();
  }

  updateCaptionObserver() {
    this.captionObserver?.stop();
    this.captionObserver = null;
    if (!this.settings?.enabled || !this.overlay) return;
    this.captionObserver = new CaptionObserver({
      onCaption: (text) => this.handleCaption(text),
    });
    this.captionObserver.start();
  }

  handleCaption(text) {
    const now = performance.now();
    const previousDuration = this.captionStartedAt ? now - this.captionStartedAt : 3500;
    this.captionStartedAt = now;
    const tokens = tokenizeChinese(text);
    if (!tokens.length) return;
    this.overlay.showCaption({
      text,
      tokens,
      startedAt: now,
      durationMs: Math.min(7000, Math.max(1800, previousDuration)),
    });
  }

  detach() {
    this.captionObserver?.stop();
    this.captionObserver = null;
    this.overlay?.destroy();
    this.overlay = null;
    this.video = null;
    this.player = null;
    this.captionStartedAt = 0;
  }
}

if (location.hostname === "www.bilibili.com") {
  new BilingoApp().start().catch((error) => {
    console.error("Bilingo failed to initialize", error);
  });
}
