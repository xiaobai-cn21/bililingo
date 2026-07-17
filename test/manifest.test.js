import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("manifest keeps the production permission boundary narrow", async () => {
  const manifest = JSON.parse(await readFile(new URL("../src/manifest.json", import.meta.url)));
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.permissions, ["storage"]);
  assert.equal(manifest.host_permissions, undefined);
  assert.deepEqual(manifest.content_scripts[0].matches, ["https://www.bilibili.com/video/*"]);
  assert.equal(manifest.content_security_policy.extension_pages, "script-src 'self'; object-src 'self'");
});
