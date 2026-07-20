import test from "node:test";
import assert from "node:assert/strict";
import { CaptionObserver } from "../src/content/caption-source.js";

test("clears a stale cue and allows identical text to appear again", () => {
  const values = ["你好", "", "", "你好"];
  const captions = [];
  const observer = new CaptionObserver({
    root: {},
    onCaption: (text) => captions.push(text),
    readCaption: () => values.shift() ?? "",
    clearAfterEmptyReads: 2,
  });

  observer.check();
  observer.check();
  observer.check();
  observer.check();

  assert.deepEqual(captions, ["你好", "", "你好"]);
});

test("reports no-caption state after the bounded wait", () => {
  let clock = 0;
  const states = [];
  const observer = new CaptionObserver({
    root: {},
    onCaption: () => {},
    onState: (state) => states.push(state),
    readCaption: () => "",
    now: () => clock,
    noCaptionTimeout: 5000,
  });
  observer.startedAt = clock;
  observer.check();
  clock = 5001;
  observer.check();
  clock = 6000;
  observer.check();

  assert.deepEqual(states, ["no-captions"]);
});

test("fails open when the caption adapter throws", () => {
  const states = [];
  const observer = new CaptionObserver({
    root: {},
    onCaption: () => assert.fail("must not emit a caption"),
    onState: (state) => states.push(state),
    readCaption: () => {
      throw new Error("player DOM changed");
    },
  });
  assert.doesNotThrow(() => observer.check());
  assert.deepEqual(states, ["temporarily-unavailable"]);
});

test("starts, refreshes and stops observation cleanly", (t) => {
  const originalDocument = globalThis.Document;
  const originalMutationObserver = globalThis.MutationObserver;
  const observed = [];
  t.after(() => {
    globalThis.Document = originalDocument;
    globalThis.MutationObserver = originalMutationObserver;
  });
  globalThis.Document = class {};
  globalThis.MutationObserver = class {
    constructor(callback) {
      this.callback = callback;
    }
    observe(root) {
      observed.push(root);
    }
    disconnect() {
      observed.push("disconnected");
    }
  };

  const states = [];
  const root = {};
  const observer = new CaptionObserver({
    root,
    onCaption: () => {},
    onState: (state) => states.push(state),
    readCaption: () => "",
    pollInterval: 10_000,
  });
  observer.start();
  observer.refresh();
  observer.stop();

  assert.equal(states[0], "waiting");
  assert.equal(observed[0], root);
  assert.equal(observed.at(-1), "disconnected");
});
