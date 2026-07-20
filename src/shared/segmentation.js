const HAN_CHARACTER = /^\p{Script=Han}$/u;
const DEFAULT_MAX_WORD_LENGTH = 12;

/**
 * Segments Han text with longest dictionary matching while preserving non-Han
 * text through the platform word segmenter.
 *
 * @param {string} text
 * @param {(word: string) => boolean} hasWord
 * @param {{ locale?: string, maxWordLength?: number }} [options]
 * @returns {string[]}
 */
export function segmentWithDictionary(text, hasWord, options = {}) {
  const normalized = String(text ?? "")
    .normalize("NFC")
    .trim();
  if (!normalized) return [];

  const locale = options.locale ?? "zh-CN";
  const maxWordLength = Math.max(
    2,
    options.maxWordLength ?? DEFAULT_MAX_WORD_LENGTH,
  );
  const characters = [...normalized];
  const segments = [];
  let index = 0;

  while (index < characters.length) {
    if (!HAN_CHARACTER.test(characters[index])) {
      const start = index;
      while (
        index < characters.length &&
        !HAN_CHARACTER.test(characters[index])
      )
        index += 1;
      segments.push(
        ...segmentWithoutDictionary(
          characters.slice(start, index).join(""),
          locale,
        ),
      );
      continue;
    }

    let runEnd = index;
    while (runEnd < characters.length && HAN_CHARACTER.test(characters[runEnd]))
      runEnd += 1;

    while (index < runEnd) {
      const available = Math.min(maxWordLength, runEnd - index);
      let matchedLength = 1;
      for (let length = available; length >= 2; length -= 1) {
        if (hasWord(characters.slice(index, index + length).join(""))) {
          matchedLength = length;
          break;
        }
      }
      segments.push(characters.slice(index, index + matchedLength).join(""));
      index += matchedLength;
    }
  }

  return segments;
}

/**
 * @param {string} text
 * @param {string} locale
 * @returns {string[]}
 */
function segmentWithoutDictionary(text, locale) {
  if (!text) return [];
  if (typeof Intl.Segmenter === "function") {
    const segmenter = new Intl.Segmenter(locale, { granularity: "word" });
    return [...segmenter.segment(text)].map(({ segment }) => segment);
  }
  return [...text];
}
