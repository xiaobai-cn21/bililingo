import test from "node:test";
import assert from "node:assert/strict";
import { BilingoApp } from "../src/content/app.js";
import { DEFAULT_SETTINGS } from "../src/shared/settings.js";
import { installDom } from "../test-support/dom.js";

test("renders the latest dictionary-aware caption and status", async (t) => {
  installDom(t, undefined, "https://example.test/");
  const originalChrome = globalThis.chrome;
  t.after(() => {
    globalThis.chrome = originalChrome;
  });
  globalThis.chrome = {
    runtime: {
      sendMessage: async () => ({ segments: ["我", "喜欢", "中文"] }),
    },
  };

  const rendered = [];
  const statuses = [];
  const app = new BilingoApp();
  app.overlay = {
    showCaption: (caption) => rendered.push(caption),
    clearCaption: () => rendered.push(null),
    setStatus: (status) => statuses.push(status),
  };

  await app.handleCaption("我喜欢中文");
  assert.deepEqual(
    rendered[0].tokens.map(({ surface }) => surface),
    ["我", "喜欢", "中文"],
  );

  app.handleCaptionState("no-captions");
  assert.match(statuses.at(-1), /未检测到字幕/u);
  await app.handleCaption("");
  assert.equal(rendered.at(-1), null);
});

test("attaches one overlay and restores the player on detach", (t) => {
  installDom(t, undefined, "https://example.test/");
  const player = document.createElement("div");
  const video = document.createElement("video");
  player.style.position = "static";
  player.append(video);
  document.body.append(player);

  const app = new BilingoApp();
  app.settings = { ...DEFAULT_SETTINGS, enabled: false };
  app.attach(video, player);

  assert.ok(app.overlay);
  assert.equal(player.querySelectorAll("[data-bilingo-root]").length, 1);
  app.detach();
  assert.equal(player.querySelectorAll("[data-bilingo-root]").length, 0);
  assert.equal(app.video, null);
});

test("disabled caption observation clears an existing observer", (t) => {
  installDom(t, undefined, "https://example.test/");
  const app = new BilingoApp();
  let stopped = 0;
  let status = "unchanged";
  app.settings = { ...DEFAULT_SETTINGS, enabled: false };
  app.overlay = {
    setStatus: (value) => {
      status = value;
    },
  };
  app.captionObserver = { stop: () => (stopped += 1) };

  app.updateCaptionObserver();
  assert.equal(stopped, 1);
  assert.equal(status, "");
  assert.equal(app.captionState, "paused");
});
