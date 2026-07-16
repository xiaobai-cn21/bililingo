import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const manifest = JSON.parse(await readFile(resolve(root, "src/manifest.json"), "utf8"));
const errors = [];

if (manifest.manifest_version !== 3) errors.push("manifest_version must be 3");
if (manifest.permissions?.some((permission) => ["cookies", "webRequest", "tabs", "history"].includes(permission))) {
  errors.push("manifest contains a prohibited broad/sensitive permission");
}
if (manifest.host_permissions?.length) errors.push("MVP must not declare host_permissions");
if (manifest.content_scripts?.some(({ matches }) => matches.some((match) => match.includes("<all_urls>")))) {
  errors.push("content scripts must not use <all_urls>");
}

const referencedFiles = [
  manifest.action.default_popup,
  manifest.options_ui.page,
  ...manifest.content_scripts.flatMap(({ js = [], css = [] }) => [...js, ...css]),
];
for (const file of referencedFiles) {
  const sourceFile = file === "content.js" ? "content/app.js" : file;
  try {
    await access(resolve(root, "src", sourceFile));
  } catch {
    errors.push(`manifest references missing source: ${file}`);
  }
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log("Manifest and permission checks passed");
}
