import test from "node:test";
import assert from "node:assert/strict";
import {
  tokenizeChinese,
  tokenizeChineseWithDictionary,
  tokensFromSegments,
} from "../src/content/tokenizer.js";

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

test("uses dictionary segments returned by the extension worker", async (t) => {
  const originalChrome = globalThis.chrome;
  t.after(() => {
    globalThis.chrome = originalChrome;
  });
  globalThis.chrome = {
    runtime: {
      sendMessage: async () => ({ segments: ["我", "喜欢", "中文"] }),
    },
  };

  const tokens = await tokenizeChineseWithDictionary("我喜欢中文");
  assert.deepEqual(
    tokens.map(({ surface }) => surface),
    ["我", "喜欢", "中文"],
  );
  assert.match(tokens[1].pinyin, /xǐ huan/u);
});

test("falls back when worker segmentation is invalid", async (t) => {
  const originalChrome = globalThis.chrome;
  t.after(() => {
    globalThis.chrome = originalChrome;
  });
  globalThis.chrome = {
    runtime: { sendMessage: async () => ({ segments: [1] }) },
  };

  const tokens = await tokenizeChineseWithDictionary("喜欢");
  assert.equal(tokens.map(({ surface }) => surface).join(""), "喜欢");
  assert.deepEqual(tokensFromSegments([]), []);
});
