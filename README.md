# Bilingo for Bilibili

A local-first Manifest V3 Chrome extension that turns visible Bilibili captions
into interactive Mandarin learning captions with word boundaries, pinyin and
Chinese-English definitions.

Bilingo is an independent open-source project and is not affiliated with or
endorsed by Bilibili.

## Features

- Runs only on `https://www.bilibili.com/video/*`.
- Reads caption text already rendered by the active Bilibili player.
- Uses CC-CEDICT longest matching so words such as `喜欢` and `为什么` remain
  selectable units.
- Generates tone-marked pinyin locally with `pinyin-pro`.
- Displays a draggable caption overlay and local definition cards.
- Stores display preferences in Chrome local storage.
- Has no backend, analytics, cookie access, video download or broad host access.
- Loads the large dictionary in the extension service worker instead of adding
  it to every Bilibili page.

## Development

Requires Node.js 20.19 or newer.

```bash
npm ci
npm run test:all
```

Useful commands:

```bash
npm run lint          # JavaScript lint checks
npm run lint:fix      # safe ESLint fixes
npm run format        # format supported files
npm run typecheck     # JavaScript type checking through TypeScript
npm run test:coverage # unit/DOM tests with enforced coverage
npm run test:e2e      # build and run the Chromium extension test
```

Install the Playwright browser once before running end-to-end tests locally:

```bash
npx playwright install chromium
```

The unpacked extension is built to `dist/`.

## Install in Chrome

1. Run `npm run build`.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Select **Load unpacked** and choose `dist/`.
5. Open a Bilibili video, enable its native subtitles, then enable Bilingo.

## Dictionary

The repository includes a generated CC-CEDICT snapshot under CC BY-SA 4.0.
Raw downloaded source files are intentionally ignored. To regenerate the
dictionary, place `cedict_ts.u8` in `data/cedict/` and run:

```bash
npm run build:cedict
```

See [Dictionary provenance](docs/dictionary.md) and
[Third-party notices](THIRD_PARTY_NOTICES.md).

## Architecture

Caption access, dictionary segmentation, pinyin, UI and settings are separate
modules. The dictionary runs in a Manifest V3 service worker and communicates
with the content script through narrow message types. See
[Architecture](docs/architecture.md).

## Quality and security

Every pull request runs manifest checks, ESLint, formatting verification,
JavaScript type checking, unit/DOM tests, coverage thresholds, a production
build and dependency audit. Run the Chromium extension test manually before a
release with `npm run test:e2e`.

Husky and lint-staged check changed files before each commit. Recommended VS Code
settings format files and apply ESLint fixes on save.

Please read [Contributing](CONTRIBUTING.md) and report vulnerabilities according
to [Security](SECURITY.md).

## Known limitations

- Videos without visible native captions cannot be enhanced.
- Bilibili may change its player DOM; selectors are isolated in
  `src/content/caption-source.js`.
- Captions normally lack word-level timestamps, so Bilingo cannot highlight the
  currently spoken word precisely.
- Dictionary longest matching is deterministic but cannot resolve every
  context-dependent Chinese segmentation ambiguity.

## Privacy and releases

Caption parsing, pinyin and dictionary lookup stay inside the extension. See
[Privacy](PRIVACY.md).

Internal packages can be created with `npm run package:beta`. Public releases
must use `npm run release`, which also requires explicit legal, privacy,
security, support, platform and rollback approvals. See [Release process](RELEASE.md).

## License

Software code is licensed under the MIT License. The generated CC-CEDICT dataset is
licensed separately under CC BY-SA 4.0. See [LICENSE](LICENSE),
[NOTICE](NOTICE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
