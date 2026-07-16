# Product Requirements Document: Bilibili Language Overlay

**Status:** Draft for product, engineering, design, legal, and security review  
**Target:** Google Chrome desktop, Manifest V3  
**Working name:** Bilingo for Bilibili  
**Version:** 1.0  
**Last updated:** 2026-07-15

## 1. Executive summary

Bilingo for Bilibili is a Chrome extension that turns captioned Bilibili videos into interactive Chinese-learning experiences. While a user watches a supported video, the extension displays a synchronized overlay inside the video player. The overlay shows Chinese subtitle tokens, pinyin above each token, playback-aware highlighting, and click-to-inspect vocabulary.

The product will reproduce the useful interaction demonstrated in the supplied reference image, but it must use original branding, visual assets, code, and copy. It is a functionally equivalent Bilibili-focused product, not a literal copy of LexiRise.

The product must be designed for platform compatibility and policy compliance. No product or technical design can guarantee that Bilibili will never block an unofficial integration. The durable strategy is to use the least invasive, user-initiated method available, process data locally where possible, avoid bulk or background collection, impose strict request limits, and seek written authorization or a commercial agreement with Bilibili before broad commercial launch.

## 2. Problem

Chinese learners can find compelling native content on Bilibili, but ordinary subtitles are not optimized for learning:

- pronunciation is not shown;
- word boundaries are unclear;
- subtitles cannot easily be explored without interrupting playback;
- learners cannot quickly connect a word, its pronunciation, meaning, and original context;
- browser-based study tools often require copying text into another application.

## 3. Product goal

Enable a learner to watch a supported Bilibili video and understand or save an unfamiliar subtitle token in no more than two interactions, without leaving the video page.

### 3.1 Success metrics

Pilot targets, measured only with consent and privacy-preserving telemetry:

- Overlay successfully initializes on at least 95% of supported, captioned Bilibili video pages.
- At least 98% of displayed caption cues remain within 250 ms of the source cue timing under normal playback.
- Pinyin generation succeeds for at least 99% of recognized Han-character tokens.
- Median extension-added scripting time is below 20 ms per subtitle change on a reference mid-range laptop.
- The overlay causes fewer than 0.5% player-interaction error sessions.
- At least 30% of activated weekly users inspect one or more words.
- Seven-day learner retention is at least 20% during private beta.
- Zero collection of Bilibili authentication cookies or credentials by company systems.
- Zero bulk subtitle harvesting jobs and zero requests made when the user is not on an eligible video page.

### 3.2 Non-goals for v1

- Downloading videos, audio, or complete subtitle files.
- Supporting Bilibili live streams, comments, danmaku, articles, comics, mobile apps, or other video platforms.
- Circumventing login, membership, geographic, copyright, rate, bot, signature, or access controls.
- Creating subtitles from protected media on company servers.
- Replacing Bilibili's player or hiding its advertising, branding, controls, or watermarks.
- Recreating LexiRise branding, trade dress, proprietary copy, icons, or source code.
- Social features, public word lists, teacher dashboards, payments, or enterprise administration.

## 4. Users and use cases

### Primary persona

An adult beginner-to-intermediate learner of Mandarin who watches Bilibili on desktop Chrome and needs pronunciation and vocabulary help while retaining the original viewing experience.

### Primary journey

1. The learner installs the extension and sees a plain-language permissions and privacy explanation.
2. The learner opens a Bilibili video page.
3. The extension detects an eligible player and shows a small, non-obstructive activation control.
4. The learner enables the learning overlay.
5. When a subtitle cue appears, the overlay renders segmented Chinese text with pinyin.
6. The currently spoken token is highlighted when token timing is available; otherwise the current cue is highlighted progressively using an explicitly labeled estimate.
7. The learner clicks a token. Playback optionally pauses and a compact definition card opens.
8. The learner closes the card or resumes playback.

## 5. User experience requirements

### 5.1 Player overlay

The overlay must:

- be anchored to the active Bilibili player rather than the browser viewport;
- work in standard, widescreen, theater, webpage-fullscreen, and native fullscreen modes where Chrome permits extension rendering;
- remain centered near the lower safe area and automatically avoid native player controls and existing subtitles;
- display pinyin above corresponding Chinese tokens;
- display Chinese characters in a high-contrast row below pinyin;
- emphasize the active token using color and/or an underline without relying on color alone;
- use a translucent dark background, rounded corners, and adjustable opacity;
- preserve a minimum 4.5:1 text contrast ratio where practical;
- never cover Bilibili branding or permanently obscure meaningful video content;
- be draggable vertically within a defined safe zone;
- offer text size, pinyin visibility, background opacity, and pause-on-click controls;
- restore the user's local preferences on subsequent videos.

Reference behavior from the supplied image:

- compact black caption container centered near the bottom;
- small neutral pinyin labels aligned above each Chinese token;
- large amber/yellow Chinese characters;
- a contrasting active-token indication;
- no separate application window required.

### 5.2 Vocabulary card

Clicking or keyboard-selecting a token opens an original, company-branded card containing:

- simplified and traditional forms when available;
- numbered and marked-tone pinyin;
- concise English meaning;
- part of speech when reliable;
- the complete current subtitle sentence;
- replay-current-cue control;
- close control and keyboard focus management.

Dictionary data must come from a properly licensed dataset or contracted API. Definitions must not be copied from an unlicensed commercial dictionary.

### 5.3 States and messages

The extension must distinguish:

- **Ready:** supported player and accessible caption track detected.
- **No captions:** no accessible caption track is available; do not repeatedly retry.
- **Login required:** source captions are available only to an authenticated Bilibili user; the extension must not collect credentials.
- **Unsupported content:** live, interactive, region-restricted, DRM-restricted, or otherwise unsupported media.
- **Temporarily unavailable:** source integration changed or failed; native playback remains unaffected.
- **Extension paused:** overlay disabled for this video or site.

Messages must not suggest bypassing a Bilibili restriction.

### 5.4 Accessibility and localization

- All controls must be keyboard accessible.
- Visible focus indicators are required.
- Screen-reader labels must describe controls without reading every changing subtitle automatically.
- Reduced-motion preference must be respected.
- UI launches in English and Simplified Chinese.
- Pinyin tone marks must use Unicode normalization and accessible text.

## 6. Functional requirements

### P0: required for MVP

| ID | Requirement | Acceptance criterion |
|---|---|---|
| F-01 | Detect supported Bilibili video pages and player replacement/navigation events | Works during direct navigation and Bilibili SPA navigation without a full reload |
| F-02 | Require a visible user activation before enabling the enhanced overlay | No subtitle processing or source request occurs before activation, except local eligibility detection |
| F-03 | Use an accessible caption track associated with the video currently playing | Displayed text matches the selected source track and current video part |
| F-04 | Synchronize cues with player time, seek, pause, playback-rate changes, episode/part changes, and replay | Correct cue is displayed within 250 ms for 98% of sampled transitions |
| F-05 | Segment Simplified or Traditional Chinese into learner-friendly tokens | Users can select individual tokens; punctuation is not exposed as a vocabulary word |
| F-06 | Generate tone-marked pinyin locally | Polyphonic uncertainty is handled by contextual segmentation; low-confidence readings can be marked |
| F-07 | Render responsive overlay in standard and fullscreen layouts | Overlay remains usable at 1280x720 through 4K and browser zoom 80%-200% |
| F-08 | Open a token definition card | Card opens within 150 ms when data is cached and within 800 ms at p95 when a remote licensed API is required |
| F-09 | Store preferences locally | Settings survive browser restart and can be reset |
| F-10 | Fail without affecting native playback | Disabling or crashing the overlay leaves player controls, subtitles, and video functional |
| F-11 | Provide an extension popup with on/off state and settings shortcut | Current-tab eligibility and activation state are clear |
| F-12 | Provide privacy notice, terms, third-party attribution, and support link | All are accessible before Chrome Web Store submission |

### P1: post-MVP

- Save vocabulary with the source sentence, video URL, and cue time after explicit user action.
- Local vocabulary review and export.
- Traditional/Simplified display conversion.
- Optional English translation using a licensed service with explicit disclosure.
- Hotkeys for prior/next cue, replay cue, and toggle pinyin.
- Per-token timing when legitimately available from a source track.

### P2: separately approved discovery

- On-device speech recognition for videos with no captions, subject to feasibility, model licensing, CPU/battery constraints, media rights review, and a separate consent flow.
- Company account synchronization, subject to a separate data-protection assessment.

## 7. Caption-source strategy

### 7.1 Priority order

Engineering must implement the first legally and technically available source in this order:

1. Caption text and timing already exposed by the active Bilibili player to the page or rendered subtitle layer.
2. Caption metadata already loaded for the current video session and accessible in page-owned state, without modifying requests or security controls.
3. A documented, licensed, or contractually approved Bilibili interface.
4. A user-enabled on-device transcription fallback approved as a separate feature.

An undocumented player endpoint may be evaluated only after legal review. It must not be treated as a stable product contract.

### 7.2 Prohibited integration behavior

The product must not:

- forge, steal, export, log, or transmit authentication cookies, tokens, device identifiers, or signatures;
- bypass WBI or other access controls, CAPTCHA, risk-control responses, login requirements, paid access, DRM, geographic restrictions, or rate limits;
- intercept or alter encrypted traffic;
- use proxy pools, fingerprint rotation, hidden browsers, request obfuscation, or other block-evasion techniques;
- prefetch unrelated videos, enumerate accounts, crawl libraries, or build a subtitle corpus;
- continue retrying after a denial or rate-limit response;
- replay captured signed URLs outside the active user session;
- send caption content to the company backend unless the user explicitly invokes a disclosed feature requiring it;
- remove, suppress, or interfere with native subtitles, advertisements, analytics, player controls, or platform notices.

### 7.3 Request budget and backoff

- Prefer zero additional source requests when captions are already present in player state.
- Permit at most one metadata retrieval per video/part activation unless the source explicitly requires refresh.
- Cache only in memory for the active tab by default.
- Do not poll for subtitles. Observe player/page state changes.
- On HTTP 401/403/412/429 or a platform risk-control response, stop enhanced retrieval for that video session and show a neutral error state.
- Do not automatically retry before a user action; cap manual retry attempts.
- Ship source adapters behind a remote **disable-only** kill switch. Remote code or remotely supplied executable logic is prohibited.

### 7.4 Commercial launch gate

Before public or paid launch, company counsel and business development must determine whether written permission, licensing, attribution, revenue sharing, or a Bilibili partnership is required. If authorization is required and not obtained, the affected integration must not launch. This is the only credible route to materially reduce long-term platform-blocking risk; technical stealth is not an acceptable product requirement.

## 8. Technical architecture

### 8.1 Chrome extension structure

- **Manifest V3 extension** with a narrow single purpose.
- **Content script** limited to eligible Bilibili video paths, responsible for player discovery, overlay host creation, accessibility, and communication.
- **Page-context bridge**, only if necessary, with a small typed and validated message surface. Never accept arbitrary executable strings or page-provided HTML.
- **Service worker** for lifecycle, settings coordination, optional licensed dictionary requests, and a disable-only compatibility flag.
- **Sandboxed overlay root** using Shadow DOM to prevent CSS collisions.
- **Local processing modules** for cue normalization, Chinese segmentation, pinyin, synchronization, and caching.
- **Popup/options UI** for activation state, settings, privacy, diagnostics export, and support.

### 8.2 Permission target

Start with the minimum possible set:

```json
{
  "manifest_version": 3,
  "permissions": ["storage"],
  "host_permissions": [],
  "content_scripts": [
    {
      "matches": ["https://www.bilibili.com/video/*"],
      "js": ["content.js"]
    }
  ]
}
```

Exact permissions are an engineering output, not a pre-approved entitlement. Avoid `cookies`, `webRequest`, `declarativeNetRequest`, broad `tabs`, `<all_urls>`, and wildcard Bilibili access unless a reviewed P0 requirement cannot be met otherwise. Any additional host access should be optional where feasible and must have an explicit user-facing justification.

### 8.3 Data model

```ts
type CaptionCue = {
  id: string;
  startMs: number;
  endMs: number;
  text: string;
  sourceLanguage: "zh-Hans" | "zh-Hant" | "zh";
  tokens: CaptionToken[];
};

type CaptionToken = {
  id: string;
  surface: string;
  normalized: string;
  pinyin?: string;
  startMs?: number;
  endMs?: number;
  confidence?: number;
};
```

Video URL and cue text must not enter analytics events. Saved vocabulary is separate user content and requires explicit action.

### 8.4 Synchronization behavior

- Treat the media element's current time as the playback clock when legitimately accessible.
- Use binary search over normalized cue intervals after seeks.
- Subscribe to playback events and use animation frames only while playing and visible.
- Do not infer word-perfect timing when only cue-level timing exists. Progressive highlighting must be labeled internally as estimated and may be disabled by the user.
- Rebuild state when the active media element, video part, or caption language changes.

### 8.5 Security controls

- No remote executable code, `eval`, dynamic script download, or untrusted `innerHTML`.
- Validate every message crossing page, content-script, and service-worker boundaries.
- Sanitize all subtitle and dictionary text and render through text nodes.
- Use HTTPS only for approved backend or dictionary services.
- Pin API schemas and reject oversized responses.
- Keep content security policy restrictive.
- Run dependency, license, secret, and extension-permission scans in CI.
- Complete third-party penetration testing before company-wide or public launch.

## 9. Privacy and data handling

### Local by default

The following should remain on-device in v1:

- current video eligibility and playback state;
- subtitle cues and tokens;
- pinyin generation;
- UI preferences;
- transient error diagnostics unless the user explicitly submits them.

### Prohibited company collection

- Bilibili cookies, credentials, tokens, account identifiers, or complete browsing history;
- raw video/audio;
- full subtitle tracks;
- exact watched-video URLs or titles in analytics;
- clicked words tied to an identifiable user without explicit opt-in.

### Required disclosures

Chrome Web Store listing and in-product UI must prominently explain that the extension accesses the content of the current Bilibili video page to provide the learning overlay. A privacy policy must describe local processing, any licensed dictionary request, telemetry fields, retention, deletion, subprocessors, and contact details. Disclosures must match actual behavior.

## 10. Compatibility and resilience

- Maintain a versioned source-adapter interface isolated from learning and rendering logic.
- Use semantic DOM/player signals where available; avoid selectors based solely on generated class names.
- Detect changes through scoped observers rather than broad, continuous DOM scans.
- Include a local diagnostic mode that records adapter state and error codes but excludes cookies, URLs, video titles, and subtitle text.
- Roll out to 1%, 10%, 50%, then 100% of users with a 24-hour observation gate at each stage.
- Automatically disable only the affected adapter if playback errors, 403/412/429 responses, or initialization failures exceed agreed thresholds.
- Maintain native-playback regression tests against a rotating, internally approved set of public test videos.

## 11. Analytics

Analytics is opt-in during beta and must use coarse, content-free events:

- extension_activated;
- eligible_player_detected;
- overlay_started;
- overlay_failed with enumerated error code;
- token_card_opened count;
- setting_changed with setting name but not value where sensitive;
- performance buckets;
- extension version and coarse Chrome major version.

Do not record video identifiers, URLs, titles, subtitle text, dictionary queries, Bilibili user identity, or IP addresses beyond unavoidable short-lived infrastructure logs. Establish a written retention schedule.

## 12. Quality assurance

### Automated coverage

- Unit tests for cue normalization, binary-search synchronization, segmentation, pinyin, punctuation, polyphonic words, and malformed data.
- Component tests for overlay states, keyboard navigation, focus trapping, and settings.
- Manifest and permission snapshot tests.
- End-to-end tests on Chrome stable for navigation, seek, pause, speed changes, part changes, theater mode, fullscreen, zoom, and extension disable/uninstall.
- Performance tests with long videos and high-frequency captions.
- Security tests for malicious subtitle text, message spoofing, oversized payloads, and compromised dictionary responses.

### Manual test matrix

- Logged-out and logged-in Bilibili sessions.
- Videos with creator captions, automatic captions, multiple languages, no captions, and inaccessible captions.
- Single-part and multi-part videos.
- Simplified, Traditional, mixed Chinese/English, emoji, punctuation, names, numbers, and code-switching.
- Playback rates from 0.5x to 2x.
- Chrome stable on Windows 11, macOS current/current-1, and one supported Linux distribution.
- Common ad blockers and accessibility tools, without promising compatibility with every extension.

## 13. Release plan

### Phase 0: feasibility and authorization, 2-4 weeks

- Legal review of Bilibili terms, caption/content rights, dictionary licensing, privacy, branding, and Chrome Web Store policies.
- Business outreach to Bilibili for written authorization or partner access.
- Technical spike using only local player/page data on an approved test set.
- Go/no-go decision based on source stability and legal basis.

### Phase 1: internal prototype, 3-5 weeks

- Player detection, cue synchronization, segmentation, pinyin, and overlay.
- No accounts, backend subtitle processing, or external analytics.
- Security and performance review.

### Phase 2: private beta, 3-4 weeks

- Vocabulary card, settings, privacy flows, diagnostics, compatibility kill switch.
- Invite-only distribution to employees and approved testers.
- Consent-based metrics and staged rollout.

### Phase 3: public release

Requires all launch gates below, Chrome Web Store review, support readiness, incident response, and a rollback plan.

## 14. Launch gates

All are mandatory:

- Product acceptance tests pass.
- Legal signs off on platform access, content treatment, branding, dictionary license, privacy notice, and terms.
- Security approves extension architecture and backend, if any.
- Chrome Web Store permission and disclosure review passes internally.
- Bilibili authorization/partnership decision is documented; any required authorization is obtained.
- No known method bypasses access controls or exports authentication material.
- Performance and native-player regression thresholds are met.
- Disable-only kill switch and rollback are tested.
- Customer support and incident contacts are staffed.

## 15. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Bilibili changes player internals | Overlay stops working | Adapter isolation, staged rollout, diagnostics, disable-only kill switch |
| Bilibili blocks or objects to integration | Product interruption or legal exposure | Written authorization, local/user-initiated access, no bulk collection, immediate stop on denial |
| Chrome Web Store rejection | Distribution blocked | MV3, narrow single purpose, minimum permissions, accurate privacy disclosures |
| Caption copyright/licensing issue | Legal exposure | Transient local processing, no corpus, no subtitle export, counsel review |
| LexiRise IP/trade-dress claim | Rework or dispute | Original brand, layout details, assets, copy, and code; document independent design |
| Subtitle/pinyin error | Learner confusion | Confidence handling, contextual tokenizer, correction feedback without uploading full captions |
| Extension breaks player | Poor experience | Shadow DOM, scoped observers, performance budgets, fail-open behavior |
| Sensitive data leakage | User harm | No cookie permission, local processing, strict event schema, security testing |

## 16. Open decisions

Product, legal, and engineering must resolve these before Phase 1 exits:

1. Has Bilibili provided written authorization or a supported commercial integration route?
2. Which caption source is legally approved and sufficiently stable?
3. Which licensed dictionary dataset/API will be used?
4. Is word saving included in v1 or deferred to P1?
5. Is progressive word highlighting acceptable when word-level timestamps are unavailable, or should only the whole cue be highlighted?
6. Which countries will launch first, and what privacy/localization obligations apply?
7. Will the product remain local-only or require a company account?

## 17. Definition of done for MVP

The MVP is done when an approved tester can install the MV3 extension, activate it on an eligible Bilibili video, see accurately synchronized Chinese captions with pinyin, inspect a token definition, adjust the overlay, navigate/seeks/change playback modes without breaking the native player, and disable or uninstall the extension cleanly. The implementation must pass the launch gates applicable to an internal prototype and contain no access-control bypass, bulk collection, credential handling, or LexiRise proprietary assets.

## 18. Reference policies

- Chrome Web Store Program Policies: https://developer.chrome.com/docs/webstore/program-policies/policies
- Chrome extension permission guidance: https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions
- Chrome content-script security guidance: https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts
- Chrome Web Store user-data FAQ: https://developer.chrome.com/docs/webstore/program-policies/user-data-faq/

These references are inputs, not legal advice. Requirements must be revalidated immediately before development milestones and store submission because platform policies and site behavior can change.
