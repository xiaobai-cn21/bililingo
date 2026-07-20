# Dictionary provenance and regeneration

## Snapshot

- Dataset: CC-CEDICT
- Publisher: MDBG
- Source page: https://www.mdbg.net/chinese/dictionary?page=cc-cedict
- License: CC BY-SA 4.0
- Source filename: `cedict_ts.u8`
- Source SHA-256:
  `1eff4f3e4f367e0c63465a14713bef2d1a71f31ded4f6e5b0dac9f4d3c511207`
- Generated entries: 197,558 simplified and traditional headwords

The upstream file did not contain a release date in its header. The hash is the
authoritative snapshot identifier used by this repository.

## Regeneration

1. Download `cedict_1_0_ts_utf-8_mdbg.zip` from the source page.
2. Extract `cedict_ts.u8` to `data/cedict/`.
3. Verify its SHA-256 against the value above, or intentionally document a new
   snapshot and review its license.
4. Run `npm run build:cedict`.
5. Run `npm run test:all` and inspect dictionary-related changes.

The generator includes simplified and traditional forms, keeps up to five
definitions, and chooses one representation for duplicate headwords. The
generated dataset remains under CC BY-SA 4.0.
