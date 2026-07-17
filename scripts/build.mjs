import { build } from "esbuild";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { deflateSync } from "node:zlib";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "src");
const output = resolve(root, "dist");

await rm(output, { recursive: true, force: true });
await mkdir(resolve(output, "icons"), { recursive: true });

await build({
  entryPoints: [
    { in: "src/content/app.js", out: "content" },
    { in: "src/popup.js", out: "popup" },
    { in: "src/options.js", out: "options" },
  ],
  absWorkingDir: root,
  bundle: true,
  outdir: output,
  format: "iife",
  target: "chrome120",
  minify: true,
  sourcemap: false,
  legalComments: "eof",
});

for (const file of ["manifest.json", "popup.html", "options.html", "about.html", "ui.css"]) {
  await cp(resolve(source, file), resolve(output, file));
}

for (const size of [16, 32, 48, 128]) {
  await writeFile(resolve(output, `icons/icon${size}.png`), makeIcon(size));
}

const manifest = JSON.parse(await readFile(resolve(output, "manifest.json"), "utf8"));
if (manifest.manifest_version !== 3) throw new Error("Build requires Manifest V3");
console.log(`Built ${manifest.name} ${manifest.version} in ${output}`);

function makeIcon(size) {
  const rows = [];
  for (let y = 0; y < size; y += 1) {
    const row = Buffer.alloc(1 + size * 4);
    for (let x = 0; x < size; x += 1) {
      const offset = 1 + x * 4;
      const radius = size * 0.22;
      const inside =
        x >= radius || y >= radius || (x - radius) ** 2 + (y - radius) ** 2 <= radius ** 2;
      const gradient = (x + y) / (size * 2);
      row[offset] = inside ? Math.round(74 + 180 * gradient) : 0;
      row[offset + 1] = inside ? Math.round(222 - 55 * gradient) : 0;
      row[offset + 2] = inside ? Math.round(238 - 160 * gradient) : 0;
      row[offset + 3] = inside ? 255 : 0;
      const isB =
        x > size * 0.3 && x < size * 0.42 && y > size * 0.2 && y < size * 0.8 ||
        x >= size * 0.4 && x < size * 0.67 &&
          ((y > size * 0.2 && y < size * 0.31) ||
            (y > size * 0.44 && y < size * 0.55) ||
            (y > size * 0.69 && y < size * 0.8)) ||
        x > size * 0.62 && x < size * 0.72 &&
          ((y >= size * 0.28 && y <= size * 0.47) || (y >= size * 0.53 && y <= size * 0.72));
      if (isB && inside) {
        row[offset] = 8;
        row[offset + 1] = 20;
        row[offset + 2] = 34;
      }
    }
    rows.push(row);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(Buffer.concat(rows))),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])) >>> 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}
