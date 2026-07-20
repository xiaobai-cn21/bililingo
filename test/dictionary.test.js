import test from "node:test";
import assert from "node:assert/strict";
import { lookupFallback, lookupWord } from "../src/content/dictionary.js";

test("looks up common words from the CC-CEDICT worker", async (t) => {
  const originalChrome = globalThis.chrome;
  t.after(() => {
    globalThis.chrome = originalChrome;
  });
  globalThis.chrome = {
    runtime: {
      sendMessage: async ({ surface }) => ({
        meaning: surface === "喜欢" ? "to like; to be fond of" : "",
        partOfSpeech: "",
        source: "CC-CEDICT",
      }),
    },
  };

  const entry = await lookupWord("喜欢");
  assert.equal(entry.source, "CC-CEDICT");
  assert.match(entry.meaning, /like|fond/i);
});

test("falls back when the dictionary worker is unavailable", async (t) => {
  const originalChrome = globalThis.chrome;
  t.after(() => {
    globalThis.chrome = originalChrome;
  });
  globalThis.chrome = {
    runtime: {
      sendMessage: async () => {
        throw new Error("worker stopped");
      },
    },
  };

  const entry = await lookupWord("不存在的测试词");
  assert.equal(entry.source, "Local lookup");
});

test("keeps a compact offline fallback for high-frequency words", () => {
  const entry = lookupFallback("喜欢");
  assert.equal(entry.source, "Bilingo offline fallback");
  assert.match(entry.meaning, /like/i);
});
