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

The Expo mobile app and the shared domain contract are implemented and green. Both the web app and the mobile app now share the same domain types, validation rules, and service contracts through `packages/shared`.

**What was completed this round**
- **`packages/shared`** — new package housing the domain model formerly in `src/types/index.ts`: `Language`, `IntakeFormValues`, `IntakeDocument`, `ZipLocation`, `SubmissionErrorKind`, `IntakeSubmissionResult`, `SubmissionPayload`, the service interfaces (`SubmissionService`, `ZipService`, `DocumentUploadService`), transport-neutral step validation (`validateIntakeStep`, `INTAKE_STEP_FIELDS`, `DOCUMENT_CONFIG`, `validateDocumentCandidates`), and the `MockSubmissionService` / `ApiSubmissionService` adapters. `packages/shared/tsconfig.json` typechecks clean.
- **`packages/mobile`** — an Expo SDK 51 + React Native 0.74 + TypeScript + React Navigation + Formik/Yup app (the repo layout uses `packages/mobile`, per the plan's `apps/mobile`-style package boundary):
  - **Theme + brand tokens** (`src/theme/index.ts`) mirroring the web CSS tokens (#1f4e79 primary, #2b6cb0 secondary, #fec524 highlight, 44pt touch targets, semantic colors) with no web-only imports.
  - **Bilingual content modules** (`src/content/index.ts`) extracting the approved EN/ES copy into typed `MobileContent`, with live EN/ES switching via `src/context/ContentContext.tsx`.
  - **App shell + stack navigation** (`App.tsx`, `src/navigation/types.ts`) wiring Home → IntakeLanding → Intake.
  - **Screens** (`src/screens/HomeScreen.tsx`, `IntakeLandingScreen.tsx`, `IntakeScreen.tsx`, `SubmissionScreen.tsx`) mirroring the web `/how-we-help` → `/intake` → `/intake/:id` flow.
  - **Step-based intake** (`src/components/intake/{ZipStep,LanguageStep,ContactStep,DocumentsStep,ReviewStep}.tsx` + `StepShell`/`StepProgress`/`StepBody`) covering ZIP lookup (with optional autofill + not-found notice), language, contact/address, native document selection, review-with-edit, and submit. Validation is authoritative per active step via the shared rules; field errors are tied to each control for screen readers.
  - **Service adapters** behind the shared contracts (`src/services/index.ts`, `zip.ts`, `documentUpload.ts`, `documentPicker.ts`) with the mobile `StaticZipService` (tiny embedded CO dataset) and a local UI-only upload adapter; the submission API adapter reuses the shared `ApiSubmissionService`.
  - **Security/accessibility**: no PHI logged or put in URLs/query strings (bodies only); documents stored as metadata in React state only (no persistence — stronger than SecureStore for the no-PHI-at-rest requirement); 44pt+ touch targets, accessible labels/hints, `accessibilityRole`/`accessibilityState`, `accessibilityLiveRegion` progress, and WCAG 2.2 AA error association.
  - `metro.config.cjs` extends `expo/metro-config` to resolve and transpile the TypeScript-source `@cap/shared` package; `babel.config.cjs` + `app.json` configure the runnable Expo app.

**Verified**
- `packages/shared`: `tsc --noEmit` clean.
- `packages/mobile`: `tsc --noEmit` clean; `npx expo export --platform android` bundles successfully (862 modules, ~1.95 MB) proving `@cap/shared` resolves and the whole module graph is valid.
- Web app unchanged: `tsc -b` clean and `vitest run` 153/153 green (the shared package is additive; the web app still owns its own `src/types` and was not migrated in this round).

### Next steps

1. **Migrate the web app to consume `packages/shared`** (path alias) so both platforms import the *same* domain types and validation code, then re-run the web build/tests — the shared contract already matches `src/types` and the web validation rules exactly, so wiring it in is config-only.
2. **Wire mobile to the real backend** (Phase 5): set the mobile submission base URL and enable `ApiSubmissionService` + the presigned upload adapter against the same `POST /intakes` / `POST /intakes/:id/upload-url` contract as the web app (HTTPS-only), with retry/session-expired handling already present in `SubmissionScreen`.
3. **Optional Phase 4 hardening**: persist a non-PHI session token in `expo-secure-store` if/when auth/session resumption is needed; today all intake data lives only in React state so nothing sensitive is written anywhere.
4. **QA on-device**: confirm no keyboard overlap across the contact/address step on both iPhone and Android, and that native document picking + the review/submit → success flow completes end-to-end.