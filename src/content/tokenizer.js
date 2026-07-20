import { pinyin } from "pinyin-pro";
import { MESSAGE_TYPES } from "../shared/protocol.js";

const HAN = /[\p{Script=Han}]/u;
const PUNCTUATION = /^[\p{P}\p{S}\s]+$/u;

export function tokenizeChinese(text, locale = "zh-CN") {
  const normalized = String(text ?? "")
    .normalize("NFC")
    .trim();
  if (!normalized) return [];

  const segments = segment(normalized, locale);
  return tokensFromSegments(segments);
}

export async function tokenizeChineseWithDictionary(text, locale = "zh-CN") {
  const normalized = String(text ?? "")
    .normalize("NFC")
    .trim();
  if (!normalized) return [];

  if (globalThis.chrome?.runtime?.sendMessage) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.analyzeCaption,
        text: normalized,
      });
      if (
        Array.isArray(response?.segments) &&
        response.segments.every((value) => typeof value === "string")
      ) {
        return tokensFromSegments(response.segments);
      }
    } catch {
      // Fall through to the browser segmenter when the worker is unavailable.
    }
  }

  return tokenizeChinese(normalized, locale);
}

export function tokensFromSegments(segments) {
  return segments.map((surface, index) => ({
    id: `token-${index}`,
    surface,
    normalized: surface,
    selectable: !PUNCTUATION.test(surface),
    pinyin: HAN.test(surface)
      ? pinyin(surface, { toneType: "symbol", type: "array", v: true }).join(
          " ",
        )
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
