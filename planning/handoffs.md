# Handoffs
This is the current implementation handoff for the CAP project. It reflects the verified state of the repo and the remaining work needed before the project is ready for final integration. Each section below is for a particular agent to read from.

### API implementation — file storage / presigned upload flow

**Status:** The local presigned-upload flow is wired end-to-end. Selecting a
document in the web app now issues real network traffic to the backend to obtain
a presigned URL, then PUTs the file bytes directly to that URL.

**What was fixed/verified this round**
- Root cause of "no network traffic on upload": the frontend defaulted to the
  in-memory `LocalDocumentUploadService` because the Vite env vars
  (`VITE_CAP_UPLOAD_MODE=s3`, `VITE_CAP_API_BASE_URL`) were not configured. A
  gitignored `.env.local` now enables the `PresignedS3DocumentUploadService`
  against the running backend.
- The backend HTTP server emitted no CORS headers, so cross-origin calls from
  the browser (localhost:5173 → localhost:8787) would have been blocked.
  Added shared CORS handling (`backend/src/cors.ts`) wired into the route
  dispatcher (`backend/src/api.ts`) so both the local Node server and the Lambda
  adapter answer preflights and emit scoped `Access-Control-Allow-*` headers.
- New `CAP_ALLOWED_ORIGINS` config (defaults to localhost dev origins plus
  `https://cohealthinitiative.org`).
- Added `tests/documentUpload.spec.ts` — a Playwright E2E test that drives the
  intake flow to the documents step, selects a file, and asserts the
  `POST /intakes/:id/upload-url` request and the subsequent PUT to the presigned
  URL. Passes against the running backend.
- Left on `.env.local` only upload mode (not `VITE_CAP_SUBMISSION_MODE=api`);
  enabling submission mode would break existing unit tests that rely on the
  in-memory mock. The upload endpoint does not require the intake to exist first.

**Verified:** vitest 149/149 (95 frontend + 54 backend incl. 5 new CORS tests),
`tsc --noEmit` clean, `vite build` clean, ESLint clean on touched files, and the
Playwright E2E upload test passes.

**Next steps**
1. Deployment of the real backend remains blocked on external dependencies
   (AWS credentials for provisioning, and the CRM contract). AWS account
   details live in `.env`/`env.example`. The production S3 presigner
   (`backend/src/presigner/s3Presigner.ts`) is scaffolded and activates when
   `S3_BUCKET_NAME`, `AWS_REGION`, and `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`
   are present — needs a deployed S3 bucket + API Gateway/Lambda before use.
2. Add Playwright E2E runner to the standard `npm test`/CI path so the presigned
   upload contract stays covered; currently it runs only via the explicit
   `npx playwright test` invocation against a running backend + frontend.
3. Optional: add `VITE_CAP_SUBMISSION_MODE=api` support behind a separate
   .env/test seam once existing iteration can accept test isolation, to exercise
   the full submit → presigned-upload journey from the browser.
4. Confirm the CORS origin whitelist in production (`CAP_ALLOWED_ORIGINS`) to the
   exact static-host origin before release.

## react-native-app — mobile app implementation

Drives the [React Native plan](./react-native-app.md) for the CAP mobile app. Web app and API are already implemented; backend deployment steps in master.md remain blocked on external dependencies (AWS credentials, CRM contract) and are not part of this handoff.

### Next steps

1. **Phase 1: mobile foundation**
   - Initialize `apps/mobile` as an Expo + React Native + TypeScript app (Node 20 available).
   - Configure project scripts, TypeScript, and Expo entry.
   - Add app theme and CAP/CCHI brand tokens (primary #01599a, secondary #7aabdb, highlight #fec524; Inter typeface; 44pt touch targets).
   - Create the app shell, navigation (React Navigation), and mobile layout system.
   - Acceptance: `apps/mobile` shows the app shell on first launch; theme tokens render; no web-only imports leak in.

2. **Phase 2: shared domain contract**
   - Create `packages/shared` housing the domain model now in `src/types/index.ts`: `Language`, `IntakeFormValues`, `IntakeDocument`, `SubmissionErrorKind`, `IntakeSubmissionResult`, service interfaces (`SubmissionService`, `DocumentUploadService`, `ZipService`), and validation rules.
   - Wire the web app to consume `packages/shared` (path alias without breaking the existing build/tests).
   - Acceptance: web build/tests stay green; web and mobile import the same domain types and validation rules.

3. **Phase 3: native intake screens**
   - Stepper-based flow mirroring the web app: home/how-we-help, intake landing, then ZIP → language → contact → documents → review → submit → success.
   - Large tap targets, full-width fields, sticky action footer, accessible focus order, semantic labels.
   - Acceptance: full intake completes on mobile without keyboard overlap.

4. **Phase 4: document handling**
   - Native file selection and photo capture, metadata stored locally (SecureStore), upload only after review, no sensitive data in logs or URLs.

5. **Phase 5: backend integration**
   - Connect mobile to the same API contract as the web app (HTTPS only), with retry, network-error, and session-expired handling.

6. **Phase 6: security + accessibility**
   - WCAG 2.2 AA patterns: accessible labels, visible focus, 44pt targets, field-tied errors, contrast, success/error states, secure storage, no PHI in analytics/logs/URLs.