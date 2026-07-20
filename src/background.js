import { CEDICT } from "./content/cedict-data.js";
import { MESSAGE_TYPES } from "./shared/protocol.js";
import { segmentWithDictionary } from "./shared/segmentation.js";

const MAX_CAPTION_LENGTH = 240;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message !== "object") return false;

  if (message.type === MESSAGE_TYPES.analyzeCaption) {
    const text = String(message.text ?? "").slice(0, MAX_CAPTION_LENGTH);
    sendResponse({
      segments: segmentWithDictionary(text, (word) =>
        Object.hasOwn(CEDICT, word),
      ),
    });
    return false;
  }

  if (message.type === MESSAGE_TYPES.lookupWord) {
    sendResponse(lookupCedictEntry(message.surface));
    return false;
  }

  return false;
});

/**
 * @param {unknown} surface
 */
function lookupCedictEntry(surface) {
  const normalized = String(surface ?? "").trim();
  const entry = CEDICT[normalized];
  if (!entry) return null;
  return {
    meaning: entry[1],
    partOfSpeech: "",
    source: "CC-CEDICT",
  };
}
