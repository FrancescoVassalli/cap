## Plan: CAP API Integration

TL;DR: Add a small production API behind the existing service boundary so the frontend can continue using the `SubmissionService` and `DocumentUploadService` abstractions without UI changes. The backend should support a real intake submission endpoint, presigned document uploads, and a local mock mode for frontend development. Keep the API stateless, HTTPS-only, and idempotent so it can safely receive sensitive intake data from a static React app hosted on S3.

### Steps
1. Define the API contract and deployment model
   - Confirm the frontend can select the runtime mode via environment variables such as `VITE_CAP_SUBMISSION_MODE`, `VITE_CAP_UPLOAD_MODE`, and `VITE_CAP_API_BASE_URL`.
   - Use the existing adapter pattern in [src/services/submissionService.ts](src/services/submissionService.ts) and [src/services/documentUploadService.ts](src/services/documentUploadService.ts) as the contract boundary.
   - Keep the public contract shaped around the current app payload: `intakeId`, language, demographics, address, and optional documents metadata.
   - Dependencies: none; this is the foundation for all downstream work.

2. Build a small backend skeleton for the real system
   - Use a serverless AWS pattern for the first production version: API Gateway + Lambda functions, S3 for uploaded docs, and a lightweight database/table for intake records.
   - Separate responsibilities by route: `POST /intakes`, `POST /intakes/:id/documents`, and optional `GET /health`.
   - Include structured JSON responses for success, validation errors, retryable network failures, and auth/session expiry.
   - Dependencies: step 1 contract and the deployment decision.

3. Implement the intake submission endpoint
   - Accept the normalized payload from the frontend and validate required fields before saving.
   - Use the intake ID as the idempotency key to prevent duplicate submissions from double-clicks or retries.
   - Persist intake metadata, a reference number, and the source channel (web intake) in a durable store.
   - Return a canonical success response with `referenceId` and a user-safe message, plus field-level validation errors when data is rejected.
   - Dependencies: step 2 backend skeleton; parallel with step 4 for document flow design.

4. Implement secure document upload flow
   - Do not upload documents directly from the browser to the app’s main API. Instead, generate a presigned S3 URL from the backend and let the browser upload the file directly to S3.
   - Enforce file type, file size, and anti-abuse limits before issuing the presigned URL.
   - Persist document metadata, storage object key, and status in the intake record. Keep file names and MIME types sanitized.
   - Use the existing `PresignedS3DocumentUploadService` adapter shape as the production contract.
   - Dependencies: step 2 skeleton; parallel with step 3.

5. Add CRM and staff notification integration
   - Once the intake is stored, trigger the downstream workflow that alerts staff or hands the intake to the CRM process.
   - Keep the integration asynchronous where possible so the website submission returns quickly and the intake is not blocked by downstream provider lag.
   - Include an audit trail for what was received, when it was accepted, and which downstream notification was triggered.
   - Dependencies: steps 3 and 4.

6. Add the local mock/development path
   - Keep the current mock mode as the default for the static prototype so frontend work remains isolated from backend availability.
   - Add a lightweight mock API for local development that mimics the same response contract and validation behavior expected by `ApiSubmissionService`.
   - This is especially important for feature work that should proceed without a live backend or AWS environment.
   - Dependencies: step 1 contract and the adapter pattern already in place.

7. Harden security and privacy controls
   - Require HTTPS only and keep all sensitive data out of URL query strings.
   - Avoid logging raw PHI or document contents; log only safe identifiers and error categories.
   - Segregate storage, access, and admin workflows; keep AWS credentials and service secrets in environment-managed secrets, not in the frontend bundle.
   - Use rate limiting and basic abuse protections on the public API entry points.
   - Dependencies: steps 2–5.

8. Add verification and rollout checks
   - Verify the frontend still passes the current test/build commands: `npm run test`, `npm run build`, `npm run lint`, and `npm run typecheck`.
   - Add API-level tests for success, validation failure, duplicate submission, network failure, and expired-session handling.
   - Run an end-to-end test using the mock mode and a staging deployment using the real API mode before production release.
   - Dependencies: all previous steps.

### Relevant files and architecture touchpoints
- [src/services/submissionService.ts](src/services/submissionService.ts) — real API adapter shape, DDoS-safe request/response mapping, idempotency contract.
- [src/services/documentUploadService.ts](src/services/documentUploadService.ts) — presigned upload contract and client-side adapter behavior.
- [src/services/index.ts](src/services/index.ts) — runtime selection of mock vs email vs API adapters.
- [src/hooks/useIntakeSubmission.ts](src/hooks/useIntakeSubmission.ts) — current lifecycle handling for idle/loading/success/error states.
- [src/types/index.ts](src/types/index.ts) — typed backend-facing response contracts and error categories.
- [src/data/zipCodes.json](src/data/zipCodes.json) — example of dataset-backed front-end lookups; can be mirrored for backend validation if needed.

### Decision points
- Prefer a serverless AWS Lambda API for the first production version because the frontend is static and the intake process is not CPU-heavy.
- Keep the frontend contract stable and the backend implementation separate; the UI should not know whether it is talking to a mock, an email adapter, or a real API.
- Exclude direct client-to-CRM access. Use a controlled API layer between the browser and the downstream system.
- Use mock mode for local and CI testing, and real mode only in staging/production.

### Verification
1. Run the existing frontend verification suite and confirm it remains green after backend integration work.
2. Add contract tests on the submission and upload adapters to verify the request/response mapping matches the backend contract.
3. Validate the whole flow in staging with a real API URL, presigned upload, and sample intake submission.
4. Confirm privacy and logging requirements are satisfied before release.

### Further considerations
2. Confirm the exact downstream CRM/email requirements before wiring in the final integration so the intake record schema and notification payload stay aligned.
3. Decide on the minimal retention policy for uploaded documents and stored intake metadata to match legal and HIPAA-aware handling requirements.
