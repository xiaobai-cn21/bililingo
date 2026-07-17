import { CEDICT } from "./cedict-data.js";

// Original concise starter definitions kept as a small fallback for custom
// product wording and tests.
const DEFINITIONS = Object.freeze({
  我: ["I; me", "pronoun"],
  你: ["you", "pronoun"],
  他: ["he; him", "pronoun"],
  她: ["she; her", "pronoun"],
  我们: ["we; us", "pronoun"],
  你们: ["you (plural)", "pronoun"],
  是: ["to be; yes", "verb"],
  不是: ["to not be; no", "phrase"],
  有: ["to have; there is", "verb"],
  没有: ["to not have; there is not", "verb"],
  在: ["to be at; in; on", "verb/preposition"],
  的: ["possessive or descriptive particle", "particle"],
  了: ["completed-action or change-of-state particle", "particle"],
  吗: ["yes/no question particle", "particle"],
  不: ["not; no", "adverb"],
  没: ["not have; did not", "adverb"],
  这: ["this", "pronoun"],
  那: ["that", "pronoun"],
  什么: ["what", "pronoun"],
  怎么: ["how; why", "pronoun"],
  为什么: ["why", "phrase"],
  人: ["person; people", "noun"],
  中国: ["China", "proper noun"],
  中文: ["Chinese language", "noun"],
  学习: ["to study; to learn", "verb"],
  喜欢: ["to like", "verb"],
  想: ["to think; to want", "verb"],
  要: ["to want; need; will", "verb"],
  看: ["to look; to watch; to read", "verb"],
  听: ["to listen", "verb"],
  说: ["to speak; to say", "verb"],
  知道: ["to know", "verb"],
  可以: ["can; may", "auxiliary verb"],
  会: ["can; know how to; will", "auxiliary verb"],
  好: ["good; well", "adjective"],
  很: ["very", "adverb"],
  但是: ["but; however", "conjunction"],
  因为: ["because", "conjunction"],
  所以: ["therefore; so", "conjunction"],
  今天: ["today", "noun"],
  现在: ["now; at present", "noun"],
  谢谢: ["thank you", "expression"],
});

export const DICTIONARY_METADATA = Object.freeze({
  name: "CC-CEDICT",
  productionReady: true,
  license: "Creative Commons Attribution-ShareAlike 4.0 International",
});

export function lookupWord(surface) {
  const normalized = String(surface ?? "").trim();
  const cedictEntry = CEDICT[normalized];
  if (cedictEntry) {
    return {
      meaning: cedictEntry[1],
      partOfSpeech: "",
      source: DICTIONARY_METADATA.name,
    };
  }

  const entry = DEFINITIONS[normalized];
  if (entry) return { meaning: entry[0], partOfSpeech: entry[1], source: "Bilingo starter lexicon" };

  return {
    meaning: "Definition unavailable in the local dictionary.",
    partOfSpeech: "",
    source: "Local lookup",
  };
}
