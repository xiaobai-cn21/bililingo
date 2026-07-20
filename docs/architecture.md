# Architecture

## Runtime

1. `src/content/app.js` attaches one overlay to the active Bilibili player.
2. `src/content/caption-source.js` reads only visible native caption DOM.
3. `src/content/tokenizer.js` requests dictionary segmentation from the
   extension service worker and generates pinyin locally.
4. `src/background.js` performs longest CC-CEDICT matching and word lookup.
5. `src/content/overlay.js` renders tokens and definition cards in a closed
   shadow root.
6. `src/shared/settings.js` persists normalized preferences in
   `chrome.storage.local`.

If the service worker is unavailable, tokenization falls back to
`Intl.Segmenter` and common definitions fall back to a small local lexicon.

## Boundaries

- Platform-specific DOM selectors belong in `caption-source.js`.
- Dictionary algorithms live in `shared/segmentation.js`; dictionary data is
  generated and must not be hand-edited.
- Content/background messages are named in `shared/protocol.js`.
- Popup and options pages share settings but do not access captions.
- No remote code, subtitle upload or backend service is used.

## Extending platforms

New video platforms should provide a caption/player adapter with the same
responsibilities as `caption-source.js`. Avoid adding platform conditionals to
the tokenizer, dictionary or overlay.

## Performance budgets

The build fails if the page content script exceeds 500 KB or the dictionary
service worker exceeds 20 MB. Generated dictionary code is excluded from test
coverage because static data would otherwise inflate the result.

## Testing

- `test/`: pure logic, Chrome API and DOM behavior.
- `e2e/`: packaged extension behavior in Chromium.
- `scripts/check.mjs`: manifest, permission and file-reference invariants.
- `scripts/release-check.mjs`: external launch approvals.
