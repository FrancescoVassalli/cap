# Mobile Release Plan — Google Play (active) / Apple App Store (deferred)

## Decision

**2026-09-05:** the org will not pay for the Apple Developer Program, so **Google Play is the only active public distribution channel** for the CAP mobile intake app. The Apple path is documented in [Deferred Apple App Store](#deferred-apple-app-store) and is not scheduled.

Consequences:

- No D-U-N-S, $99/yr membership, TestFlight, or Apple review in the active plan.
- iOS users cannot install from a public store until the decision changes.
- All release engineering is Android-first. The Expo SDK modernization is shared, so re-opening the Apple path later stays cheap.

This is the release-engineering companion to [architecture/react-native.md](../architecture/react-native.md) and [master.md](./master.md). It does not change the app's domain model, flow, or submission contract.

## Application scope

- Real app: `packages/mobile` — Expo + React Native + TypeScript, React Navigation, Formik/Yup, consuming `@cap/shared`.
- Shared domain: `packages/shared` owns intake types, validation, service interfaces, EveryAction mapping, and UUIDv4 intake-id generation.
- Flow: Home / How We Help → Intake landing → Intake steps → Review → Submit → Success.
- No accounts, ads, third-party tracking, or on-device PHI persistence.
- Transport is HTTPS only. Submission and presigned upload are configured through public `EXPO_PUBLIC_CAP_*` values.

## Gates

| Gate | Owner | Where it lives |
| --- | --- | --- |
| G1. Google Play Console org account ($25 one-time) + Play App Signing | CCHI / org admin — external | none |
| G2. Expo SDK modernization so the Android build meets Play's current target API | RN engineer | `packages/mobile/package.json` |
| G3. Production icon/splash/adaptive-icon assets | RN engineer / design | `packages/mobile/assets/`; `app.json` currently references missing files |
| G4. EAS project + Play credentials | RN engineer | `packages/mobile/eas.json` (missing) + EAS credentials |
| G5. On-device QA + store listing | QA / RN engineer | [QA gates](#qa-gates) |

If G1 plus a physical Android device or emulator cannot be available within about two weeks, the release is blocked on external resources rather than engineering.

## External accounts

| Account | Cost | Notes |
| --- | --- | --- |
| Google Play Console (organization) | $25 one-time | Email/phone/identity verification; no D-U-N-S. Package: `org.cohealthinitiative.cap`. |
| Expo account + project | Free | `eas init` binds the project; EAS Build produces Android `.aab` builds for Windows developers. |
| Google Play service account JSON | Free | For EAS auto-submit, or upload the signed `.aab` manually. Never commit the JSON. |
| Android device(s) or emulator | none | Device QA and screenshots; one Pixel-class device preferred for camera/picker QA. |

Do not require Apple membership, D-U-N-S, a Mac, or App Store Connect credentials for the Play path.

## In-repo release engineering

### 1. Modernize the Expo SDK (G2)

SDK 51 / RN 0.74 is below the toolchain the stores expect and cannot satisfy Play's current target-API requirement. Do this first:

1. `npx expo install expo@latest` then `npx expo install --fix`; verify with `npx expo-doctor`.
2. Update React/RN to the versions the chosen SDK requires.
3. Re-run `npm run typecheck`, `npm test`, and `npx expo export --platform android` in `packages/mobile`; the shared contract must not change.
4. Regression-test the Formik steps against the web behavior; keep Yup/Formik pins aligned with the SDK.
5. Keep the legacy `apps/mobile` scaffold untouched until this lands, then delete it (see [handoffs.md](./handoffs.md)).
6. Confirm the build meets Play's target API level at release time.

### 2. Production assets (G3)

Add real, on-brand assets under `packages/mobile/assets/` for `app.json`:

- 1024×1024 icon without alpha
- splash image
- Android adaptive icon foreground/background/monochrome

Play requires an Android 8+ adaptive icon. Regenerate from the web brand assets rather than copying the old `apps/mobile` icons.

### 3. App config

Before the first release build:

- `name`: "Consumer Assistance Program — CAP", verified against Play length limits.
- `version`: bump `0.1.0` → `1.0.0`.
- `android.versionCode`: set and increment per release (EAS `autoIncrement` recommended).
- `android.package`: keep `org.cohealthinitiative.cap`.
- `android.adaptiveIcon`: present once assets land.
- Keep `ios.*` fields; they are harmless and needed only if the Apple path re-opens.

### 4. EAS configuration and env

1. `npx eas-cli init` in `packages/mobile` (or install `eas-cli` globally).
2. Create `eas.json` with `development`, `preview`, and `production` profiles. Production should use `autoIncrement` and Play submit config or manual `.aab` upload.
3. Move the three `EXPO_PUBLIC_CAP_*` transport values into EAS environment variables so every CI/cloud build gets the same public values.
4. Use a stable production API URL before launch if CloudFront/Route53 wiring is available (for example `https://cap-api.cohealthinitiative.org`). Until then, ship against the current live API URL and rebuild when the stable URL exists. The resolver inlines values at build time.

### 5. Verification before any store upload

```bash
cd packages/mobile
npm run typecheck
npm test
npx expo-doctor
npx expo export --platform android
eas build:configure
# then: eas build -p android --profile preview
```

## Build strategy

- Android `.aab` builds go through EAS Build cloud, which performs `expo prebuild`, compiles with the SDK-matched toolchain, and signs through Play App Signing.
- A local Gradle build through `expo run:android` + `expo prebuild` works for development/preview `.apk` builds.
- No Mac is required on the Play path; screenshots can come from an Android phone or Windows emulator.

## QA gates

Block release on all of these:

- **Device matrix:** Pixel-class Android across two recent OS levels; tablet optional.
- **Functional:** Home → Intake → Review → Submit → Success; ZIP autofill; EN/ES switching persists; document picker and camera capture; upload under low connectivity; submit retry on transport failure; idempotent replay returns the same reference id.
- **Platform polish:** no keyboard overlap or safe-area clipping on contact/address steps; touch targets at least 44pt.
- **Security:** no PHI in logs, URLs, query strings, or analytics; HTTPS only; documents not persisted on-device.
- **Accessibility:** screen-reader labels/semantics per step, error association, live-region progress.
- **Store screenshots:** capture from the release build on Android (5.5"-class and 6.7"-class slots; tablet if provided).

## Google Play submission

1. Create the app in Play Console with package `org.cohealthinitiative.cap`; choose a category allowed for a consumer-assistance service.
2. Enable Play App Signing; generate/upload an upload key and back it up outside the repo.
3. Produce the `.aab` with the EAS `production` profile.
4. Prepare the store listing: description, screenshots, support URL, contact email, and the org's existing privacy policy URL.
5. Complete the Data safety form accurately: contact info, address, user content (documents/photos), language preference; collected from the user; not shared with third parties; no accounts.
6. Complete the IARC content rating questionnaire.
7. Satisfy Play's target API requirement (covered by the SDK modernization).
8. Roll out through Internal → Closed → Open testing, then Production with a staged rollout (10% → 50% → 100%).
9. In review notes, describe the nonprofit purpose, no account requirement, HTTPS/presigned document transmission, no on-device storage, and staff follow-up.
10. Watch Console crash/ANR and ratings between stages.

## Release rhythm

- One `production` build per release; `versionCode` increments automatically.
- Keep a per-release changelog and refresh screenshots each major release.
- Re-run the security and accessibility checks every release.
- Use staged rollout on major releases.
- Do not add analytics or tracking; this is a standing product constraint.

## Security and compliance

- Device stores no intake values or documents; React/Formik state only.
- The live API is currently public and unauthenticated (idempotency-key gating only). Before public store launch, add lightweight protection (API key, WAF/rate limit, or accept the web-equivalent exposure) as a release gate.
- Native calls have no Origin header; keep `CAP_ALLOWED_ORIGINS` correct for the web app.
- Keep PHI out of logs; the backend separates the durable intake log from the stdout logger.
- Data safety declarations must match actual behavior.
- Never commit the Play service account JSON or upload key.

## Deferred Apple App Store

The org declined the Apple Developer Program ($99/yr, D-U-N-S for org accounts) as of 2026-09-05. If funded later:

1. Enroll the org, complete D-U-N-S/verification, create the App ID and App Store Connect record, and obtain an App Store Connect API key; a Mac is needed for screenshots and final QA.
2. EAS iOS builds need no local Mac. Verify `npx expo export --platform ios` and an EAS iOS production build.
3. Submit with `eas build -p ios --profile production --submit` or `eas submit`; use TestFlight then App Review.
4. Reuse the Play data-safety categories in the privacy nutrition label; document standard TLS export compliance.
5. Expect 24–48h review, sometimes a "more information" round on privacy.

## Risks

| Risk | Mitigation |
| --- | --- |
| No Apple membership means no iOS store path | Accepted; deferred path recorded above. |
| Privacy policy / data-safety mismatch | Prepare both early from the org web notice; validate before submission. |
| Signing key loss | Play App Signing + EAS-managed upload key + off-repo backup. |
| SDK upgrade breaks a step | Upgrade first; shared tests catch contract drift. |
| Missing assets fail EAS prebuild | Add assets (G3) before the first build. |
| Play rejection or staged-rollout regression | Internal → closed → open → staged production with monitoring. |
| No physical device for QA | Windows emulator plus one Pixel-class device; EAS preview installs directly. |
| Live API exposure before launch | Add lightweight protection before public launch. |

## Timeline

| Week | Milestone |
| --- | --- |
| 1 | Play Console + Expo accounts started; SDK modernization starts |
| 2 | SDK upgrade green; assets added; `eas.json` + Play credentials; Android preview build |
| 3 | On-device QA; fix keyboard/picker/upload issues; internal testing track |
| 4 | Store listing, data safety, privacy URL, screenshots, content rating; closed + open testing |
| 5 | Production staged rollout (10% → 100%) |

## Definition of done

- `packages/mobile` builds a signed Android `.aab` through EAS production with Play App Signing.
- Full intake → upload → submit → success flow passes on-device, including retry and low-connectivity behavior.
- Metadata, privacy policy URL, data-safety declaration, content rating, and screenshots are accepted.
- App is Production on Google Play with staged rollout at 100%.
- Apple App Store remains explicitly deferred with prerequisites recorded.
- No PHI, analytics, or credentials were added to the app or logs.
