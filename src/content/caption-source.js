const NATIVE_TEXT_SELECTORS = [
  ".bpx-player-subtitle-panel-text",
  ".bpx-player-subtitle-panel-wrap",
  ".bpx-player-subtitle-text",
  ".bpx-player-subtitle-item-text",
  ".bpx-player-subtitle-current",
  ".bilibili-player-video-subtitle",
  "[class*='subtitle-position']",
  "[class*='subtitle-item']",
  "[class*='subtitle'][class*='text']",
  "[class*='subtitle'][class*='content']",
];

const IGNORE_SELECTORS = [
  "bilingo-overlay",
  "[data-bilingo-root]",
  ".bpx-player-control-bottom",
  ".bpx-player-dm-wrap",
  ".bpx-player-video-btn",
  ".bpx-player-contextmenu",
  "[class*='subtitle-setting']",
  "[class*='subtitle-settings']",
];

export function findVideo(root = document) {
  const videos = [...root.querySelectorAll("video")];
  return videos.find((video) => video.readyState > 0) ?? videos[0] ?? null;
}

export function findPlayer(video) {
  if (!video) return null;
  return (
    video.closest(".bpx-player-container") ??
    video.closest(".bilibili-player") ??
    video.parentElement
  );
}

export function readNativeCaption(root = document) {
  for (const selector of NATIVE_TEXT_SELECTORS) {
    for (const element of root.querySelectorAll(selector)) {
      if (IGNORE_SELECTORS.some((ignored) => element.closest(ignored)))
        continue;
      if (!isVisible(element)) continue;
      const text = normalizeCaption(element.textContent);
      if (isLikelyCaption(text)) return text;
    }
  }
  return readVisiblePlayerCaption(root);
}

export function normalizeCaption(value) {
  return String(value ?? "")
    .replace(/\s+/gu, " ")
    .replace(/^(?:字幕|CC)\s*[:：]\s*/u, "")
    .trim();
}

function isVisible(element) {
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    Number(style.opacity || 1) > 0 &&
    rect.width > 0 &&
    rect.height > 0
  );
}

function isLikelyCaption(text) {
  if (!(text.length > 0 && text.length <= 240 && /[\p{L}\p{N}]/u.test(text)))
    return false;
  if (/^(?:关闭|字幕设置|中文\s*AI|自动|倍速|画质)$/u.test(text)) return false;
  return true;
}

function readVisiblePlayerCaption(root) {
  const video = findVideo(root);
  const player = findPlayer(video);
  if (!video || !player) return "";

  const videoRect = video.getBoundingClientRect();
  if (videoRect.width <= 0 || videoRect.height <= 0) return "";

  const candidates = [];
  // The fallback deliberately stays limited to caption-like classes. Scanning every
  // text node in the player both causes layout churn and mistakes controls/ads for cues.
  for (const element of player.querySelectorAll(
    "[class*='subtitle'], [class*='caption'], [data-testid*='subtitle'], [data-testid*='caption']",
  )) {
    if (IGNORE_SELECTORS.some((ignored) => element.closest(ignored))) continue;
    if (!isVisible(element)) continue;

    const text = normalizeCaption(element.textContent);
    if (!isLikelyCaption(text)) continue;

    const rect = element.getBoundingClientRect();
    if (!isLikelyCaptionRect(rect, videoRect)) continue;
    if (
      element.children.length &&
      [...element.children].some(
        (child) => normalizeCaption(child.textContent) === text,
      )
    ) {
      continue;
    }
    candidates.push({ element, text, rect });
  }

  candidates.sort((a, b) => {
    const aSubtitleClass = /subtitle|caption/i.test(
      String(a.element.className),
    );
    const bSubtitleClass = /subtitle|caption/i.test(
      String(b.element.className),
    );
    if (aSubtitleClass !== bSubtitleClass) return aSubtitleClass ? -1 : 1;
    return b.rect.width - a.rect.width;
  });

  return candidates[0]?.text ?? "";
}

function isLikelyCaptionRect(rect, videoRect) {
  const lowerVideoStart = videoRect.top + videoRect.height * 0.45;
  const overlapsVideo =
    rect.left < videoRect.right &&
    rect.right > videoRect.left &&
    rect.top < videoRect.bottom &&
    rect.bottom > videoRect.top;
  const inCaptionArea =
    rect.top >= lowerVideoStart && rect.bottom <= videoRect.bottom + 8;
  const reasonableSize =
    rect.width >= 24 &&
    rect.height >= 10 &&
    rect.height <= videoRect.height * 0.25;
  return overlapsVideo && inCaptionArea && reasonableSize;
}

export class CaptionObserver {
  /**
   * @param {{
   *   root?: Document | Element,
   *   onCaption: (text: string) => void,
   *   onState?: (state: "waiting" | "ready" | "no-captions" | "temporarily-unavailable") => void,
   *   pollInterval?: number,
   *   clearAfterEmptyReads?: number,
   *   noCaptionTimeout?: number,
   *   readCaption?: (root: Document | Element) => string,
   *   now?: () => number
   * }} options
   */
  constructor({
    root = document,
    onCaption,
    onState = () => {},
    pollInterval = 500,
    clearAfterEmptyReads = 2,
    noCaptionTimeout = 5000,
    readCaption = readNativeCaption,
    now = () => performance.now(),
  }) {
    this.root = root;
    this.onCaption = onCaption;
    this.pollInterval = pollInterval;
    this.clearAfterEmptyReads = clearAfterEmptyReads;
    this.noCaptionTimeout = noCaptionTimeout;
    this.readCaption = readCaption;
    this.now = now;
    this.lastText = "";
    this.emptyReads = 0;
    this.hasSeenCaption = false;
    this.reportedNoCaption = false;
    this.startedAt = 0;
    this.timer = null;
    this.scheduledCheck = null;
    this.observer = null;
    this.onState = onState;
  }

  start() {
    if (this.observer) return;
    this.startedAt = this.now();
    this.onState("waiting");
    this.observer = new MutationObserver(() => this.scheduleCheck());
    const observationRoot =
      this.root instanceof Document ? this.root.body : this.root;
    this.observer.observe(observationRoot, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    this.timer = setInterval(() => this.check(), this.pollInterval);
    this.check();
  }

  scheduleCheck() {
    if (this.scheduledCheck) return;
    this.scheduledCheck = setTimeout(() => {
      this.scheduledCheck = null;
      this.check();
    }, 100);
  }

  check() {
    let next;
    try {
      next = this.readCaption(this.root);
    } catch {
      this.onState("temporarily-unavailable");
      return;
    }
    if (next) {
      this.emptyReads = 0;
      this.hasSeenCaption = true;
      this.reportedNoCaption = false;
      this.onState("ready");
      if (!this.timer && this.observer) {
        this.timer = setInterval(() => this.check(), this.pollInterval);
      }
      if (next !== this.lastText) {
        this.lastText = next;
        this.onCaption(next);
      }
      return;
    }

    this.emptyReads += 1;
    if (this.lastText && this.emptyReads >= this.clearAfterEmptyReads) {
      this.lastText = "";
      this.onCaption("");
    }
    if (
      !this.hasSeenCaption &&
      !this.reportedNoCaption &&
      this.now() - this.startedAt >= this.noCaptionTimeout
    ) {
      this.reportedNoCaption = true;
      this.onState("no-captions");
      // Keep the mutation observer so enabling native subtitles is detected, but
      // stop blind polling after the bounded eligibility window.
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
    }
  }

  refresh() {
    this.lastText = "";
    this.emptyReads = 0;
    this.check();
  }

  stop() {
    this.observer?.disconnect();
    if (this.timer) clearInterval(this.timer);
    if (this.scheduledCheck) clearTimeout(this.scheduledCheck);
    this.timer = null;
    this.scheduledCheck = null;
    this.observer = null;
    this.lastText = "";
    this.emptyReads = 0;
    this.hasSeenCaption = false;
    this.reportedNoCaption = false;
  }
}
