import test from "node:test";
import assert from "node:assert/strict";
import { tokenizeChinese } from "../src/content/tokenizer.js";

test("tokenizes Chinese and generates tone-marked pinyin", () => {
  const tokens = tokenizeChinese("但是我没有卡");
  assert.ok(tokens.length >= 4);
  assert.equal(tokens.map(({ surface }) => surface).join(""), "但是我没有卡");
  assert.match(tokens.map(({ pinyin }) => pinyin).join(" "), /dàn/);
  assert.match(tokens.map(({ pinyin }) => pinyin).join(" "), /wǒ/);
});

test("keeps punctuation non-selectable", () => {
  const tokens = tokenizeChinese("你好，世界！");
  const punctuation = tokens.filter(({ surface }) => /[，！]/u.test(surface));
  assert.ok(punctuation.length >= 1);
  assert.ok(punctuation.every(({ selectable }) => selectable === false));
});

test("handles empty captions", () => {
  assert.deepEqual(tokenizeChinese("   "), []);
});
