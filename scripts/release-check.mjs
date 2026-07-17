import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { DICTIONARY_METADATA } from "../src/content/dictionary.js";

const root = resolve(import.meta.dirname, "..");
const errors = [];
let approval = {};
try {
  approval = JSON.parse(await readFile(resolve(root, "release-approval.json"), "utf8"));
} catch {
  errors.push("release-approval.json is missing or invalid; copy release-approval.example.json and record real approvals");
}

const requiredApprovals = [
  "legalApproved",
  "bilibiliDecisionDocumented",
  "dictionaryApproved",
  "securityApproved",
  "storeDisclosureReviewed",
  "supportReady",
  "rollbackTested",
];
for (const key of requiredApprovals) {
  if (approval[key] !== true) errors.push(`${key} must be explicitly true`);
}
for (const key of ["privacyPolicyUrl", "termsUrl", "supportUrl"]) {
  if (!/^https:\/\//u.test(String(approval[key] ?? ""))) errors.push(`${key} must be a public HTTPS URL`);
}
if (!DICTIONARY_METADATA.productionReady) {
  errors.push(`dictionary is not production-ready: ${DICTIONARY_METADATA.name}`);
}
if (!approval.approvedVersion) errors.push("approvedVersion is required");
const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
if (approval.approvedVersion && approval.approvedVersion !== packageJson.version) {
  errors.push(`approvedVersion must equal package version ${packageJson.version}`);
}

if (errors.length) {
  console.error(`Release blocked:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(`Release gates passed for ${packageJson.version}`);
}
