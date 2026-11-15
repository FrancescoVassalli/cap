# React Native Mobile Architecture

## Scope and status

The CAP mobile intake application is implemented under `packages/mobile` as an
Expo SDK 51 / React Native / TypeScript app. `packages/shared` is the platform-
neutral domain boundary consumed by both the web app and the mobile app.

The implementation covers the planned public journey:

`Home / How We Help` → `Intake landing` → `Intake flow` → `Review` → `Submit` → `Success`.

The code is locally verified. Submission and presigned upload were verified
against the live API. Physical-device QA and the Google Play release are still
external release activities; the active plan is
[../planning/mobile-release.md](../planning/mobile-release.md).

## Package boundaries

### `packages/shared`

This package owns business contracts and transport mapping:

- `IntakeFormValues`, `IntakeDocument`, `Language`, ZIP, submission, and upload types
- Shared step and document validation rules
- `SubmissionService`, `DocumentUploadService`, and `ZipService` interfaces
- Mock and API submission adapters
- EveryAction field mapping and URL-encoded request construction
- UUIDv4 intake-id generation for the backend `Idempotency-Key`

The API adapter posts the backend's form-encoded EveryAction field names,
handles network/session/server-field errors, and performs one bounded retry on
transport failure. It does not retry HTTP responses.

### `packages/mobile`

The mobile package owns native UI and platform adapters without duplicating
business rules:

- React Navigation stack and CAP theme tokens
- Typed English/Spanish content with runtime language switching
- Formik intake steps for ZIP, language, contact/address, documents, review,
  submission, and success/error states
- Native document selection and camera capture through Expo adapters
- Transient URI registry used only to connect selected local files to upload
  adapters; URIs are not part of the shared document metadata contract
- Configuration-driven mock/API submission and local/presigned upload selection

The mobile service resolver reads public `EXPO_PUBLIC_CAP_*` configuration and
defaults to mock submission plus local, UI-only document handling when no API is
configured.

## Native document flow

`documentPicker.ts` wraps `expo-document-picker` and `expo-image-picker`.
Camera permission denial and cancellation return explicit non-throwing statuses
so the form remains usable. `pickedDocument.ts` contains the pure asset mapper,
including safe filename, MIME type, and size fallbacks for camera captures.

Documents are validated through `@cap/shared` before metadata is added to
Formik state. The local file URI is registered separately in
`DocumentUrisContext`; review occurs before the upload adapter is invoked.
Production upload uses the two-step API contract: request a short-lived upload
URL, then PUT bytes directly to the returned URL using `expo-file-system`.

## Security and accessibility

- No PHI, document bytes, raw payloads, or filenames are logged.
- Intake values remain in React/Formik state and are not persisted.
- Sensitive values are not placed in URLs, query parameters, or analytics.
- Uploads use approved API/presigned routes; filenames are not security keys.
- HTTPS is enforced by the production transport/deployment configuration.
- Controls use accessible labels/hints, error association, live progress state,
  visible states, and minimum 44-point touch targets.
- Camera permission text is declared in `app.json` for iOS and the Expo plugin.

## Verification

The mobile package has a node-based Vitest suite for pure and adapter logic:

- `npm run typecheck` — clean
- `npm test` — green
- `npx expo export --platform android` — successful bundle

The shared/web verification remains green with the shared contract:

- Root `tsc -b` — clean
- Web Vitest — green
- `npm run build` — successful

## Remaining release work

Remaining release work is tracked in
[../planning/handoffs.md](../planning/handoffs.md) and
[../planning/mobile-release.md](../planning/mobile-release.md). In summary:

- Android on-device QA for keyboard/safe-area behavior, camera/document picking,
  upload recovery, and complete submission.
- Google Play release engineering: Play Console account, EAS project, assets,
  `eas.json`, Expo SDK modernization, and a stable production API URL.
- Add rendered component tests if mobile UI regression coverage is required.
- Add SecureStore only when a non-PHI authenticated session/resumption flow
  exists; the current no-persistence design intentionally stores no intake data.
