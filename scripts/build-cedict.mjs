import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createHash } from "node:crypto";

const root = resolve(import.meta.dirname, "..");
const input = resolve(root, "data", "cedict", "cedict_ts.u8");
const output = resolve(root, "src", "content", "cedict-data.js");

const source = await readFile(input, "utf8");
if (
  !source.includes("Creative Commons Attribution-ShareAlike 4.0 International")
) {
  throw new Error(
    "CC-CEDICT source is missing the expected CC BY-SA 4.0 license header",
  );
}
const sourceHash = createHash("sha256").update(source).digest("hex");
const entries = new Map();

for (const line of source.split(/\r?\n/u)) {
  if (!line || line.startsWith("#")) continue;

  const match = line.match(/^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+\/(.+)\/$/u);
  if (!match) continue;

  const [, traditional, simplified, numberedPinyin, definitionText] = match;
  const definitions = definitionText
    .split("/")
    .map((definition) => definition.trim())
    .filter(Boolean)
    .slice(0, 5);
  if (!definitions.length) continue;

  addEntry(simplified, numberedPinyin, definitions);
  if (traditional !== simplified)
    addEntry(traditional, numberedPinyin, definitions);
}

const sorted = Object.fromEntries(
  [...entries.entries()].sort(([a], [b]) => a.localeCompare(b, "zh-Hans")),
);
if (entries.size < 150_000) {
  throw new Error(`CC-CEDICT parse produced too few entries: ${entries.size}`);
}
const body =
  `// SPDX-License-Identifier: CC-BY-SA-4.0\n` +
  `// Generated from CC-CEDICT. Do not edit by hand.\n` +
  `// Source: https://www.mdbg.net/chinese/dictionary?page=cc-cedict\n` +
  `// Source SHA-256: ${sourceHash}\n` +
  `// License: Creative Commons Attribution-ShareAlike 4.0 International.\n` +
  `export const CEDICT = Object.freeze(${JSON.stringify(sorted)});\n`;

await mkdir(dirname(output), { recursive: true });
await writeFile(output, body);

console.log(`Wrote ${entries.size} CC-CEDICT entries to ${output}`);

function addEntry(surface, pinyin, definitions) {
  const existing = entries.get(surface);
  if (existing && existing[1].length <= definitions.join("; ").length) return;
  entries.set(surface, [pinyin, definitions.join("; ")]);
}
