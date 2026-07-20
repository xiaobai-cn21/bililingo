# Third-party notices

## CC-CEDICT

The generated dictionary dataset in `src/content/cedict-data.js` is derived from
CC-CEDICT, a community-maintained Chinese-English dictionary published by MDBG.

- Source: https://www.mdbg.net/chinese/dictionary?page=cc-cedict
- Project information: https://cc-cedict.org/wiki/
- License: Creative Commons Attribution-ShareAlike 4.0 International
- License text: https://creativecommons.org/licenses/by-sa/4.0/legalcode.en
- Local source SHA-256: `1eff4f3e4f367e0c63465a14713bef2d1a71f31ded4f6e5b0dac9f4d3c511207`

The build script converts the source text to a JavaScript lookup object, keeps up
to five definitions per entry, includes both simplified and traditional forms,
and selects one entry when duplicate headwords occur. These are format and
selection changes. The generated dataset remains available under CC BY-SA 4.0.
No endorsement by MDBG or CC-CEDICT is implied.

## pinyin-pro

`pinyin-pro` is distributed under the MIT License:
https://github.com/zh-lx/pinyin-pro

## esbuild

`esbuild` is distributed under the MIT License:
https://github.com/evanw/esbuild

Development-only dependencies and their transitive license metadata are recorded
in `package-lock.json` and their installed package manifests.
