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
1. The EveryAction (CRM) contract is still outstanding; the API/Lambda + API
   Gateway production wiring is otherwise live, and the Lambda runtime role now
   has the scoped S3 + `logs:*` permissions (see the deployment-infrastructure
   section below).
2. Add Playwright E2E runner to the standard `npm test`/CI path so the presigned
   upload contract stays covered; currently it runs only via the explicit
   `npx playwright test` invocation against a running backend + frontend.
3. Confirm the CORS origin whitelist in production (`CAP_ALLOWED_ORIGINS`) to the
   exact static-host origin before release.
4. **Review the 4xx responses observed in the live API/API Gateway test runs
   against the public endpoint** (`https://ah0jz85mlj.execute-api.us-east-2.amazonaws.com`):
   - `POST /intakes` with a `{"zip":"10001"}` JSON body and **no**
     `Idempotency-Key` header returns `401 {"error":{"code":"session_expired","message":"This intake session has expired."}}`.
     This matches the intended session-id gate (`isValidIntakeId`, UUIDv4-only),
     but confirm it matches the documented intents:
     - A request with a valid `Idempotency-Key` returns `201 referenceId` (per the
       curl examples in the deployment-infrastructure section below) — verify the
       form-encoded EveryAction body path, not the JSON body path above.
     - `POST /intakes` with a missing/invalid session id returns `401 session_expired`
       — confirm this is the intended status code for a forged/stale session (vs a
       `422` for a present-but-invalid body, which is what a missing body or invalid
       form returns).
   - `PUT` to the presigned S3 URL now returns `200` with an ETag once the
     Lambda execution role gained `s3:PutObject` on the documents bucket (see
     deployment-infrastructure), confirming the earlier `403 AccessDenied` was
     purely the role-policy blocker and not an API logic defect. Status-code
     contract confirmed live: `201` on a valid idempotent submit, `200` on
     replay, `401 session_expired` on a missing/invalid session id, and `422`
     on a present-but-invalid body — no 4xx indicates a defect in the deployed
     handler.

## deployment-infrastructure — Windows-native AWS deployment

**Status:** A Windows-native deployment is implemented (`scripts/deploy/deploy-aws.ps1`
+ `scripts/deploy/package-api.ps1`) and the **static frontend is deployed live** to
the real S3 bucket `cap-frontend-590251390266-us-east-2-an` (build + sync + correct
cache headers verified against the account). The **API Gateway HTTP API is now LIVE**
the `cap-agent` user was granted `apigatewayv2:*`. The **Lambda function `cap-api`** is
deployed (nodejs20.x, CommonJS handler `handler.handler`, role `lambda-cap-role-1`,
`CAP_S3_ROLE_CREDENTIALS=1` + documents bucket env) and serves `/health`, `POST /intakes`
(idempotent), `POST /intakes/{id}/upload-url` (real S3 presigned URL), and CORS preflight
verified end-to-end through the public URL. The formerly-blocked runtime piece is now in
place: the Lambda execution role has `logs:*` plus the scoped `s3:PutObject` on the
documents bucket, so the browser `PUT` of document bytes to the presigned S3 URL returns
`200` and the object lands in the bucket.

**What is in the repo**
- `scripts/deploy/deploy-aws.ps1` — Windows-native analogue of `scripts/deploy-aws.sh`
  (the bash original is Unix-only and will not run on this Windows machine). Same CLI
  surface (`-Check`, `-DryRun`, `-Frontend`, `-Api`, `-Region`, `-FrontendBucket`,
  `-CloudFrontId`, `-ApiFunction`, `-ApiPackage`, `-FrontendDir`), plus a per-deployable
  IAM permission preflight so `-Check` reports exactly which layers are reachable
  (Lambda, execution role, API Gateway v1/v2, CloudFront, S3) and a guard that refuses
  a frontend `--delete` sync into the backend documents bucket.
- `scripts/deploy/package-api.ps1` — compiles the backend to **CommonJS**
  (`backend/tsconfig.lambda.json` → `backend/dist-lambda-cjs`) and zips a
  self-contained Lambda artifact to `dist-lambda/cap-api.zip`, handler `handler.handler`.
  The nodejs20.x runtime only loads a CJS `.js` handler: an ESM `.js` handler fails with
  `ERR_REQUIRE_ESM` and a `.mjs` handler fails with `Runtime.HandlerNotFound` (both
  verified live). The earlier `.mjs` shim was removed.
- `backend/src/handler.ts` — production Lambda entrypoint wiring
  `createApiDependencies(process.env)` into `createLambdaHandler` (handler name `handler.handler`).
- `backend/src/lambda.ts` — the API Gateway adapter now handles **both** proxy payload
  formats (v1 `httpMethod`/`path`/`identity.sourceIp` and v2
  `requestContext.http`/`rawPath`/`rawQueryString`), so it works with REST or the
  HTTP API's native payload 2.0.
- npm scripts: `build:api`, `build:api:lambda`, `deploy:check`, `deploy:frontend`,
  `deploy:api`, `deploy:package-api`.

**Verified working from this session (`cap-agent`, account 590251390266, us-east-2)**
- `deploy-aws.ps1 -Frontend`: builds the bundle and syncs it to the frontend bucket with
  the correct cache headers (`assets/*` immutable, `index.html` no-cache). The deployed
  files are present in S3 (confirmed via `aws s3 ls` + `head-object`).
- `package-api.ps1`: produces `dist-lambda/cap-api.zip` (CJS `handler.handler`).
- Public API Gateway endpoint `https://ah0jz85mlj.execute-api.us-east-2.amazonaws.com`:
  - `GET /health` → `200 {"status":"ok","service":"cap-api",...}`
  - `POST /intakes` (form body + `Idempotency-Key` UUID) → `201 {"referenceId":"CAP-XXXX-XXXX"}`,
    and idempotent replay returns the same reference id
  - `POST /intakes/{id}/upload-url` (JSON body) → `200 {"uploadUrl":"https://...s3.../intakes/.../documents/...?X-Amz-Signature=..."}`
  - **`PUT` to the presigned upload URL with real file bytes → `200` with an ETag**
    (the previous `403 AccessDenied` is gone): the object is confirmed in
    `cap1-casedocs-590251390266-us-east-2-an` under
    `intakes/{intakeId}/documents/{documentId}` with the `intakeid`/`documentid`
    metadata, `application/pdf` content type, and AES256 server-side encryption.
  - **CloudWatch** `/aws/lambda/cap-api` log group now exists (the Lambda role has
    `AWSLambdaBasicExecutionRole`); its events show the structured
    `intake-accepted`, `intake-replayed`, and `upload-url-issued` logs from these
    live runs.
  - `OPTIONS /health` (Origin `https://cohealthinitiative.org`) → `204` with
    `access-control-allow-origin` / `-methods` / `-headers` correct

**Next steps — hit the live API with `curl` from the local terminal**
The API (`https://ah0jz85mlj.execute-api.us-east-2.amazonaws.com`) and Lambda
(`cap-api`) are live, so you can exercise the public endpoint directly from a
local shell without the frontend. No secrets are required for the read/health
and submission calls (the API is public, no auth header). Use the examples below:

- **Health smoke check** (should return `200` `{"status":"ok","service":"cap-api",...}`):
  ```sh
  curl -i https://ah0jz85mlj.execute-api.us-east-2.amazonaws.com/health
  ```
- **Create an intake** (requires a fresh `Idempotency-Key` UUID; returns
  `201 {"referenceId":"CAP-XXXX-XXXX"}`; replaying the same key returns the same id):
  ```sh
  curl -i -X POST https://ah0jz85mlj.execute-api.us-east-2.amazonaws.com/intakes \
    -H "Idempotency-Key: $(uuidgen)" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "FirstName=Jane&LastName=Doe&EmailAddress=jane@example.com"
  ```
  (On Windows PowerShell replace `$(uuidgen)` with `[guid]::NewGuid().ToString()`
  in a `$key` variable and use `-H "Idempotency-Key: $key"`.)
- **Request an upload URL** for the reference id above (returns a real S3
  presigned PUT URL; used by the web/mobile adapters):
  ```sh
  curl -i -X POST https://ah0jz85mlj.execute-api.us-east-2.amazonaws.com/intakes/CAP-XXXX-XXXX/upload-url \
    -H "Content-Type: application/json" \
    -d "{\"filename\":\"scan.pdf\",\"contentType\":\"application/pdf\",\"size\":1234}"
  ```
- **Verify CORS preflight** for the production static origin:
  ```sh
  curl -i -X OPTIONS https://ah0jz85mlj.execute-api.us-east-2.amazonaws.com/health \
    -H "Origin: https://cohealthinitiative.org" \
    -H "Access-Control-Request-Method: POST"
  ```

Expected success path and the exact request/response shapes are documented in
`planning/deployment-infrastructure.md` and the `backend` smoke tests. **Note on
the upload flow:** the full path is now verified live — `upload-url` issues a real
S3 presigned URL, and the byte `PUT` to that URL returns `200` and lands the file
in the documents bucket. CloudWatch logging is flowing (`/aws/lambda/cap-api`), so
the curl examples above exercise the complete flow from start to finish.

**Live blockers (need an administrator)**
1. **CloudFront** — `cloudfront:CreateDistribution` blocked by **account verification**
   (AWS support must verify the account before adding distributions); the CDN layer is
   not yet provisioned. The OAC `cap-frontend-oac` must be recreated per
   `planning/deployment-infrastructure.md` once the account is verified. (The Lambda
   execution-role runtime permissions blocker is resolved: `lambda-cap-role-1` now has
   `AWSLambdaBasicExecutionRole` for `logs:*` and a scoped
   `s3:PutObject`/`s3:GetObject` policy on the documents bucket — verified by a live
   `200` byte `PUT` and CloudWatch log events.)

## react-native-app — mobile app implementation

Drives the [React Native plan](./react-native-app.md) for the CAP mobile app. Web app and API are already implemented; the byte-upload flow is verified against the live Lambda, and backend deployment is gated only on external dependencies that are not part of this handoff (CloudFront account verification, EveryAction/CRM contract).

### Status

The Expo mobile app and the shared domain contract are implemented and green. Both the web app and the mobile app now share the same domain types, validation rules, and service contracts through `packages/shared`. The mobile build is wired to the live CAP Lambda (`cap-api`): `packages/mobile/.env` sets `EXPO_PUBLIC_CAP_SUBMISSION_MODE=api`, `EXPO_PUBLIC_CAP_UPLOAD_MODE=presigned`, and `EXPO_PUBLIC_CAP_API_BASE_URL=https://ah0jz85mlj.execute-api.us-east-2.amazonaws.com` (gitignored; documented in `.env.example`), and the config resolver was fixed so the Expo bundler actually inlines those values (it previously read env through an aliased variable, which silently kept the prototype defaults in the built bundle). Submission and upload-url issuance were verified end-to-end against the live endpoint; the admin-applied Lambda S3 role policy is now in place (the byte PUT to the presigned URL returns `200` and lands in the bucket); remaining work is device QA and the CloudFront layer. The architecture is summarized in [../architecture/react-native.md](../architecture/react-native.md).

**Distribution decision (2026-09-05):** the org will not pay for the Apple Developer Program, so [planning/mobile-distribution.md](../planning/mobile-distribution.md) is now a **Google Play-first delivery plan** with the App Store deferred. All release blockers under this decision are Android: missing `packages/mobile/assets/`, no `eas.json`, no Play Console account, and on-device QA.

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
- **Native photo capture** — `packages/mobile` now includes `expo-image-picker` camera capture alongside document selection. `takePhoto()` handles permission denial and cancellation without breaking the intake, maps camera assets through the pure `pickedDocument.ts` mapper with safe filename/MIME/size fallbacks, and keeps the local URI in the transient URI registry. Bilingual camera labels and permission guidance are content-driven; iOS camera usage text and the Expo image-picker plugin are configured in `app.json`.
- **Mobile build wired to the live Lambda + env inlining fix**: `packages/mobile/.env` now sets `EXPO_PUBLIC_CAP_SUBMISSION_MODE=api`, `EXPO_PUBLIC_CAP_UPLOAD_MODE=presigned`, and `EXPO_PUBLIC_CAP_API_BASE_URL=https://ah0jz85mlj.execute-api.us-east-2.amazonaws.com` (public transport config only; gitignored like the web `.env.local`). `.env.example` documents the live values. Critical fix: `resolveMobileServiceConfig` read env through an aliased variable (`env['EXPO_PUBLIC_…']` with `env` defaulting to `process.env`), which the Expo bundler does NOT inline (`babel-preset-expo/build/inline-env-vars.js` only rewrites direct `process.env.EXPO_PUBLIC_*` MemberExpressions) — so a build with `.env` set still resolved the mock/local prototype. The resolver now reads direct `process.env.EXPO_PUBLIC_*` (kept as an injectable `env` argument for tests). Verified in the exported bundles: `expo export` logs `env: load .env` / `env: export EXPO_PUBLIC_CAP_SUBMISSION_MODE …`, the web JS bundle now contains `baseUrl: … ?? "https://ah0jz85mlj.execute-api.us-east-2.amazonaws.com"`, and no `EXPO_PUBLIC_CAP_*` value appears as a runtime `process.env` lookup. Live endpoint checks (2026-09-04) against the deployed API, using the exact wire shapes the mobile adapters produce: `POST /intakes` with a UUIDv4 `Idempotency-Key` + URL-encoded EveryAction body → `201 {"referenceId":"CAP-054C-4D56"}`, idempotent replay with the same key → `200` with the same reference id, and `POST /intakes/:id/upload-url` with `{"fileName","contentType","size"}` JSON → `200` with a real S3 presigned URL.
- **Mobile build verified ready for the real S3 upload path (this round)**: after the Lambda execution role gained the scoped `s3:PutObject`, a live conformance run replayed the exact mobile request shapes against the public API: UUIDv4-submission → `201` + `CAP-XXXX-XXXX` (replay `200` same id), `POST /intakes/:id/upload-url` → `200` with a real S3 presigned URL, and the byte `PUT` with the matching `Content-Type` → `200` with an ETag (the object lands in `cap1-casedocs-...-an` under `intakes/{id}/documents/{documentId}`) — the same two-step flow `PresignedUploadService` performs on device. Hardening to match that verified behavior: the adapter now treats a byte body as mandatory — if the native byte transport (`expo-file-system`'s `File`) cannot produce file bytes it throws `DocumentUploadError` instead of silently sending an empty PUT (the empty-object handoff S3/local sink both reject). The file-body factory is now injectable for tests so the byte path is covered in the node suite; new regression test asserts the PUT always carries a non-empty body plus the signed `Content-Type` header. Re-verified via `expo export --platform web` that `.env` loads and the bundle inlines `baseUrl` to the live Lambda URL and upload mode to `presigned`. `packages/mobile/.env.example` updated to document the resolved S3 path (removed the stale "blocked by role policy" note).
- **Note**: `apps/mobile` is a legacy Expo scaffold committed earlier (`4e5b0f0`) and is superseded by the real app at `packages/mobile`. It is left in place (removal is destructive and out of scope) but is excluded from root lint and flagged here for a future cleanup commit.

**Verified**
- `packages/shared`: `tsc --noEmit` clean (via `tsc -b` at the root, which now includes it).
- `packages/mobile`: `tsc --noEmit` clean (test files included); `npx vitest run` 27/27 green; `npx expo export --platform android` bundles successfully (874 modules) proving `@cap/shared` and the native document/camera module graph resolve (including the `expo-file-system` byte-upload path); web export bundles (547 modules). The exported bundles inline the live Lambda config (`baseUrl` resolves to `https://ah0jz85mlj.execute-api.us-east-2.amazonaws.com`; `submissionMode` resolves to `api`, `uploadMode` to `presigned`).
- Web app migrated: `tsc -b` clean, `vitest run` 154/154 green (includes a new shared-adapter retry test for transient transport failures via the web re-export surface), `vite build` succeeds, `npm run lint` clean (excluding the self-contained mobile dirs).

### Next steps

1. ~~**Wiring mobile to the real backend is config-driven, contract-aligned, and ready**~~ — DONE: the mobile build now points at the live Lambda via `packages/mobile/.env` (gitignored) and the resolver inlines `EXPO_PUBLIC_CAP_*` at build time; `POST /intakes` and `POST /intakes/:id/upload-url` were verified end-to-end against the live API with mobile-shaped requests (see the completed bullet above). The byte PUT to S3 is also verified now that the Lambda execution role has the scoped `s3:PutObject` policy.
1. **QA on-device**: confirm no keyboard overlap across the contact/address step on Android (iOS only if the deferred Apple path is later funded), and that native document picking + the review/submit → success flow completes end-to-end (submission now goes to the real Lambda).
1. **Cleanup**: remove the stale `apps/mobile` scaffold after confirming nothing references it.
1. **Google Play distribution** (per the updated `planning/mobile-distribution.md`): external first — create the Play Console org account ($25 one-time, no D‑U‑N‑S) and the Expo project (`eas init`). In-repo: add production assets under `packages/mobile/assets/` (icon/splash/adaptive-icon — `app.json` currently references files that do not exist), create `packages/mobile/eas.json` (development/preview/production profiles; Play service account JSON into EAS credentials, never committed), modernize the Expo SDK so the Android target API satisfies Play's current requirement, then run the Section 4.5 verification commands before an EAS `preview` Android build and the QA list.

### BLOCKED (external resources)

- **Document byte PUT to S3**: RESOLVED — `POST /intakes/:id/upload-url` issues a real presigned URL (verified `200`) and the Lambda execution role (`lambda-cap-role-1`) now has the scoped `s3:PutObject` on the documents bucket, so the mobile/web PUT of file bytes returns `200` and the object lands in S3 (verified live 2026-09-04 against the public endpoint).
- **On-device QA** (handoff item 2): requires an iPhone/Android device or emulator for keyboard safe-area, document-picking, and end-to-end submission testing — not available in this environment.
