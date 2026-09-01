# Handoffs
This is the current implementation handoff for the CAP project. It reflects the verified state of the repo and the remaining work needed before the project is ready for final integration. Each section below is for a particular agent to read from.

### API implementation — file storage / presigned upload flow

**Status:** File storage is working end-to-end and **verified against real S3**.
Selecting a document in the web app issues real network traffic to the backend
to obtain a presigned upload URL, and the browser PUTs the file bytes directly
to that URL. A real `PUT -InFile` to a freshly issued S3 presigned URL returns
`200` and the file is visible in the bucket. A **local/mock sink** is available
as an easy toggle for development and CI (PUTs to `http://127.0.0.1:8787/uploads/...`,
bytes validated then discarded).

**What was fixed/verified this round**
- S3 presigner (`backend/src/presigner/s3Presigner.ts`) now activates from the
  real AWS credentials in the gitignored `.env` (`S3_BUCKET_NAME`,
  `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`). With a current
  build/restart the backend returns `https://...s3...amazonaws.com/...` presigned
  URLs and stores the file. The earlier localhost `…/uploads/…` URL the browser
  showed was from a server still running the local presigner (before S3 was
  wired / creds loaded); a restart picked up S3.
- Empty-PUT confusion: a `PUT` with no body sends no file content (the local
  sink explicitly rejects it as `empty_upload`, and S3 rejects an empty object
  handoff). The frontend `PresignedS3DocumentUploadService` sends `body: file`
  correctly, so the selected file's bytes transfer.
- Presigner selection is now deterministic and explicit at startup
  (`backend/src/index.ts`): S3 is used only when bucket + region + credentials
  are all present; otherwise it falls back to the local presigner and logs the
  active mode (`presigner-s3-active` / `presigner-local-active`) so a silent
  localhost "upload" is never hidden.
- Easy S3 ↔ mock switch documented: set `CAP_LOCAL_PRESIGNER_MODE=mock` (backend
  env) to PUT to the local server instead of S3. Because the frontend adapter
  PUTs to whatever URL the backend returns, **no frontend `.env.local` change is
  needed** — this is purely a backend env flag. Documented in `backend/README.md`
  and `env.example`.
- Architecture docs (`architecture/master.md`, `architecture/implementation-audit.md`)
  updated to reflect the working file storage and backend.

**Verified:** vitest 149/149 (95 frontend + 54 backend incl. CORS tests),
`tsc --noEmit` clean, backend `tsc -p backend/tsconfig.build.json` clean, the
Playwright E2E upload test passes, and the S3 presigned PUT lands the file in the
bucket (confirmed by the E2E run and a direct `-InFile` PUT).

**Intake submission log (added this round):** the final `POST /intakes` Submit
Request endpoint now also **writes the received form input to a durable intake
audit log** (`store.appendIntakeLog` / `getIntakeLog`), an append-only per-intake
`logs` collection in the store — intentionally separate from the PHI-free stdout
logger so raw consumer data is never emitted to operation logs. First-time
submissions record the full submitted form input; idempotent replays return
early and never duplicate the entry. Covered by new backend tests (write on
submit, no duplicate on replay, no log for invalid input, no consumer data in
stdout). Suite is now 153/153 green.

**Intake submission now wired to the real API (this round):** the "Submit
Request" button now actually calls the API. The local dev fixture
(`.env.local`) previously set only upload mode, so submission fell back to the
in-memory `MockSubmissionService` and never transmitted. It now sets
`VITE_CAP_SUBMISSION_MODE=api` (plus the existing `VITE_CAP_UPLOAD_MODE=s3` and
`VITE_CAP_API_BASE_URL`), so the running Vite app routes the submit button
through `ApiSubmissionService` → `POST /intakes` on the live backend. Verified
the exact adapter end-to-end against a running server (returns
`success:true` with a `CAP-XXXX-XXXX` reference id). Because Vitest also honors
Vite's `.env.local` by default, the frontend test project now forces
`VITE_CAP_SUBMISSION_MODE=''` / `VITE_CAP_UPLOAD_MODE=''` in
`vite.config.ts` (`test.env`), keeping the 153-test suite deterministic against
the in-memory mocks while the dev app talks to the real API.

**Next steps**
1. API/Lambda + API Gateway production wiring remains blocked on IAM/account
   grants (see the deployment-infrastructure section below) and on the
   every-action (CRM) contract, which is still outstanding.
2. Add Playwright E2E runner to the standard `npm test`/CI path so the presigned
   upload contract stays covered; currently it runs only via the explicit
   `npx playwright test` invocation against a running backend + frontend.
3. Confirm the CORS origin whitelist in production (`CAP_ALLOWED_ORIGINS`) to the
   exact static-host origin before release.

## deployment-infrastructure — Windows-native AWS deployment

**Status:** A Windows-native deployment is implemented (`scripts/deploy/deploy-aws.ps1`
+ `scripts/deploy/package-api.ps1`) and the **static frontend is deployed live** to
the real S3 bucket `cap-frontend-590251390266-us-east-2-an` (build + sync + correct
cache headers verified against the account). The API Lambda artifact is packaged and
its handler is verified functional (a real S3 presigned upload URL is issued from the
extracted zip). What cannot be done from the current `cap-agent` AWS session is
documented below so an administrator can unlock the remaining layers.

**What is in the repo**
- `scripts/deploy/deploy-aws.ps1` — Windows-native analogue of `scripts/deploy-aws.sh`
  (the bash original is Unix-only and will not run on this Windows machine). Same CLI
  surface (`-Check`, `-DryRun`, `-Frontend`, `-Api`, `-Region`, `-FrontendBucket`,
  `-CloudFrontId`, `-ApiFunction`, `-ApiPackage`, `-FrontendDir`), plus a per-deployable
  IAM permission preflight so `-Check` reports exactly which layers are reachable.
- `scripts/deploy/package-api.ps1` — builds the backend (`npm run build:api`) and zips a
  self-contained Lambda artifact to `dist-lambda/cap-api.zip` (handler `handler.handler`).
- `backend/src/handler.ts` — production Lambda entrypoint wiring
  `createApiDependencies(process.env)` into `createLambdaHandler` (handler name `handler.handler`).
- npm scripts: `build:api`, `deploy:check`, `deploy:frontend`, `deploy:api`, `deploy:package-api`.

**Verified working from this session (`cap-agent`, account 590251390266, us-east-2)**
- `deploy-aws.ps1 -Frontend`: builds the bundle and syncs it to the frontend bucket with
  the correct cache headers (`assets/*` immutable, `index.html` no-cache). The deployed
  files are present in S3 (confirmed via `aws s3 ls` + `head-object`).
- `package-api.ps1`: produces `dist-lambda/cap-api.zip`; invoking `handler` from the
  extracted zip returns `200 {"status":"ok"}` on `/health` and a signed S3 presigned URL
  on the upload-url route (local vendor `dist` was cleaned).

**Blockers needing an administrator (permissions verified against the live account)**
- Lambda deploy: `lambda:CreateFunction` **is** allowed, but `iam:CreateRole` is **denied**,
  so no Lambda execution role can be created by this session. A functioning Lambda requires
  a role (or an `iam:CreateRole`/`iam:PassRole` grant). Set `CAP_LAMBDA_ROLE_ARN` to an
  admin-provisioned execution role to let the API path create/update the function.
- API Gateway: `apigateway:*` is **denied**, so no public HTTP API endpoint can be created.
- CloudFront: `cloudfront:CreateDistribution` is blocked by **account verification** (AWS
  support must verify the account before adding new distributions). OAC `cap-frontend-oac`
  (`E1EMZ30G5M3VFD`) was created and a ready-to-use distribution config/rollout note is in
  `planning/deployment-infrastructure.md`.

**Next steps (for an AWS administrator or a broadened IAM policy)**
1. Grant `iam:CreateRole` + `iam:PassRole` + `lambda:CreateFunction` (or pre-provision an
   execution role and set `CAP_LAMBDA_ROLE_ARN`), then run `deploy-aws.ps1 -Api`.
2. Verify the AWS account for CloudFront, then create the distribution with OAC
   `cap-frontend-oac` (config in the deployment-infrastructure plan) and set
   `CAP_CLOUDFRONT_DISTRIBUTION_ID`; `deploy-aws.ps1 -Frontend` will then invalidate it.
3. Grant `apigatewayv2:*` (or REST API) to expose the Lambda behind a public HTTPS URL and
   point `VITE_CAP_API_BASE_URL` / `CAP_API_BASE_URL` at it.
4. Confirm `CAP_ALLOWED_ORIGINS` to the exact static-host origin before public release.

## react-native-app — mobile app implementation

Drives the [React Native plan](./react-native-app.md) for the CAP mobile app. Web app and API are already implemented; backend deployment steps in master.md remain blocked on external dependencies (AWS credentials, CRM contract) and are not part of this handoff.

### Status

The Expo mobile app and the shared domain contract are implemented and green. Both the web app and the mobile app now share the same domain types, validation rules, and service contracts through `packages/shared`. Mobile backend wiring is config-driven (`EXPO_PUBLIC_CAP_*`, mirroring the web's `VITE_CAP_*`), with a byte-PUT presigned upload adapter ready to attach to the live API.

**What was completed (cumulative)**
- **`packages/shared`** — the single source of truth for the intake domain: types (`Language`, `IntakeFormValues`, `IntakeDocument`, `ZipLocation`, `SubmissionErrorKind`, `IntakeSubmissionResult`, `SubmissionPayload`), service interfaces (`SubmissionService`, `ZipService`, `DocumentUploadService`), transport-neutral step validation (`validateIntakeStep`, `DOCUMENT_CONFIG`, `validateDocumentCandidates`), and the `MockSubmissionService` / `ApiSubmissionService` adapters.
- **Backend wire contract aligned across web + mobile** — the shared `ApiSubmissionService` now builds the same `application/x-www-form-urlencoded` EveryAction body the web sends (`FirstName`/`EmailAddress`/numeric `PreferredLanguages`, etc.) via a new shared `packages/shared/src/backend.ts` (the `everyActionMapper` moved into shared; the web module re-exports it). The intake/session id is a shared `generateIntakeId()` (UUIDv4, matching the backend's `Idempotency-Key` gate), used by the mobile flow instead of the invalid `cap-<timestamp>` fallback. The submission adapter also does a bounded (2 attempts, 400ms backoff) retry on transport-level failure only — server-side idempotency via the `Idempotency-Key` makes this safe, and HTTP responses (including 5xx) are never retried.
- **`packages/mobile`** — an Expo SDK 51 + React Native 0.74 + TypeScript + React Navigation + Formik/Yup app (the repo layout uses `packages/mobile`, per the plan's `apps/mobile`-style package boundary):
  - **Theme + brand tokens** (`src/theme/index.ts`) mirroring the web CSS tokens (#1f4e79 primary, #2b6cb0 secondary, #fec524 highlight, 44pt touch targets, semantic colors) with no web-only imports.
  - **Bilingual content modules** (`src/content/index.ts`) extracting the approved EN/ES copy into typed `MobileContent`, with live EN/ES switching via `src/context/ContentContext.tsx`.
  - **App shell + stack navigation** (`App.tsx`, `src/navigation/types.ts`) wiring Home → IntakeLanding → Intake.
  - **Screens** (`src/screens/HomeScreen.tsx`, `IntakeLandingScreen.tsx`, `IntakeScreen.tsx`, `SubmissionScreen.tsx`) mirroring the web `/how-we-help` → `/intake` → `/intake/:id` flow.
  - **Step-based intake** (`src/components/intake/{ZipStep,LanguageStep,ContactStep,DocumentsStep,ReviewStep}.tsx` + `StepShell`/`StepProgress`/`StepBody`) covering ZIP lookup (with optional autofill + not-found notice), language, contact/address, native document selection, review-with-edit, and submit. Validation is authoritative per active step via the shared rules; field errors are tied to each control for screen readers.
  - **Service adapters** behind the shared contracts (`src/services/index.ts`, `config.ts`, `zip.ts`, `documentUpload.ts`, `documentPicker.ts`) with the mobile `StaticZipService` (tiny embedded CO dataset), a config-driven service resolver (`resolveMobileServiceConfig` reading `EXPO_PUBLIC_CAP_*`, mirroring the web's `VITE_CAP_*` selection), and both a local UI-only upload adapter and a real `PresignedUploadService` that PUTs picked-file bytes via `expo-file-system`'s `File` class when a backend is configured. `src/context/DocumentUrisContext.tsx` carries transient local file URIs (pick-time → submit-time) without putting them in the shared `IntakeDocument` metadata type.
  - **Security/accessibility**: no PHI logged or put in URLs/query strings (bodies only); documents stored as metadata in React state only (no persistence — stronger than SecureStore for the no-PHI-at-rest requirement); 44pt+ touch targets, accessible labels/hints, `accessibilityRole`/`accessibilityState`, `accessibilityLiveRegion` progress, and WCAG 2.2 AA error association.
  - `metro.config.cjs` extends `expo/metro-config` to resolve and transpile the TypeScript-source `@cap/shared` package; `babel.config.cjs` + `app.json` configure the runnable Expo app; `.env.example` documents the backend wiring vars.
- **Web app migrated to the shared domain** — `src/types/index.ts` re-exports the shared domain types (keeping only web content types local); `src/validation/intakeStepValidation.ts` delegates to the shared `validateIntakeStep` (passing `content.intakeForm.errors`, which matches the shared `ValidationMessages` contract) while keeping the web's own 4-step field map; `src/validation/documentValidation.ts` delegates to the shared `validateDocumentCandidates`/`DOCUMENT_CONFIG` and maps accepted candidates back to the original `File[]`. Wiring: root `package.json` depends on `@cap/shared` (`file:./packages/shared`), `vite.config.ts` aliases it in the app and frontend test project, and `tsconfig.app.json` maps it for TS. Also removed an unused import in `packages/shared/src/validation.ts` and excluded mobile package dirs from root ESLint.
- **Mobile service unit tests** — the mobile package now runs its own fast Vitest suite (`npm test` in `packages/mobile`) covering the pure, non-UI modules that carry contract risk: `resolveMobileServiceConfig` (env-driven mock/api + local/presigned selection with safe defaults), `StaticZipService` (known/missing/malformed ZIPs, whitespace, injected datasets), the `PresignedUploadService` two-step flow via an injected request layer (upload-url request shape, byte PUT, missing `uri`, 5xx/rejected POST/PUT handling, and the no-baseUrl guard that refuses to claim secure storage), `LocalDocumentUploadService`, and `generateIntakeId` UUIDv4 conformance for the backend's `Idempotency-Key` gate. Wire via `vitest.config.mts` (node env, `@cap/shared` aliased to its TS source, matching Metro resolution).
- **Note**: `apps/mobile` is a legacy Expo scaffold committed earlier (`4e5b0f0`) and is superseded by the real app at `packages/mobile`. It is left in place (removal is destructive and out of scope) but is excluded from root lint and flagged here for a future cleanup commit.

**Verified**
- `packages/shared`: `tsc --noEmit` clean (via `tsc -b` at the root, which now includes it).
- `packages/mobile`: `tsc --noEmit` clean (test files included); `npx vitest run` 19/19 green; `npx expo export --platform android` bundles successfully (870 modules) proving `@cap/shared` resolves and the whole module graph is valid (including the `expo-file-system` byte-upload path); web export bundles (542 modules).
- Web app migrated: `tsc -b` clean, `vitest run` 154/154 green (includes a new shared-adapter retry test for transient transport failures via the web re-export surface), `vite build` succeeds, `npm run lint` clean (excluding the self-contained mobile dirs).

### Next steps

1. **Wiring mobile to the real backend is config-driven, contract-aligned, and ready**: the shared submission adapter now posts the same form-encoded EveryAction body as the web app, the intake id is a backend-valid UUIDv4, `packages/mobile/.env.example` documents the `EXPO_PUBLIC_CAP_SUBMISSION_MODE` / `EXPO_PUBLIC_CAP_UPLOAD_MODE` / `EXPO_PUBLIC_CAP_API_BASE_URL` vars (mirroring the web app's `VITE_CAP_*` selection), and `PresignedUploadService` PUTs the picked file bytes via `expo-file-system`'s `File` class. To go live: set those vars, verify `POST /intakes` / `POST /intakes/:id/upload-url` against a running backend, then run on-device.
2. **Optional Phase 4 hardening**: persist a non-PHI session token in `expo-secure-store` if/when auth/session resumption is needed; today all intake data lives only in React state so nothing sensitive is written anywhere.
3. **QA on-device**: confirm no keyboard overlap across the contact/address step on both iPhone and Android, and that native document picking + the review/submit → success flow completes end-to-end.
4. **Mobile UI/component tests (future)**: the fast pure-logic suite covers the service/config/validation layer; UI step components (`zip`, `language`, `contact`, `documents`, `review`) are not yet rendered in a harness (would need `jest-expo`/`react-native-testing-library`).
5. **Cleanup (future)**: remove the stale `apps/mobile` scaffold after confirming nothing references it.