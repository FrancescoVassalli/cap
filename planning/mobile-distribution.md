# Mobile Distribution Plan — Google Play (active) / Apple App Store (deferred)

## 0. Distribution decision (read first)

**2026-09-05 decision:** the org will **not pay for the Apple Developer
Program** ($99/yr, D‑U‑N‑S verification required for org accounts), so the
**Google Play Store is the only public distribution channel** the CAP mobile
intake app can enter right now. The Apple App Store path is **deferred** until
that membership is funded and approved; it is documented in [Section 9](#9-deferred-apple-app-store-requires-paid-membership)
so the prerequisite work is not lost, but **no active work in this plan targets
the App Store.**

Consequences of the decision:

- No D‑U‑N‑S, no $99/yr membership, no TestFlight, and no Apple review loop in
  the active plan.
- iOS users cannot get the app from a public store until the decision changes;
  interim iOS installs would require development builds (out of scope for this
  plan).
- All release engineering below is Android-first. The Expo SDK modernization
  (Section 4.1) is shared work, so the Apple path becomes cheap to re-open
  later, but it is not scheduled.

This document is the release-engineering companion to
[`../../architecture/react-native.md`](../../architecture/react-native.md) and
[`../react-native-app.md`](./react-native-app.md). It does not change the app's
domain model, flow, or submission contract.

## 1. Reality check and decision gate

**Verdict: Google Play distribution is fully realistic.** The app is a
nonprofit public-service intake tool for a Colorado state-affiliated program; it
has no login, no ads, no third-party tracking, no game/9.x dynamic content, and
it does not persist PHI on-device. That is squarely within Play's reviewable
category, and Play's developer onboarding is materially cheaper and simpler than
Apple's (no D‑U‑N‑S).

The gates below decide the release. If any gate is permanently unavailable, the
release is blocked until it is resolved (none of them require the Apple
program).

| Gate | Who owns it | Where it is in this repo |
| --- | --- | --- |
| G1. Google Play Console org account ($25 one-time) + Play App Signing setup | CCHI / org admin — **external** | none |
| G2. Expo SDK modernization (51 → current stable) so the Android build satisfies Play's current target API requirement | RN engineer | `packages/mobile/package.json` |
| G3. Production icon/splash/adaptive-icon assets present under `packages/mobile/assets/` | RN engineer / design | `packages/mobile/app.json` references files that do not exist in that package |
| G4. EAS project + Play credentials (service account JSON or upload key) | RN engineer | `packages/mobile/eas.json` (does not exist yet) + EAS credentials |
| G5. On-device QA and store listing (data safety, privacy policy URL, screenshots, content rating) | QA / RN engineer | recorded in `architecture/react-native.md` |

If the org can complete G1 plus at least one physical Android device (or an
emulator) within ~2 weeks, proceed through Sections 2–8. Otherwise the release
blocks on G1/G5, not on engineering.

## 2. Current state (verified-in-repo baseline)

- Real app: `packages/mobile` — Expo SDK 51, RN 0.74.5, React Navigation,
  Formik/Yup, `@cap/shared` domain contract. `tsc --noEmit` clean, mobile
  Vitest 27/27, `expo export` bundles for Android and web.
- Live backend wiring: `.env` (gitignored) sets `EXPO_PUBLIC_CAP_SUBMISSION_MODE=api`,
  `EXPO_PUBLIC_CAP_UPLOAD_MODE=presigned`, `EXPO_PUBLIC_CAP_API_BASE_URL=https://ah0jz85mlj.execute-api.us-east-2.amazonaws.com`.
  POST /intakes and /intakes/:id/upload-url verified end-to-end; the byte PUT to
  S3 is live.
- Android package already set in `app.json`: `org.cohealthinitiative.cap`
  (also set as the iOS bundle identifier — harmless, keep both).
- No PHI at rest on the device; no analytics; no third-party SDKs; HTTPS-only
  transport.
- Release blockers already in handoff: on-device QA, legacy `apps/mobile`
  cleanup. **Store-release blockers identified here: `packages/mobile/assets/`
  does not exist and `app.json` points at missing icon/splash files;
  `packages/mobile/eas.json` does not exist; no Play Console account exists.**

## 3. External accounts (do first — they take the longest)

Create these before building anything, because EAS needs them to sign:

| Account | Cost | Notes |
| --- | --- | --- |
| **Google Play Console** (organization account) | $25 one-time | Org verification is email/phone/identity — **no D‑U‑N‑S**. Create the app with package `org.cohealthinitiative.cap`. This is G1. |
| **Expo account + project** | Free | `eas init` binds the project; EAS Build cloud can produce Android `.aab` builds for Windows devs. |
| **Google Play service account JSON** (for EAS auto-submit) | Free | Play Console → API access → create service account, grant the EAS release permission; do **not** commit the JSON. Alternatively skip auto-submit and upload the `.aab` manually in Play Console with the upload key. |
| **Android device(s) or emulator** | none | Device QA plus store screenshots. A Windows-PC emulator covers most of this; one physical Pixel-class device is preferred for camera/picker QA. |

Deliberately **not** required: Apple Developer Program membership, D‑U‑N‑S, a
Mac, or an App Store Connect API key. Do not charge any service-account
credentials to the repo secrets; they live in the EAS/Google console UIs and CI
secret store.

## 4. In-repo release engineering

### 4.1 Modernize the Expo SDK (Gate G2)

SDK 51 / RN 0.74 is behind the toolchain the stores expect in 2026 and cannot
satisfy Play's current target-API requirement. This is the highest technical
risk on the Android path and must be done first (it is also the only shared
prerequisite that later re-opens the Apple path):

1. `npx expo install expo@latest` and run `npx expo install --fix` to the current
   stable SDK (verify with `npx expo-doctor`).
2. Update React/RN to the versions the chosen SDK requires (do **not** stay on
   RN 0.74).
3. Re-run `npm run typecheck`, `npm test`, and `npx expo export --platform android`
   in `packages/mobile`; the shared contract must not change.
4. Regression-test the Formik steps against the old web behavior; Yup/Formik pins
   should follow the SDK's recommended set.
5. Keep the legacy `apps/mobile` SDK-57 scaffold untouched until this upgrade
   lands, then delete it (stale scaffold, see handoff).
6. Confirm the resulting build meets Play's **target API level** requirement in
   effect at release time; `npx expo-doctor` and the EAS build output report the
   compiled target.

### 4.2 Production assets (Gate G3)

`packages/mobile/app.json` references `./assets/icon.png`,
`./assets/splash.png`, and `./assets/adaptive-icon.png` that do not exist in
that package — EAS builds will fail at prebuild. Add a real, on-brand asset set
(sizes required by Expo/EAS: 1024×1024 icon without alpha, splash, Android
adaptive icon foreground/background/monochrome from the CAP brand tokens in
`packages/mobile/src/theme`). **Play requires an Android 8+ adaptive icon**, so
this is a hard listing gate, not cosmetic. Do not copy the old `apps/mobile`
icons blindly; regenerate from the web `public/CCHI_Logo.png`/favicon.

### 4.3 App config for the store

In `packages/mobile/app.json` before first release build:

- `name`: "Consumer Assistance Program — CAP" (display name; verify against
  Play's listing-length limits, i18n-safe)
- `version`: bump `0.1.0` → `1.0.0`
- `android.versionCode`: set, incremented per release (EAS `autoIncrement` in
  `eas.json` is the recommended mechanism)
- `android.package`: keep `org.cohealthinitiative.cap`
- `android.adaptiveIcon`: present once Section 4.2 lands (background
  `#1f4e79`, foreground asset)
- `ios.*` fields (bundleIdentifier, supportsTablet, camera infoPlist): keep —
  harmless, and needed only if the Apple path re-opens
- target API level for Android: whatever the current Play requirement is at
  release time (2026: recent API level); set only what the SDK supports

### 4.4 EAS configuration and env

1. `npm i -g eas-cli` (or use `npx eas-cli`), `eas init` in `packages/mobile`.
2. Create `eas.json` with three profiles:
   - `development` — `developmentClient: true`, used for device QA
   - `preview` — internal distribution (Play internal testing track)
   - `production` — store build (`android` only for the first release),
     `autoIncrement` version codes, submit config for the Play service account
     (or manual `.aab` upload with the upload key)
3. Move the three `EXPO_PUBLIC_CAP_*` transport values into **EAS environment
   variables** (not the gitignored `.env`) so every CI/cloud build gets the same
   production values. They are public transport config only — no secrets/PHI.
4. Point the store build at the **stable production API URL** if CloudFront/
   Route53 wiring lands (e.g. `https://cap-api.cohealthinitiative.org`), not the
   temporary `ah0jz...execute-api...` URL. The resolver inlines these at build
   time, so rebuild on any URL change. Until the stable URL exists, ship the
   first Play release against the current live `ah0jz...` URL and rebuild before
   any material release.

### 4.5 Verification before any store upload

```bash
cd packages/mobile
npm run typecheck
npm test
npx expo-doctor
npx expo export --platform android
eas build:configure
# then: eas build -p android --profile preview   (smoke; cheapest platform)
```

## 5. Build strategy (Windows development machine)

- Android `.aab` builds go through the **EAS Build cloud** (recommended): EAS
  performs `expo prebuild`, compiles with the SDK-matched Android toolchain,
  signs through Play App Signing, and can **submit to Google Play directly**.
  Free tier covers a review cycle; paid plan only if build limits are hit.
- Alternatively, a local Gradle build through `expo run:android` +
  `expo prebuild` works on the Windows box for development/preview .apks.
- **No Mac is required anywhere on the Play path** — in particular, store
  screenshots can be captured from the release build on an Android phone or the
  Windows emulator.
- Never commit `.env`, the Play service account JSON, or the upload/track keys.
  Credentials live in EAS credentials or the CI secret store.

## 6. QA gates before store submission

Block release on all of these (current on-device QA gap in handoff):

- **Device matrix:** Pixel-class Android, 2 recent OS levels; a tablet is
  optional for screenshots but not required for QA.
- **Functional:** full flow Home → Intake → Review → Submit → Success; ZIP
  autofill; EN/ES switching persists through the flow; document picker and
  camera capture; upload with low-connectivity throttling; submit retry on
  transport failure; idempotent replay returns same reference id.
- **Platform polish:** no keyboard overlap / safe-area clipping on contact and
  address steps; touch targets ≥44pt after the SDK upgrade.
- **Security spot-check:** no PHI in logs, URLs, query strings, or analytics;
  HTTPS-only transport; documents not persisted on-device.
- **Accessibility spot-check:** screen-reader labels/semantics on each step,
  error association, live-region progress.
- **Capture store screenshots** from the *release build* on an Android phone
  (both the smaller 5.5"-class and larger 6.7"-class slots Play requires, plus
  tablet if provided). Android screenshots need no Mac.

## 7. Google Play submission (active path)

1. **App registration:** create the app in Play Console with package
   `org.cohealthinitiative.cap`, declare the orgs, and pick a category — recommend
   "Health & Fitness" or "Government"; choose the category Play's policy guide
   allows for a consumer-assistance service.
2. **Play App Signing:** enable it. Generate an upload key (or let EAS
   `eas credentials` create one) and upload the public cert; keep the key itself
   backed up outside the repo.
3. **App bundle:** EAS `production` profile produces an `.aab`.
4. **Store listing:** description (EN; ES optional), screenshots, feature
   graphic (optional but recommended), support URL, contact email, and the
   **privacy policy URL** (use the org's existing web privacy notice —
   `cohealthinitiative.org` CAP page — not new language).
5. **Data safety form:** declare accurately the data already in the app's
   privacy posture — contact info (name/email/phone), physical address, user
   content (documents/photos), and language preference; all collected from the
   user; none shared with third parties. Since the app creates **no accounts**,
   Play's account-deletion control is not triggered; note in the listing that
   records are transmitted to the program operator and CAP staff process them
   (transparency note: "data is transmitted to the program operator").
6. **Content rating (IARC):** complete the questionnaire — health-assistance
   informational tool, no violence/sexual content, collects user input, no
   in-app purchases/ads.
7. **Target API level:** satisfy the Play requirement in effect at release time
   (recent API — the SDK modernization in 4.1 covers this).
8. **Rollout:** start in **Internal testing** with the QA device list → promote
   to **Closed testing** (invitees) → **Open testing**; then **Production with
   staged rollout** (10% → 50% → 100%) so regressions are catchable. Watch
   Play Console crash/ANR and ratings between stages.
9. **Review notes to Google:** describe the nonprofit purpose, that no account
   is required, how documents are transmitted (HTTPS to a presigned URL), that
   no data is stored on-device, and that a staff follow-up call is the normal
   outcome. Provide demo/entry instructions if reviewers need a production
   entry.
10. **Typical timeline:** Play review is usually hours–days (occasionally
    longer on first submission). Most common rejection risks: missing or
    mismatched privacy policy/data-safety declarations, or an expired target
    API level.

## 8. Release operating rhythm

- One `production` profile build per release; increment `versionCode`
  automatically (`autoIncrement` in `eas.json`).
- Keep a per-release changelog; screenshots re-captured every major release.
- Re-run the security + accessibility checks (Section 6) on every release.
- Use Play's staged rollout (10% → 100%) on major releases and monitor
  crash/ANR/ratings before full rollout.
- Do **not** add analytics/tracking to the mobile app; that is a standing
  product constraint.

## 9. Deferred: Apple App Store (requires paid membership)

**Why it is deferred:** the org decided not to fund the Apple Developer Program
($99/yr, org accounts require D‑U‑N‑S) as of 2026-09-05. Without membership
there is no App Store submission, no TestFlight, and no on-device iOS
provisioning, so no active release work targets iOS. Nothing below is scheduled
until the decision changes.

**If the org later funds the membership**, the incremental path (much of the
work is already done in this plan's shared steps) is:

1. **Prerequisites:** Apple Developer Program org enrollment + D‑U‑N‑S; Apple
   verification of legal entity + principal; App ID `org.cohealthinitiative.cap`;
   an App Store Connect record; an App Store Connect API key (App Manager role,
   never committed) or Transporter on a Mac; a Mac (physical or cloud) for iOS
   screenshots and final Q&A on the built `.ipa`. EAS Build itself needs no
   local Mac.
2. **Binary readiness:** the Section 4.1 SDK modernization that unblocks the
   play release also unblocks iOS; verify `npx expo export --platform ios` and
   an EAS iOS production build.
3. **Submission:** `eas build -p ios --profile production --submit` (or
   `eas submit` from the `.ipa`); TestFlight → App Review.
4. **Metadata & compliance:** privacy "nutrition label" with the same declared
   categories as the Play data-safety form (contact, address, user content,
   language preference; none shared; no deletion because records are
   transmitted to the program operator); export-compliance answer as standard
   TLS (no proprietary crypto, exempt from ITS); review notes describing the
   nonprofit purpose, no-account model, presigned-URL document transmission, and
   no on-device storage.
5. **Typical timeline (when pursued):** Apple review 24–48h (sometimes up to a
   week); expect at least one "more information" round on privacy. Common
   rejection risks: missing privacy policy, inaccurate data-collection
   declaration, placeholder content, or a broken submission path under review
   conditions.

## 10. Security & compliance notes that apply to the store release

- The device never stores intake values or documents (React/Formik state only —
  strongest posture, and easy to describe to reviewers).
- The live API is currently **public and unauthenticated** (idempotency-key
  gating only). Before a public store launch, the org/backend team should add a
  lightweight protection (API key, WAF/rate limit, or keep the idempotency gate
  and accept the web-equivalent exposure). This is a release gate, not a mobile
  app change.
- Confirm the backend CORS allowlist (`CAP_ALLOWED_ORIGINS`) is irrelevant to
  native calls (no Origin header), but keep it right for the web app.
- Keep PHI out of logs everywhere; the backend already separates the durable
  intake log from the stdout logger.
- Play-specific: the **data safety form must match the app's actual behavior**;
  submitting an inaccurate declaration is a policy violation. Use the same
  category set the web app's privacy posture already declares.
- Never commit the Play service account JSON or upload key; store them in EAS
  credentials / CI secret store only.

## 11. Risks and owners

| Risk | Likelihood | Mitigation |
| --- | --- | --- |
| No Apple membership means iOS has no store path | Certain (by decision) | Accepted; deferred path recorded in Section 9; Play is the active channel. |
| Play policy: privacy policy URL / data-safety mismatch | Medium | Prepare both early from the org web notice; validate before submission. |
| Signing key loss | Low | Play App Signing + EAS-managed upload key + off-repo backup. |
| SDK 51 → current upgrade breaks a step | Medium | Upgrade first, regression-test against web contract; shared tests catch drift. |
| Missing assets cause EAS prebuild failure | High (current) | Section 4.2 before first EAS build. |
| Play review rejection / staged-rollout regression | Medium | Internal → closed → open → staged production; monitor Console between stages. |
| Physical device QA not available | Medium | Use the Windows emulator plus one Pixel-class device; EAS `preview` builds install directly on Android devices. |
| Live API exposure before store launch | Medium | Section 10 gate: lightweight protection before public launch. |

## 12. Timeline (parallel where possible)

| Week | Milestone |
| --- | --- |
| 1 | Play Console + Expo accounts kicked off (G1); SDK modernization starts |
| 2 | SDK upgrade green; assets added (G3); `eas.json` + Play credentials (G4); preview build on Android |
| 3 | On-device QA on Android (G5); fix keyboard/picker/upload issues; internal testing track loaded |
| 4 | Store listing, data safety, privacy URL, screenshots, content rating prepared; closed + open testing |
| 5 | Production staged rollout (10% → 100%); release communications |

## 13. Definition of done

The distribution is complete when all of the following are true:

- `packages/mobile` builds a signed Android `.aab` through EAS production with
  Play App Signing and the org's credentials.
- On-device QA of the full intake → upload → submit → success flow passes on
  Android, including retry and low-connectivity behavior.
- App metadata, privacy policy URL, data-safety declaration, content rating, and
  screenshots are submitted and accepted.
- The app is **Production on Google Play** with the staged rollout at 100%, and
  an incrementable versioning rhythm is recorded in this plan and the handoffs
  file.
- The Apple App Store remains explicitly deferred, with the paid-membership
  prerequisites recorded in Section 9.
- No PHI, analytics, or credentials were added to the app or its logs at any
  step.