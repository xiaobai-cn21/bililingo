import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { installDom } from "../test-support/dom.js";

test("initializes, toggles settings and opens options", async (t) => {
  const html = await readFile(
    new URL("../src/popup.html", import.meta.url),
    "utf8",
  );
  installDom(t, html);
  const originalChrome = globalThis.chrome;
  let stored = { enabled: true };
  let openedOptions = 0;
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
    tabs: {
      query: async () => [{ id: 7 }],
      sendMessage: async () => ({ eligible: true, captionState: "ready" }),
    },
    runtime: {
      openOptionsPage: () => (openedOptions += 1),
    },
  };

  await import(`../src/popup.js?test=${Date.now()}`);
  await tick();
  const enabled = document.querySelector("#enabled");
  assert.equal(enabled.checked, true);
  assert.match(
    document.querySelector("#status").textContent,
    /Captions connected/u,
  );

  enabled.checked = false;
  enabled.dispatchEvent(new Event("change"));
  await tick();
  assert.equal(stored.enabled, false);

  document.querySelector("#options").click();
  assert.equal(openedOptions, 1);
});

function tick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
