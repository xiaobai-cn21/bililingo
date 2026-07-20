import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_SETTINGS,
  normalizeSettings,
  readSettings,
  writeSettings,
} from "../src/shared/settings.js";

test("settings use safe defaults", () => {
  assert.deepEqual(normalizeSettings(), DEFAULT_SETTINGS);
});

test("settings clamp numeric values", () => {
  const settings = normalizeSettings({
    fontScale: 99,
    opacity: 0,
    verticalOffset: -10,
  });
  assert.equal(settings.fontScale, 1.5);
  assert.equal(settings.opacity, 0.45);
  assert.equal(settings.verticalOffset, 0);
});

test("settings coerce feature flags", () => {
  const settings = normalizeSettings({
    enabled: 1,
    showPinyin: 0,
    pauseOnClick: "yes",
  });
  assert.equal(settings.enabled, true);
  assert.equal(settings.showPinyin, false);
  assert.equal(settings.pauseOnClick, true);
});

test("reads and writes normalized Chrome local settings", async (t) => {
  const originalChrome = globalThis.chrome;
  const writes = [];
  t.after(() => {
    globalThis.chrome = originalChrome;
  });
  globalThis.chrome = {
    storage: {
      local: {
        get: async () => ({ fontScale: 9, showPinyin: false }),
        set: async (value) => writes.push(value),
      },
    },
  };

  const stored = await readSettings();
  assert.equal(stored.fontScale, 1.5);
  assert.equal(stored.showPinyin, false);

  const written = await writeSettings({ opacity: 0 });
  assert.equal(written.opacity, 0.45);
  assert.deepEqual(writes, [written]);
});
