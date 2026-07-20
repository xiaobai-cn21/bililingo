import test from "node:test";
import assert from "node:assert/strict";
import { segmentWithDictionary } from "../src/shared/segmentation.js";

const WORDS = new Set([
  "喜欢",
  "学习",
  "中文",
  "你们",
  "为什么",
  "看起来",
  "中华人民共和国",
]);

test("uses longest dictionary matches for Chinese words", () => {
  assert.deepEqual(
    segmentWithDictionary("我喜欢学习中文", (word) => WORDS.has(word)),
    ["我", "喜欢", "学习", "中文"],
  );
  assert.deepEqual(
    segmentWithDictionary("你们为什么喜欢", (word) => WORDS.has(word)),
    ["你们", "为什么", "喜欢"],
  );
});

test("prefers the longest entry and preserves mixed text", () => {
  assert.deepEqual(
    segmentWithDictionary("中华人民共和国 2026!", (word) => WORDS.has(word)),
    ["中华人民共和国", " ", "2026", "!"],
  );
});

test("falls back to individual Han characters when no word matches", () => {
  assert.deepEqual(
    segmentWithDictionary("甲乙", () => false),
    ["甲", "乙"],
  );
  assert.deepEqual(
    segmentWithDictionary("", () => true),
    [],
  );
});
