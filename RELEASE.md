# Release process

`npm run package:beta` builds an unpacked extension and ZIP for internal testing.
It does not certify a public release.

Public releases use `npm run release`. That command runs code quality checks,
coverage, production build, Chromium extension testing and external approval
gates before creating the ZIP in `release/`.

## External gates

1. Review CC-CEDICT attribution and CC BY-SA 4.0 compliance for the intended
   distribution.
2. Publish final privacy, terms and support pages over HTTPS.
3. Record the product owner/legal identity and support contact.
4. Document the Bilibili platform/trademark decision.
5. Complete security review and Chrome Web Store disclosure review.
6. Run manual player regression testing, including subtitles off/on, seeking,
   fullscreen, SPA navigation and videos without captions.
7. Test rollback to the previous store version.
8. Copy `release-approval.example.json` to `release-approval.json`, record real
   approvals and keep the approval record in the controlled release system.
   The local file is intentionally ignored by Git.
9. Run `npm run release` and upload the generated ZIP.

The approval script rejects missing URLs, false approvals and a version that
does not match `package.json`. These gates must represent real decisions; never
set them to `true` only to make the command pass.

Never keep a Chrome signing private key, store credentials or test-account
secrets in this repository.
