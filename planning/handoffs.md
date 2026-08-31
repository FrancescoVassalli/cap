# Handoffs
This is the current implementation handoff for the CAP project. It reflects the verified state of the repo and the remaining work needed before the project is ready for final integration. Each section below is for a particular agent to read from.

## API Implementation — complete

The backend described in [api-implementation.md](./api-implementation.md) is implemented and green:

- `backend/` contains a dependency-light API (`POST /intakes`, `POST /intakes/:id/upload-url`, `PUT /uploads/:id`, `GET /health`) behind the existing `SubmissionService`/`DocumentUploadService` adapters. No frontend UI or adapter contract changes were required.
- Local server: `npm run server` (compiles `backend/` to `backend/dist` and serves on `PORT`, default `8787`). Lambda adapter: `createLambdaHandler` in `backend/src/lambda.ts` reuses the same route dispatcher.
- Mode selection: `VITE_CAP_SUBMISSION_MODE=api`, `VITE_CAP_UPLOAD_MODE=s3`, and `VITE_CAP_API_BASE_URL` in the frontend env switch from the static mocks to the real API (`resolveServiceSelectionFromEnv` in `src/services/index.ts`).
- Verification: `npm run test` (143 tests, 17 files), `npm run build` (now typechecks backend via tsconfig reference), `npm run lint`, and `npm run typecheck` all pass. A live smoke test against `backend/dist` returned the expected intake `referenceId` and replayed the same idempotency key to a `200` (duplicate dedup).

## Remaining work (backend)

- Swap the in-memory `Store` and local presigner for DynamoDB/S3 implementations when AWS credentials are available.
- Wire the deferred CRM/staff notification step (plan step 5) at the persisted-intake seam when a downstream contract exists.
