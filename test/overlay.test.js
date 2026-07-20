import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { LearningOverlay } from "../src/content/overlay.js";
import { DEFAULT_SETTINGS } from "../src/shared/settings.js";

test("renders tokens and resolves a definition without replay controls", async (t) => {
  const dom = installDom(t);
  const originalChrome = globalThis.chrome;
  t.after(() => {
    globalThis.chrome = originalChrome;
  });
  globalThis.chrome = {
    runtime: {
      sendMessage: async () => ({
        meaning: "to like; to be fond of",
        partOfSpeech: "",
        source: "CC-CEDICT",
      }),
    },
  };

  const player = document.createElement("div");
  document.body.append(player);
  let pauses = 0;
  const overlay = new LearningOverlay({
    player,
    video: { pause: () => (pauses += 1) },
    onEnable: () => {},
    onOffsetChange: () => {},
  });
  overlay.updateSettings({ ...DEFAULT_SETTINGS, enabled: true });
  overlay.showCaption({
    text: "我喜欢中文",
    tokens: [
      {
        id: "token-0",
        surface: "喜欢",
        normalized: "喜欢",
        selectable: true,
        pinyin: "xǐ huān",
      },
    ],
  });

  const token = overlay.shadow.querySelector(".selectable");
  assert.ok(token instanceof dom.window.HTMLButtonElement);
  token.click();
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(pauses, 1);
  assert.equal(
    overlay.shadow.querySelector(".card-meaning").textContent,
    "to like; to be fond of",
  );
  assert.equal(
    overlay.shadow.querySelector(".card").dataset.source,
    "CC-CEDICT",
  );
  assert.equal(
    overlay.shadow.textContent.includes("Replay last 3 seconds"),
    false,
  );

  overlay.shadow.querySelector(".card-close").click();
  assert.equal(overlay.shadow.querySelector(".card").hidden, true);
  overlay.destroy();
  assert.equal(player.children.length, 0);
});

test("updates display settings and persists a dragged offset", (t) => {
  installDom(t);
  const player = document.createElement("div");
  player.getBoundingClientRect = () => ({ height: 400 });
  document.body.append(player);
  let savedOffset = null;
  const overlay = new LearningOverlay({
    player,
    video: { pause: () => {} },
    onEnable: () => {},
    onOffsetChange: (offset) => {
      savedOffset = offset;
    },
  });
  overlay.updateSettings({
    ...DEFAULT_SETTINGS,
    enabled: true,
    showPinyin: false,
  });
  overlay.showCaption({
    text: "你好",
    tokens: [
      {
        id: "token-0",
        surface: "你好",
        normalized: "你好",
        selectable: true,
        pinyin: "nǐ hǎo",
      },
    ],
  });

  const caption = overlay.elements.caption;
  caption.setPointerCapture = () => {};
  overlay.startDrag({ target: caption, clientY: 200, pointerId: 1 });
  overlay.moveDrag({ clientY: 160 });
  overlay.endDrag();

  assert.equal(overlay.shadow.querySelector(".pinyin").textContent, "");
  assert.equal(savedOffset, 22);
  overlay.clearCaption();
  assert.equal(overlay.elements.caption.hidden, true);
});

function installDom(t) {
  const dom = new JSDOM("<!doctype html><body></body>", {
    url: "https://example.test/",
  });
  const names = [
    "document",
    "HTMLElement",
    "HTMLButtonElement",
    "HTMLSpanElement",
    "Node",
  ];
  const originals = new Map(
    names.map((name) => [
      name,
      Object.getOwnPropertyDescriptor(globalThis, name),
    ]),
  );
  for (const name of names) {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      writable: true,
      value: dom.window[name],
    });
  }
  t.after(() => {
    dom.window.close();
    for (const [name, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  });
  return dom;
}
