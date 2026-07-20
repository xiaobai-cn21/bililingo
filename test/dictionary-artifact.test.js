import test from "node:test";
import assert from "node:assert/strict";
import { open, stat } from "node:fs/promises";

test("generated dictionary records its license and pinned source hash", async () => {
  const url = new URL("../src/content/cedict-data.js", import.meta.url);
  const handle = await open(url, "r");
  try {
    const buffer = Buffer.alloc(512);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    const header = buffer.subarray(0, bytesRead).toString("utf8");
    assert.match(header, /SPDX-License-Identifier: CC-BY-SA-4\.0/u);
    assert.match(
      header,
      /1eff4f3e4f367e0c63465a14713bef2d1a71f31ded4f6e5b0dac9f4d3c511207/u,
    );
  } finally {
    await handle.close();
  }
  assert.ok((await stat(url)).size > 10_000_000);
});
