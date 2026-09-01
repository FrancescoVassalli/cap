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

**Next steps**
1. Production deployment of the backend is the remaining external step: provision
   API Gateway/Lambda/CloudFront in front of the same handlers (the S3 bucket
   itself exists and the presigned flow is confirmed working). The every-action
   (CRM) contract is still outstanding.
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