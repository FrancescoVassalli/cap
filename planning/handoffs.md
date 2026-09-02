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
cache headers verified against the account). The **Lambda function `cap-api` now exists
in the account** and is configured (nodejs20.x, handler `handler.mjs.handler`, role
`lambda-cap-role-1`, `CAP_S3_ROLE_CREDENTIALS=1` + documents bucket env). The remaining
gaps to a live API are: (1) the **execution role lacks runtime `logs:*`/`s3:*`**
(so the function cannot log to CloudWatch or presign uploads yet), and (2) **API Gateway
is still DENIED to `cap-agent`**, so no public HTTPS endpoint exists. Exact commands to
get API Gateway live are in "Next steps" below.

**What is in the repo**
- `scripts/deploy/deploy-aws.ps1` — Windows-native analogue of `scripts/deploy-aws.sh`
  (the bash original is Unix-only and will not run on this Windows machine). Same CLI
  surface (`-Check`, `-DryRun`, `-Frontend`, `-Api`, `-Region`, `-FrontendBucket`,
  `-CloudFrontId`, `-ApiFunction`, `-ApiPackage`, `-FrontendDir`), plus a per-deployable
  IAM permission preflight so `-Check` reports exactly which layers are reachable
  (Lambda, execution role, API Gateway v1/v2, CloudFront, S3) and a guard that refuses
  a frontend `--delete` sync into the backend documents bucket.
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

**Re-verified on 2026-09-02 (live `cap-agent` session, account 590251390266, us-east-2): the Lambda function now EXISTS and the execution-role gate is UNBLOCKED.** The admin added the role ARN to `.env` as `CAP_LAMBDA_ROLE_ARN`, and `deploy-aws.ps1 -Api` created the function. Live probes confirm:
- Lambda function `cap-api` **exists** — runtime `nodejs20.x`, handler `handler.mjs.handler`, timeout 30s, memory 128, last modified 2026-09-02.
- Lambda environment is correctly configured: `CAP_S3_ROLE_CREDENTIALS=1` (role-based S3), `S3_BUCKET_NAME=cap1-casedocs-590251390266-us-east-2-an`, `S3_UPLOAD_PREFIX=ugc1`.
- Execution role `lambda-cap-role-1` **exists** with the correct `lambda.amazonaws.com` trust policy and is attached to the function — the `API (execution role)` gate in `deploy-aws.ps1 -Check` will now report OK.
- **NEW BLOCKER (runtime): the execution role `lambda-cap-role-1` is missing runtime permissions.** Its only inline policy (`lambda-cap-role-1Policy`) grants **deploy-lifecycle** actions only (`lambda:CreateFunction`, `lambda:UpdateFunctionCode`, `lambda:GetFunction`, `lambda:ListFunctions`). It has **no `logs:*`** and **no `s3:*`**. Consequences verified against the account: no CloudWatch log group `/aws/lambda/cap-api` exists (the function has never been able to write logs), and the S3 presigner (which uses role credentials via `CAP_S3_ROLE_CREDENTIALS=1`) would fail to presign because the role cannot call S3. The function is provisioned but **not yet runtime-functional** until the role is repaired.
- API Gateway is **still fully DENIED — this is the remaining deployment blocker.** `apigateway:GET` is denied on both `get-rest-apis` (v1) and `apigatewayv2:get-apis` (`AccessDeniedException`, no identity-based policy allows `apigateway:GET`). No API Gateway API exists and none can be created by this session, so there is **no public HTTPS endpoint** yet.
- CloudFront: `cloudfront:ListDistributions`/`ListCloudFrontOriginAccessIdentities` are allowed, but the account has **zero distributions**, and the OAC `cap-frontend-oac` (`E1EMZ30G5M3VFD`) recorded earlier **no longer exists** — the CDN layer has not been provisioned.
- S3 is unaffected: both buckets (`cap-frontend-590251390266-us-east-2-an`, `cap1-casedocs-590251390266-us-east-2-an`) are present. (Note: the `.env` `S3_BUCKET_NAME` resolves to the **documents** bucket `cap1-casedocs-…`; keep `CAP_FRONTEND_BUCKET` set to the static-host bucket for frontend deploys.)

**Deploy tooling upgraded this round (2026-09-01)**
- `deploy-aws.ps1 -Check` now probes the real deployment gates instead of stopping at `lambda:ListFunctions`: it reports Lambda reachability, the **execution-role gate** (whether `CAP_LAMBDA_ROLE_ARN` is set and verified via `iam:GetRole`), **API Gateway access** (v1/v2 read probe), **CloudFront distribution presence**, and S3 bucket access. This means an admin can re-run `-Check` after each policy change and immediately see which layer opened up.
- `deploy-aws.ps1 -Api` now supports the full **create-or-update** Lambda lifecycle: if `$ApiFunction` already exists it runs `update-function-code`, otherwise it runs `create-function` (runtime `nodejs20.x`, handler `handler.handler`) using `CAP_LAMBDA_ROLE_ARN` and refuses the create path when the ARN is missing. Verified in `-DryRun` for both the role-set and role-missing cases.
- `deploy-aws.ps1` now **refuses to sync the frontend (`--delete`) into a bucket resolved from `S3_BUCKET_NAME`** unless an explicit `-FrontendBucket`/`CAP_FRONTEND_BUCKET` is given — the fallback points at the backend documents bucket (`cap1-casedocs-…`), and a bare `-Frontend` run could have wiped case documents. Set `CAP_FRONTEND_BUCKET=cap-frontend-590251390266-us-east-2-an` in the deploy environment.
- Note: `planning/deployment-infrastructure.md` (referenced for the CloudFront distribution config/OAC rollout) does not exist in the repo — recreate it with the distribution config when CloudFront is unblocked, so `CAP_CLOUDFRONT_DISTRIBUTION_ID`/OAC setup has a single source of truth.

**Blockers needing an administrator (verified 2026-09-02 against the live account)**
- **API Gateway is the sole remaining deployment blocker** for going live: `apigateway:*` is
  **denied** to `cap-agent` (verified: `apigateway:GET` → `AccessDeniedException` on both v1
  `get-rest-apis` and v2 `get-apis`). No HTTP API exists and none can be created by this
  session. Grant `apigatewayv2:*` (HTTP API) — or REST `apigateway:*` — to create the public
  HTTPS endpoint.
- **Lambda runtime role is misconfigured (must fix before the endpoint is functional):** the
  execution role `lambda-cap-role-1` has only a deploy-lifecycle inline policy and **lacks
  `logs:*` and `s3:*`**. Attach `AWSLambdaBasicExecutionRole` (for CloudWatch) and grant
  `s3:PutObject`/`s3:GetObject` (scoped to `arn:aws:s3:::cap1-casedocs-590251390266-us-east-2-an*`
  — the `GetObject` covers the presigned-URL GET paths) to the role, or replace the inline
  policy with one that carries the runtime permissions. Until this is done the Lambda can
  neither write CloudWatch logs (`describe-log-groups` for `/aws/lambda/cap-api` returns `[]`)
  nor presign uploads via its execution-role credentials.
- CloudFront: `cloudfront:CreateDistribution` is blocked by **account verification** (AWS
  support must verify the account before adding new distributions). The earlier OAC
  `cap-frontend-oac` (`E1EMZ30G5M3VFD`) is no longer present in the account; recreate it per
  the distribution config/rollout note to be re-created in `planning/deployment-infrastructure.md`
  once the account is verified.

**Next steps — getting the API Gateway live**
1. **Repair the Lambda execution role first** (so the endpoint is actually functional):
   attach `AWSLambdaBasicExecutionRole` and an S3 policy to `lambda-cap-role-1`, or update
   its inline policy to add `logs:*` + scoped `s3:PutObject`/`s3:GetObject`. Then re-run
   `deploy-aws.ps1 -Check`; the `API (execution role)` line should read OK.
2. **Grant the `cap-agent` IAM user `apigatewayv2:*`** (HTTP API v2; or REST `apigateway:*`).
   This is the step that actually unblocks the public endpoint. Re-run `deploy-aws.ps1 -Check`
   and confirm the `API (API Gateway)` line flips from `BLOCKED` to `OK`.
3. **Create the HTTP API (v2) and route it to `cap-api`:**
   - `aws apigatewayv2 create-api --name cap-api-http --protocol-type HTTP`
   - add a stage (`$default` or a named stage) via `create-stage`
   - add a route `ANY /{proxy+}` (and the root `/`) with `create-route`
   - create an integration targeting the `cap-api` Lambda ARN
     (`arn:aws:lambda:us-east-2:590251390266:function:cap-api`) with
     `payload-format-version=2.0` (the `handler.mjs.handler` payload shape), and attach it.
   - `aws apigatewayv2 create-deployment` and note the invoke URL
     (`create-api` returns `ApiEndpoint` → `https://<api-id>.execute-api.<region>.amazonaws.com`).
4. **Grant Lambda permission to be invoked by API Gateway:** add a resource-based policy to
   the function (or rely on the API Gateway v2 `create-integration` permission model) so
   API Gateway can `lambda:InvokeFunction` on `cap-api` (the `lambda:AddPermission` call
   from the AWS CLI is the standard way: source-arn `arn:aws:execute-api:...`).
5. **Point the frontend at the live API:** set `VITE_CAP_API_BASE_URL` /
   `CAP_API_BASE_URL` to the API Gateway invoke URL and confirm `CAP_ALLOWED_ORIGINS`
   includes the exact static-host origin before release.
6. **Smoke test through the public URL:** `GET /health` → `200 {"status":"ok"}`, then the
   intake submit (`POST /intakes`) and presigned upload (`POST /intakes/:id/upload-url`) flows.
7. Set `CAP_FRONTEND_BUCKET=cap-frontend-590251390266-us-east-2-an` in the deploy environment
   so frontend deploys target the static-host bucket (the documents-bucket guard makes this
   mandatory for a non-`-DryRun` `-Frontend` run); CloudFront rollout remains separate per the
   account-verification note above.

## react-native-app — mobile app implementation

Drives the [React Native plan](./react-native-app.md) for the CAP mobile app. Web app and API are already implemented; backend deployment steps in master.md remain blocked on external dependencies (AWS credentials, CRM contract) and are not part of this handoff.

### Status

The Expo mobile app and the shared domain contract are implemented and green. Both the web app and the mobile app now share the same domain types, validation rules, and service contracts through `packages/shared`. Mobile backend wiring is config-driven (`EXPO_PUBLIC_CAP_*`, mirroring the web's `VITE_CAP_*`), with a byte-PUT presigned upload adapter ready to attach to the live API. The architecture is summarized in [../architecture/react-native.md](../architecture/react-native.md). Work is paused pending external backend/device validation.

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
- **Note**: `apps/mobile` is a legacy Expo scaffold committed earlier (`4e5b0f0`) and is superseded by the real app at `packages/mobile`. It is left in place (removal is destructive and out of scope) but is excluded from root lint and flagged here for a future cleanup commit.

**Verified**
- `packages/shared`: `tsc --noEmit` clean (via `tsc -b` at the root, which now includes it).
- `packages/mobile`: `tsc --noEmit` clean (test files included); `npx vitest run` 26/26 green; `npx expo export --platform android` bundles successfully (873 modules) proving `@cap/shared` and the native document/camera module graph resolve (including the `expo-file-system` byte-upload path); web export bundles (542 modules).
- Web app migrated: `tsc -b` clean, `vitest run` 154/154 green (includes a new shared-adapter retry test for transient transport failures via the web re-export surface), `vite build` succeeds, `npm run lint` clean (excluding the self-contained mobile dirs).

### Next steps

1. **Wiring mobile to the real backend is config-driven, contract-aligned, and ready**: the shared submission adapter now posts the same form-encoded EveryAction body as the web app, the intake id is a backend-valid UUIDv4, `packages/mobile/.env.example` documents the `EXPO_PUBLIC_CAP_SUBMISSION_MODE` / `EXPO_PUBLIC_CAP_UPLOAD_MODE` / `EXPO_PUBLIC_CAP_API_BASE_URL` vars (mirroring the web app's `VITE_CAP_*` selection), and `PresignedUploadService` PUTs the picked file bytes via `expo-file-system`'s `File` class. To go live: set those vars, verify `POST /intakes` / `POST /intakes/:id/upload-url` against a running backend, then run on-device.
2. **Optional Phase 4 hardening**: persist a non-PHI session token in `expo-secure-store` if/when auth/session resumption is needed; today all intake data lives only in React state so nothing sensitive is written anywhere.
3. **QA on-device**: confirm no keyboard overlap across the contact/address step on both iPhone and Android, and that native document picking + the review/submit → success flow completes end-to-end.
4. **Mobile UI/component tests (future)**: the fast pure-logic suite covers the service/config/validation, picker mapping, and adapter layers; UI step components (`zip`, `language`, `contact`, `documents`, `review`) are not yet rendered in a harness (would need `jest-expo`/`react-native-testing-library`).
5. **Cleanup (future)**: remove the stale `apps/mobile` scaffold after confirming nothing references it.

### BLOCKED (external resources)

- **Live backend wiring** (handoff item 1): verifying `POST /intakes` / `POST /intakes/:id/upload-url` against a running CAP backend requires the deployed Lambda/API URL, AWS credentials, and a live EveryAction/CRM contract — none available in this environment. All config/env/mapper/upload code is in place and contract-verified against `backend/src/handlers/createIntake.ts`; this step is set-Env-and-run-on-device.
- **QA on-device** (handoff item 3): requires an iPhone/Android device or emulator for keyboard-safe-area, document-picking, and end-to-end submission testing — not available here.
