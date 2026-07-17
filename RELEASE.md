# Release process

`npm run package:beta` builds an unpacked extension and a ZIP for internal testing. It does not certify a public release.

Public releases must use `npm run release`. This command runs checks, tests and the build, then refuses to package unless all external launch gates are recorded in `release-approval.json` and the starter dictionary has been replaced by an approved production dataset.

1. Replace the starter dictionary and set `DICTIONARY_METADATA.productionReady` only after its license and attribution have been reviewed.
2. Publish final privacy, terms and support pages over HTTPS.
3. Copy `release-approval.example.json` to `release-approval.json`, record real approvals and keep the approval record in the controlled release system. The local file is intentionally ignored by Git.
4. Run Chrome end-to-end and manual regression testing from the PRD matrix.
5. Run `npm run release` and upload the generated ZIP from `release/` to the Chrome Web Store.

Never keep a Chrome signing private key in this repository. Store signing and account credentials in the controlled release system.
