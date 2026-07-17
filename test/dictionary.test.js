import test from "node:test";
import assert from "node:assert/strict";
import { lookupWord } from "../src/content/dictionary.js";

test("looks up common words from CC-CEDICT", () => {
  const entry = lookupWord("喜欢");
  assert.equal(entry.source, "CC-CEDICT");
  assert.match(entry.meaning, /like|fond/i);
});

test("falls back when a word is unavailable", () => {
  const entry = lookupWord("不存在的测试词");
  assert.equal(entry.source, "Local lookup");
});
