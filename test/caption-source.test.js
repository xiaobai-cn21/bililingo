import test from "node:test";
import assert from "node:assert/strict";
import {
  findPlayer,
  findVideo,
  normalizeCaption,
  readNativeCaption,
} from "../src/content/caption-source.js";
import { installDom } from "../test-support/dom.js";

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

test("finds the player and reads a visible native caption", (t) => {
  installDom(
    t,
    `<!doctype html><body>
      <div class="bpx-player-container">
        <video></video>
        <div class="bpx-player-subtitle-text">字幕：我喜欢中文</div>
      </div>
    </body>`,
  );
  const video = document.querySelector("video");
  Object.defineProperty(video, "readyState", { configurable: true, value: 4 });
  const caption = document.querySelector(".bpx-player-subtitle-text");
  caption.getBoundingClientRect = () => ({ width: 200, height: 30 });

  assert.equal(findVideo(), video);
  assert.equal(
    findPlayer(video),
    document.querySelector(".bpx-player-container"),
  );
  assert.equal(readNativeCaption(document), "我喜欢中文");
});
