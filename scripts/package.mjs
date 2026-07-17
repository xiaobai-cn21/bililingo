import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { deflateRawSync } from "node:zlib";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");
const release = resolve(root, "release");
const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
const files = await walk(dist);
const localParts = [];
const centralParts = [];
let offset = 0;

for (const path of files) {
  const name = relative(dist, path).replaceAll("\\", "/");
  const nameBuffer = Buffer.from(name);
  const data = await readFile(path);
  const compressed = deflateRawSync(data, { level: 9 });
  const crc = crc32(data);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0x0800, 6);
  local.writeUInt16LE(8, 8);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(compressed.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(nameBuffer.length, 26);
  localParts.push(local, nameBuffer, compressed);

  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(0x0800, 8);
  central.writeUInt16LE(8, 10);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(compressed.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(nameBuffer.length, 28);
  central.writeUInt32LE(offset, 42);
  centralParts.push(central, nameBuffer);
  offset += local.length + nameBuffer.length + compressed.length;
}

const centralDirectory = Buffer.concat(centralParts);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(files.length, 8);
end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(centralDirectory.length, 12);
end.writeUInt32LE(offset, 16);
await mkdir(release, { recursive: true });
const output = resolve(release, `bilingo-${packageJson.version}.zip`);
await writeFile(output, Buffer.concat([...localParts, centralDirectory, end]));
console.log(`Packaged ${files.length} files in ${output}`);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = await Promise.all(entries.map((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  }));
  return paths.flat().sort();
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}
