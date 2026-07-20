# Contributing

Thank you for helping improve Bilingo.

## Setup

Use Node.js 20.19 or newer.

```bash
npm ci
npx playwright install chromium
npm run test:all
```

Load `dist/` through `chrome://extensions` for manual testing.

## Changes

- Keep permissions narrow and caption processing local.
- Put Bilibili DOM compatibility changes in `src/content/caption-source.js`.
- Add focused tests for behavior changes.
- Do not commit raw dictionary downloads, release ZIPs, browser profiles,
  credentials or extension signing keys.
- Update privacy and third-party notices when data handling or dependencies
  change.
- Run `npm run format` and `npm run test:all` before opening a pull request.
- Run `npm run test:e2e` for player, popup, settings or manifest changes.

`npm install` configures a local pre-commit hook. It runs ESLint fixes and
Prettier only on staged files. The recommended VS Code extensions also format
and apply explicit ESLint fixes on save.

## Pull requests

Keep pull requests focused. Explain the user-facing result, how it was tested,
and any privacy, permission or licensing impact. UI changes should include
before/after screenshots.

By submitting a contribution, you agree that it is licensed under the MIT License.
Do not submit material that you do not have the right to contribute. Dictionary
data remains governed by the license described in `THIRD_PARTY_NOTICES.md`.
