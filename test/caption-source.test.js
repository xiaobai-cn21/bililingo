import test from "node:test";
import assert from "node:assert/strict";
import { normalizeCaption } from "../src/content/caption-source.js";

test("normalizes caption whitespace", () => {
  assert.equal(normalizeCaption("  但是\n我  没有卡 "), "但是 我 没有卡");
});

test("removes a caption label without changing content", () => {
  assert.equal(normalizeCaption("字幕：你好世界"), "你好世界");
  assert.equal(normalizeCaption("CC: Hello"), "Hello");
});

test("normalizes Unicode and null values safely", () => {
  assert.equal(normalizeCaption(null), "");
  assert.equal(normalizeCaption("n\u030c"), "n\u030c");
});
