import { lookupWord } from "./dictionary.js";

export class LearningOverlay {
  constructor({ player, video, onEnable, onOffsetChange }) {
    this.player = player;
    this.video = video;
    this.onEnable = onEnable;
    this.onOffsetChange = onOffsetChange;
    this.settings = null;
    this.tokens = [];
    this.captionText = "";
    this.drag = null;
    this.activeAnchor = null;
    this.activeLookup = null;

    this.host = document.createElement("div");
    this.host.dataset.bilingoRoot = "";
    this.host.setAttribute("aria-label", "Bilingo learning captions");
    this.shadow = this.host.attachShadow({ mode: "closed" });
    this.shadow.append(createTemplate());
    this.player.append(this.host);

    this.elements = {
      shell: queryElement(this.shadow, ".shell"),
      activation: queryElement(this.shadow, ".activation"),
      caption: queryElement(this.shadow, ".caption"),
      tokens: queryElement(this.shadow, ".tokens"),
      card: queryElement(this.shadow, ".card"),
      cardWord: queryElement(this.shadow, ".card-word"),
      cardPinyin: queryElement(this.shadow, ".card-pinyin"),
      cardPos: queryElement(this.shadow, ".card-pos"),
      cardMeaning: queryElement(this.shadow, ".card-meaning"),
      cardContext: queryElement(this.shadow, ".card-context"),
      status: queryElement(this.shadow, ".status"),
    };

    this.bindEvents();
  }

  bindEvents() {
    this.elements.activation.addEventListener("click", () => {
      Promise.resolve(this.onEnable()).catch(() => {
        this.setStatus("启用失败，请重试 / Could not enable; please retry");
      });
    });
    queryButton(this.shadow, ".card-close").addEventListener("click", () =>
      this.closeCard(true),
    );
    this.elements.card.addEventListener("keydown", (event) =>
      this.handleCardKeydown(event),
    );
    this.elements.caption.addEventListener("pointerdown", (event) =>
      this.startDrag(event),
    );
    this.elements.caption.addEventListener("pointermove", (event) =>
      this.moveDrag(event),
    );
    this.elements.caption.addEventListener("pointerup", () => this.endDrag());
    this.elements.caption.addEventListener("pointercancel", () =>
      this.endDrag(),
    );
  }

  updateSettings(settings) {
    this.settings = settings;
    this.host.style.setProperty("--bilingo-scale", String(settings.fontScale));
    this.host.style.setProperty("--bilingo-opacity", String(settings.opacity));
    this.host.style.setProperty(
      "--bilingo-offset",
      `${settings.verticalOffset}%`,
    );
    this.elements.activation.hidden = settings.enabled;
    this.elements.caption.hidden = !settings.enabled || !this.tokens.length;
    for (const [index, pronunciation] of [
      ...this.shadow.querySelectorAll(".pinyin"),
    ].entries()) {
      pronunciation.textContent = settings.showPinyin
        ? (this.tokens[index]?.pinyin ?? "")
        : "";
    }
    if (!settings.enabled) this.closeCard();
  }

  showCaption({ text, tokens }) {
    this.captionText = text;
    this.tokens = tokens;
    this.elements.tokens.replaceChildren(
      ...tokens.map((token, index) => this.makeToken(token, index)),
    );
    this.elements.caption.hidden = !this.settings?.enabled;
    this.elements.status.textContent = "";
  }

  clearCaption() {
    this.tokens = [];
    this.elements.tokens.replaceChildren();
    this.elements.caption.hidden = true;
    this.closeCard();
  }

  setStatus(message) {
    if (this.elements.status.textContent !== message)
      this.elements.status.textContent = message;
  }

  makeToken(token, index) {
    const element = document.createElement(
      token.selectable ? "button" : "span",
    );
    element.className = `token${token.selectable ? " selectable" : " punctuation"}`;
    element.dataset.index = String(index);
    if (token.selectable && element instanceof HTMLButtonElement) {
      element.type = "button";
      element.setAttribute(
        "aria-label",
        `${token.surface}${token.pinyin ? `, ${token.pinyin}` : ""}`,
      );
      element.addEventListener(
        "click",
        () => void this.openCard(token, element),
      );
    }
    const pronunciation = document.createElement("span");
    pronunciation.className = "pinyin";
    pronunciation.textContent = this.settings?.showPinyin ? token.pinyin : "";
    const surface = document.createElement("span");
    surface.className = "hanzi";
    surface.textContent = token.surface;
    element.append(pronunciation, surface);
    return element;
  }

  async openCard(token, anchor) {
    if (this.settings?.pauseOnClick) this.video.pause();
    const lookup = Symbol(token.normalized);
    this.activeLookup = lookup;
    this.elements.cardWord.textContent = token.surface;
    this.elements.cardPinyin.textContent = token.pinyin;
    this.elements.cardPos.textContent = "";
    this.elements.cardMeaning.textContent = "正在查询 / Looking up…";
    this.elements.cardContext.textContent = this.captionText;
    this.elements.card.hidden = false;
    delete this.elements.card.dataset.source;
    this.activeAnchor?.removeAttribute("aria-expanded");
    this.activeAnchor = anchor;
    anchor.setAttribute("aria-expanded", "true");
    queryButton(this.shadow, ".card-close").focus();

    const definition = await lookupWord(token.normalized);
    if (this.activeLookup !== lookup) return;
    this.elements.cardPos.textContent = definition.partOfSpeech;
    this.elements.cardMeaning.textContent = definition.meaning;
    this.elements.card.dataset.source = definition.source;
  }

  closeCard(restoreFocus = false) {
    this.elements.card.hidden = true;
    for (const token of this.shadow.querySelectorAll("[aria-expanded]")) {
      token.removeAttribute("aria-expanded");
    }
    if (restoreFocus && this.activeAnchor?.isConnected)
      this.activeAnchor.focus();
    this.activeAnchor = null;
    this.activeLookup = null;
  }

  handleCardKeydown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      this.closeCard(true);
      return;
    }
    if (event.key !== "Tab") return;
    const controls = [
      .../** @type {NodeListOf<HTMLButtonElement>} */ (
        this.elements.card.querySelectorAll("button:not([disabled])")
      ),
    ];
    if (!controls.length) return;
    const first = controls[0];
    const last = controls.at(-1);
    if (event.shiftKey && this.shadow.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && this.shadow.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  startDrag(event) {
    if (event.target.closest("button")) return;
    this.drag = {
      startY: event.clientY,
      startOffset: this.settings.verticalOffset,
    };
    this.elements.caption.setPointerCapture(event.pointerId);
  }

  moveDrag(event) {
    if (!this.drag) return;
    const playerHeight = Math.max(
      1,
      this.player.getBoundingClientRect().height,
    );
    const delta = ((this.drag.startY - event.clientY) / playerHeight) * 100;
    const next = Math.min(35, Math.max(0, this.drag.startOffset + delta));
    this.host.style.setProperty("--bilingo-offset", `${next}%`);
    this.drag.nextOffset = next;
  }

  endDrag() {
    if (Number.isFinite(this.drag?.nextOffset))
      this.onOffsetChange(this.drag.nextOffset);
    this.drag = null;
  }

  destroy() {
    this.host.remove();
  }
}

function createTemplate() {
  const template = document.createElement("template");
  template.innerHTML = `
    <style>
      :host {
        --bilingo-scale: 1;
        --bilingo-opacity: .86;
        --bilingo-offset: 12%;
        --lens-bg: rgba(18, 21, 27, calc(var(--bilingo-opacity) * .9));
        --lens-border: rgba(220, 226, 235, .18);
        --lens-muted: rgba(210, 219, 229, .7);
        --lens-text: rgba(250, 252, 255, .98);
        --lens-accent: #63bdf1;
        --lens-warm: #f2c56b;
        position: absolute;
        inset: 0;
        z-index: 40;
        pointer-events: none;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
      }
      [hidden] { display: none !important; }
      button { font: inherit; }
      .shell { position: absolute; inset: 0; pointer-events: none; }
      .activation {
        position: absolute;
        right: 16px;
        top: 16px;
        pointer-events: auto;
        border: 1px solid rgba(220,226,235,.24);
        border-radius: 8px;
        padding: 8px 11px;
        color: #f8fafc;
        background: rgba(18, 21, 27, .88);
        box-shadow: 0 12px 28px rgba(0,0,0,.28);
        backdrop-filter: blur(10px);
        cursor: pointer;
      }
      .activation:hover { background: rgba(28, 33, 42, .94); border-color: rgba(99,189,241,.45); }
      .activation:focus-visible, .token:focus-visible, .card button:focus-visible {
        outline: 2px solid var(--lens-accent);
        outline-offset: 2px;
      }
      .caption {
        position: absolute;
        left: 50%;
        bottom: calc(7% + var(--bilingo-offset));
        transform: translateX(-50%) scale(var(--bilingo-scale));
        transform-origin: center bottom;
        max-width: min(90%, 1040px);
        pointer-events: auto;
        cursor: grab;
        user-select: none;
      }
      .caption:active { cursor: grabbing; }
      .tokens {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        align-items: flex-end;
        gap: 1px 4px;
        padding: 9px 16px 11px;
        border: 1px solid var(--lens-border);
        border-radius: 8px;
        background: var(--lens-bg);
        box-shadow: 0 12px 34px rgba(0,0,0,.34);
        backdrop-filter: blur(12px);
      }
      .token {
        position: relative;
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        min-width: 1.2em;
        padding: 0 3px 3px;
        border: 0;
        border-radius: 5px;
        color: var(--lens-text);
        background: transparent;
        line-height: 1;
      }
      button.token { cursor: pointer; }
      button.token::after {
        content: "";
        position: absolute;
        left: 7px;
        right: 7px;
        bottom: 0;
        height: 1px;
        background: transparent;
      }
      button.token:hover {
        background: rgba(99,189,241,.1);
        color: #fff;
      }
      button.token:hover::after { background: var(--lens-warm); }
      .pinyin {
        min-height: 1.05em;
        color: var(--lens-muted);
        font-size: 11px;
        line-height: 1.05;
        white-space: nowrap;
      }
      .hanzi {
        font-family: "Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", sans-serif;
        font-size: clamp(21px, 2.25vw, 34px);
        line-height: 1.12;
        white-space: pre;
        text-shadow: 0 1px 2px rgba(0,0,0,.78);
      }
      .punctuation { min-width: auto; padding-inline: 0; }
      .punctuation .pinyin { visibility: hidden; }
      .card {
        position: absolute;
        left: 50%;
        bottom: calc(18% + var(--bilingo-offset));
        transform: translateX(-50%);
        width: min(400px, calc(100% - 32px));
        box-sizing: border-box;
        pointer-events: auto;
        padding: 16px;
        border: 1px solid rgba(220,226,235,.18);
        border-radius: 8px;
        color: #f8fafc;
        background: rgba(23, 27, 34, .96);
        box-shadow: 0 18px 46px rgba(0,0,0,.42);
        backdrop-filter: blur(14px);
      }
      .card-head { display: flex; align-items: flex-start; gap: 12px; }
      .card-word { font-size: 30px; line-height: 1.05; font-weight: 720; color: var(--lens-text); }
      .card-reading { flex: 1; min-width: 0; padding-top: 3px; }
      .card-pinyin { color: var(--lens-accent); font-size: 15px; line-height: 1.35; }
      .card-pos { color: rgba(210,219,229,.58); font-size: 12px; line-height: 1.35; }
      .card-close {
        border: 1px solid rgba(255,255,255,.12);
        border-radius: 7px;
        color: #d8e0ea;
        background: rgba(255,255,255,.04);
        cursor: pointer;
      }
      .card-close:hover { border-color: rgba(99,189,241,.36); background: rgba(99,189,241,.1); }
      .card-close { width: 30px; height: 30px; }
      .card-meaning { margin: 13px 0 9px; color: #eef2f7; font-size: 15px; line-height: 1.45; }
      .card-context {
        margin: 0;
        padding-top: 10px;
        border-top: 1px solid rgba(220,226,235,.12);
        color: rgba(226,232,240,.7);
        font-size: 13px;
        line-height: 1.45;
      }
      .status { position: absolute; left: 12px; bottom: 12px; color: #fff; font-size: 12px; }
      @media (prefers-reduced-motion: reduce) { * { scroll-behavior: auto !important; } }
    </style>
    <section class="shell">
      <button class="activation" type="button">Enable learning captions</button>
      <div class="caption" hidden aria-live="off" aria-label="Interactive Chinese caption">
        <div class="tokens"></div>
      </div>
      <article class="card" hidden role="dialog" aria-modal="true" aria-label="词语释义 / Word definition">
        <div class="card-head">
          <strong class="card-word"></strong>
          <div class="card-reading">
            <div class="card-pinyin"></div>
            <div class="card-pos"></div>
          </div>
          <button class="card-close" type="button" aria-label="Close definition">×</button>
        </div>
        <p class="card-meaning"></p>
        <p class="card-context"></p>
      </article>
      <div class="status" role="status" aria-live="polite"></div>
    </section>`;
  return template.content;
}

function queryElement(root, selector) {
  const element = root.querySelector(selector);
  if (!(element instanceof HTMLElement))
    throw new Error(`Missing overlay element: ${selector}`);
  return element;
}

function queryButton(root, selector) {
  const element = root.querySelector(selector);
  if (!(element instanceof HTMLButtonElement))
    throw new Error(`Missing overlay button: ${selector}`);
  return element;
}
