import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { installDom } from "../test-support/dom.js";

test("loads, saves and resets caption preferences", async (t) => {
  const html = await readFile(
    new URL("../src/options.html", import.meta.url),
    "utf8",
  );
  installDom(t, html);
  const originalChrome = globalThis.chrome;
  let stored = {
    enabled: false,
    showPinyin: true,
    pauseOnClick: true,
    fontScale: 1,
    opacity: 0.86,
    verticalOffset: 12,
  };
  t.after(() => {
    globalThis.chrome = originalChrome;
  });
  globalThis.chrome = {
    storage: {
      local: {
        get: async () => stored,
        set: async (value) => {
          stored = value;
        },
      },
    },
  };

  await import(`../src/options.js?test=${Date.now()}`);
  await tick();
  assert.equal(document.querySelector("#fontScaleValue").textContent, "100%");

  const opacity = document.querySelector("#opacity");
  opacity.value = "0.6";
  opacity.dispatchEvent(new Event("input"));
  await tick();
  assert.equal(stored.opacity, 0.6);
  assert.match(document.querySelector("#saved").textContent, /Saved/u);

  document.querySelector("#reset").click();
  await tick();
  assert.equal(stored.opacity, 0.86);
  assert.match(
    document.querySelector("#saved").textContent,
    /Defaults restored/u,
  );
});

function tick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
