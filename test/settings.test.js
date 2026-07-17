import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SETTINGS, normalizeSettings } from "../src/shared/settings.js";

test("settings use safe defaults", () => {
  assert.deepEqual(normalizeSettings(), DEFAULT_SETTINGS);
});

test("settings clamp numeric values", () => {
  const settings = normalizeSettings({ fontScale: 99, opacity: 0, verticalOffset: -10 });
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
