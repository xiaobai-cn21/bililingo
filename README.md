# Bilingo for Bilibili

A local-first Manifest V3 Chrome extension that adds interactive pinyin learning captions to Bilibili videos.

## Current MVP

- Activates only on `https://www.bilibili.com/video/*`.
- Reads caption text already rendered by the active Bilibili player.
- Generates contextual token boundaries with `Intl.Segmenter` and tone-marked pinyin with `pinyin-pro`.
- Displays a draggable, responsive caption overlay.
- Estimates active-token highlighting when source captions do not expose word timing.
- Opens a local vocabulary card for selected tokens.
- Stores display preferences in Chrome local storage.
- Does not request cookie, network interception, browsing history, or broad host permissions.

## Development

Requires Node.js 20 or newer.

```bash
npm install
npm run test:all
```

The unpacked extension is built to `dist/`.

## Install in Chrome

1. Run `npm run build`.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Select **Load unpacked** and choose this project's `dist/` directory.
5. Open a Bilibili video, enable Bilibili's native subtitles, then select **Enable learning captions** in the player or extension popup.

## Known limitations

- The MVP depends on captions visibly rendered by Bilibili. Videos without native captions show no enhanced overlay.
- Bilibili may change its player DOM. Caption selectors are isolated in `src/content/caption-source.js` for compatibility updates.
- Word highlighting is estimated because visible caption text normally lacks word-level timestamps.
- The bundled starter lexicon is intentionally small. A licensed production dictionary must replace or expand it before public launch.
- This repository does not contain block-evasion, authentication extraction, video downloading, or background scraping.

## Privacy

Caption parsing and pinyin generation occur locally. The MVP has no backend or analytics and does not upload video URLs, subtitle text, or vocabulary selections. See [PRIVACY.md](PRIVACY.md).

## Product requirements

See [PRD-bilibili-language-overlay.md](PRD-bilibili-language-overlay.md). Public/commercial launch remains gated on the legal, security, licensing, and Bilibili authorization decisions defined there.
