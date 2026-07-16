export const DEFAULT_SETTINGS = Object.freeze({
  enabled: false,
  showPinyin: true,
  pauseOnClick: true,
  fontScale: 1,
  opacity: 0.86,
  verticalOffset: 12,
});

export function normalizeSettings(input = {}) {
  return {
    enabled: Boolean(input.enabled ?? DEFAULT_SETTINGS.enabled),
    showPinyin: Boolean(input.showPinyin ?? DEFAULT_SETTINGS.showPinyin),
    pauseOnClick: Boolean(input.pauseOnClick ?? DEFAULT_SETTINGS.pauseOnClick),
    fontScale: clampNumber(input.fontScale, 0.75, 1.5, DEFAULT_SETTINGS.fontScale),
    opacity: clampNumber(input.opacity, 0.45, 1, DEFAULT_SETTINGS.opacity),
    verticalOffset: clampNumber(
      input.verticalOffset,
      0,
      35,
      DEFAULT_SETTINGS.verticalOffset,
    ),
  };
}

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

export async function readSettings() {
  if (!globalThis.chrome?.storage?.local) return normalizeSettings();
  const stored = await chrome.storage.local.get(DEFAULT_SETTINGS);
  return normalizeSettings(stored);
}

export async function writeSettings(patch) {
  const current = await readSettings();
  const next = normalizeSettings({ ...current, ...patch });
  if (globalThis.chrome?.storage?.local) await chrome.storage.local.set(next);
  return next;
}
