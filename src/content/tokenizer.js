import { pinyin } from "pinyin-pro";

const HAN = /[\p{Script=Han}]/u;
const PUNCTUATION = /^[\p{P}\p{S}\s]+$/u;

export function tokenizeChinese(text, locale = "zh-CN") {
  const normalized = String(text ?? "").normalize("NFC").trim();
  if (!normalized) return [];

  const segments = segment(normalized, locale);
  return segments.map((surface, index) => ({
    id: `token-${index}`,
    surface,
    normalized: surface,
    selectable: !PUNCTUATION.test(surface),
    pinyin: HAN.test(surface)
      ? pinyin(surface, { toneType: "symbol", type: "array", v: true }).join(" ")
      : "",
  }));
}

function segment(text, locale) {
  if (typeof Intl?.Segmenter === "function") {
    const segmenter = new Intl.Segmenter(locale, { granularity: "word" });
    return [...segmenter.segment(text)].map(({ segment: value }) => value);
  }
  return [...text];
}

export function activeTokenIndex(tokens, progress) {
  if (!tokens.length) return -1;
  const eligible = tokens
    .map((token, index) => ({ token, index }))
    .filter(({ token }) => token.selectable);
  if (!eligible.length) return -1;
  const safeProgress = Math.min(0.999999, Math.max(0, Number(progress) || 0));
  return eligible[Math.floor(safeProgress * eligible.length)].index;
}
