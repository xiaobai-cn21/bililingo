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

    this.host = document.createElement("div");
    this.host.dataset.bilingoRoot = "";
    this.host.setAttribute("aria-label", "Bilingo learning captions");
    this.shadow = this.host.attachShadow({ mode: "closed" });
    this.shadow.append(createTemplate());
    this.player.append(this.host);

    this.elements = {
      shell: this.shadow.querySelector(".shell"),
      activation: this.shadow.querySelector(".activation"),
      caption: this.shadow.querySelector(".caption"),
      tokens: this.shadow.querySelector(".tokens"),
      card: this.shadow.querySelector(".card"),
      cardWord: this.shadow.querySelector(".card-word"),
      cardPinyin: this.shadow.querySelector(".card-pinyin"),
      cardPos: this.shadow.querySelector(".card-pos"),
      cardMeaning: this.shadow.querySelector(".card-meaning"),
      cardContext: this.shadow.querySelector(".card-context"),
      status: this.shadow.querySelector(".status"),
    };

    this.bindEvents();
  }

  bindEvents() {
    this.elements.activation.addEventListener("click", () => {
      Promise.resolve(this.onEnable()).catch(() => {
        this.setStatus("启用失败，请重试 / Could not enable; please retry");
      });
    });
    this.shadow.querySelector(".card-close").addEventListener("click", () => this.closeCard(true));
    this.shadow.querySelector(".replay").addEventListener("click", () => {
      this.video.currentTime = Math.max(0, this.video.currentTime - 3);
      void this.video.play().catch(() => {
        this.setStatus("浏览器阻止了自动播放 / Playback was blocked");
      });
    });
    this.elements.card.addEventListener("keydown", (event) => this.handleCardKeydown(event));
    this.elements.caption.addEventListener("pointerdown", (event) => this.startDrag(event));
    this.elements.caption.addEventListener("pointermove", (event) => this.moveDrag(event));
    this.elements.caption.addEventListener("pointerup", () => this.endDrag());
    this.elements.caption.addEventListener("pointercancel", () => this.endDrag());
  }

  updateSettings(settings) {
    this.settings = settings;
    this.host.style.setProperty("--bilingo-scale", String(settings.fontScale));
    this.host.style.setProperty("--bilingo-opacity", String(settings.opacity));
    this.host.style.setProperty("--bilingo-offset", `${settings.verticalOffset}%`);
    this.elements.activation.hidden = settings.enabled;
    this.elements.caption.hidden = !settings.enabled || !this.tokens.length;
    for (const [index, pronunciation] of [...this.shadow.querySelectorAll(".pinyin")].entries()) {
      pronunciation.textContent = settings.showPinyin ? this.tokens[index]?.pinyin ?? "" : "";
    }
    if (!settings.enabled) this.closeCard();
  }

  showCaption({ text, tokens }) {
    this.captionText = text;
    this.tokens = tokens;
    this.elements.tokens.replaceChildren(...tokens.map((token, index) => this.makeToken(token, index)));
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
    if (this.elements.status.textContent !== message) this.elements.status.textContent = message;
  }

  makeToken(token, index) {
    const element = document.createElement(token.selectable ? "button" : "span");
    element.className = `token${token.selectable ? " selectable" : " punctuation"}`;
    element.dataset.index = String(index);
    if (token.selectable) {
      element.type = "button";
      element.setAttribute("aria-label", `${token.surface}${token.pinyin ? `, ${token.pinyin}` : ""}`);
      element.addEventListener("click", () => this.openCard(token, element));
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

  openCard(token, anchor) {
    if (this.settings?.pauseOnClick) this.video.pause();
    const definition = lookupWord(token.normalized);
    this.elements.cardWord.textContent = token.surface;
    this.elements.cardPinyin.textContent = token.pinyin;
    this.elements.cardPos.textContent = definition.partOfSpeech;
    this.elements.cardMeaning.textContent = definition.meaning;
    this.elements.cardContext.textContent = this.captionText;
    this.elements.card.hidden = false;
    this.elements.card.dataset.source = definition.source;
    this.activeAnchor?.removeAttribute("aria-expanded");
    this.activeAnchor = anchor;
    this.shadow.querySelector(".card-close").focus();
    anchor.setAttribute("aria-expanded", "true");
  }

  closeCard(restoreFocus = false) {
    this.elements.card.hidden = true;
    for (const token of this.shadow.querySelectorAll("[aria-expanded]")) {
      token.removeAttribute("aria-expanded");
    }
    if (restoreFocus && this.activeAnchor?.isConnected) this.activeAnchor.focus();
    this.activeAnchor = null;
  }

  handleCardKeydown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      this.closeCard(true);
      return;
    }
    if (event.key !== "Tab") return;
    const controls = [...this.elements.card.querySelectorAll("button:not([disabled])")];
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
    this.drag = { startY: event.clientY, startOffset: this.settings.verticalOffset };
    this.elements.caption.setPointerCapture(event.pointerId);
  }

  moveDrag(event) {
    if (!this.drag) return;
    const playerHeight = Math.max(1, this.player.getBoundingClientRect().height);
    const delta = ((this.drag.startY - event.clientY) / playerHeight) * 100;
    const next = Math.min(35, Math.max(0, this.drag.startOffset + delta));
    this.host.style.setProperty("--bilingo-offset", `${next}%`);
    this.drag.nextOffset = next;
  }

  endDrag() {
    if (Number.isFinite(this.drag?.nextOffset)) this.onOffsetChange(this.drag.nextOffset);
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
        --lens-bg: rgba(7, 12, 16, calc(var(--bilingo-opacity) * .84));
        --lens-border: rgba(134, 239, 172, .24);
        --lens-muted: rgba(214, 255, 239, .72);
        --lens-text: rgba(255, 252, 242, .98);
        --lens-accent: #86efac;
        --lens-warm: #f7d46b;
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
        border: 1px solid rgba(134,239,172,.32);
        border-radius: 8px;
        padding: 8px 11px;
        color: #ecfdf5;
        background: rgba(7, 12, 16, .82);
        box-shadow: 0 12px 28px rgba(0,0,0,.28);
        backdrop-filter: blur(10px);
        cursor: pointer;
      }
      .activation:hover { background: rgba(12, 22, 20, .92); border-color: rgba(134,239,172,.52); }
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
        background:
          linear-gradient(180deg, rgba(255,255,255,.055), rgba(255,255,255,0)),
          var(--lens-bg);
        box-shadow: 0 14px 42px rgba(0,0,0,.36), inset 0 1px rgba(255,255,255,.08);
        backdrop-filter: blur(12px) saturate(1.15);
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
        background: rgba(134,239,172,.08);
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
        width: min(380px, calc(100% - 32px));
        box-sizing: border-box;
        pointer-events: auto;
        padding: 15px;
        border: 1px solid rgba(134,239,172,.24);
        border-radius: 8px;
        color: #f8fafc;
        background:
          linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,0)),
          rgba(8, 13, 18, .94);
        box-shadow: 0 22px 60px rgba(0,0,0,.48), inset 3px 0 var(--lens-accent);
        backdrop-filter: blur(14px);
      }
      .card-head { display: flex; align-items: flex-start; gap: 12px; }
      .card-word { font-size: 32px; font-weight: 720; color: var(--lens-text); }
      .card-reading { flex: 1; padding-top: 4px; }
      .card-pinyin { color: var(--lens-accent); font-size: 15px; }
      .card-pos { color: rgba(214,255,239,.6); font-size: 12px; }
      .card-close, .replay {
        border: 1px solid rgba(255,255,255,.14);
        border-radius: 7px;
        color: #e7fff2;
        background: rgba(255,255,255,.06);
        cursor: pointer;
      }
      .card-close:hover, .replay:hover { border-color: rgba(134,239,172,.38); background: rgba(134,239,172,.1); }
      .card-close { width: 30px; height: 30px; }
      .card-meaning { margin: 12px 0 8px; font-size: 15px; line-height: 1.45; }
      .card-context { margin: 0 0 12px; color: rgba(226,232,240,.76); font-size: 13px; line-height: 1.45; }
      .replay { padding: 7px 10px; }
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
        <button class="replay" type="button">Replay last 3 seconds</button>
      </article>
      <div class="status" role="status" aria-live="polite"></div>
    </section>`;
  return template.content;
}
