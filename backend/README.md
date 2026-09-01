# CAP API

A small, dependency-light backend behind the existing frontend service boundary.
It satisfies the exact contract the `ApiSubmissionService` and
`PresignedS3DocumentUploadService` adapters expect, without any UI changes.

The implementation uses only Node built-ins plus TypeScript. Each route is a
handler over a transport-neutral request; the same handlers run behind a local
HTTP server (`src/server.ts`) and an API Gateway Lambda adapter
(`src/lambda.ts`).

## Routes

### `POST /intakes`

Creates an intake record and returns a canonical reference id.

- Request body: `application/x-www-form-urlencoded` with the flat EveryAction
  fields the frontend mapper posts (`FirstName`, `LastName`, `EmailAddress`,
  `City`, `PreferredLanguages`, `PostalCode?`, `AddressLine1?`, `HomePhone?`,
  plus request metadata).
- Header: `Idempotency-Key` must be the client-generated intake UUID. It is the
  idempotency key (a missing or malformed session id returns `401`) and the
  intake id used to replay duplicate submissions.
- Success: `201` with `{ "referenceId": "CAP-XXXX-XXXX" }`.
- Duplicate replay: `200` with the same `referenceId`.
- Validation failure: `422` with `{ "errors": { "firstName": "...", "email": "..." } }`.
  Error keys use the application field names so the UI can bind them directly.

### `POST /intakes/:id/upload-url`

Issues a short-lived presigned upload URL for a document.

- Request body: `{ "fileName": string, "contentType": string, "size": number }`.
- Validates the session id, file type, per-file (10 MB) and cumulative
  (50 MB) size limits, then persists document metadata as `pending`.
- Success: `200` with `{ "uploadUrl": "..." }`; the browser PUTs the file bytes
  directly to that URL.
- Validation failure: `422` with `{ "errors": { "fileType": "...", "size": "..." } }`.

### `PUT /uploads/:id`

Local-mode upload sink used by the bundled presigner. In production the
presigned URL points at S3 and this route is not invoked; here it verifies the
signed token, marks the document `uploaded`, and discards the bytes (never
logged or stored).

### `GET /health`

Liveness check: `{ "status": "ok", "service": "cap-api", "timestamp": "..." }`.

## Error response shapes

| Case | Status | Body |
| --- | --- | --- |
| Field validation | `422` | `{ "errors": { "<field>": "<message>" } }` |
| Missing/malformed session id | `401` | `{ "error": { "code": "session_expired", ... } }` |
| Rate limited | `429` | `{ "error": { "code": "rate_limited", ... } }` |
| HTTPS required | `400` | `{ "error": { "code": "https_required", ... } }` |
| Not found / internals | `404` / `500` | `{ "error": { "code": "...", "message": "..." } }` |

## Running locally

```bash
npm run server
```

Starts the API on `PORT` (default `8787`) after compiling `backend/` to
`backend/dist`. Run it alongside the frontend for local development against the
real backend behavior instead of the in-memory mocks.

### Switching between S3 and local mock uploads

The presigner is chosen once at startup from the environment. With a fully
configured `S3_BUCKET_NAME` / `AWS_REGION` / `AWS_ACCESS_KEY_ID` /
`AWS_SECRET_ACCESS_KEY` present (as in the gitignored `.env`), the backend
returns real S3 presigned URLs and the browser PUTs files straight to S3.

To point uploads back at the local server instead (file bytes are validated then
discarded — no AWS or stored file), set:

```
CAP_LOCAL_PRESIGNER_MODE=mock
```

That single flag is the easy S3↔mock toggle: no frontend or `.env.local`
change is needed, because the frontend `PresignedS3DocumentUploadService` PUTs
to whatever URL the backend returns (S3 or the localhost sink). Leaving
`CAP_LOCAL_PRESIGNER_MODE` unset (the default `signed`) with no S3 credentials
also falls back to the local presigner automatically. The active mode is logged
at startup as `presigner-s3-active` or `presigner-local-active`.

```bash
npm run test:backend
```

Runs the backend test suite (also included in `npm run test` via the vitest
`backend` project).

## Environment variables (backend)

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `8787` | Local server port |
| `CAP_PUBLIC_BASE_URL` | `http://127.0.0.1:<port>` | Base URL embedded in local presigned URLs |
| `CAP_REQUIRE_HTTPS` | `false` | Reject plain-HTTP requests when `true` |
| `CAP_LOCAL_PRESIGNER_MODE` | `signed` | `signed` issues a tokenized upload URL; `mock` skips token validation for local-only testing |
| `CAP_UPLOAD_URL_EXPIRY_SECONDS` | `300` | Presigned upload URL lifetime |
| `CAP_UPLOAD_SIGNING_SECRET` | dev-only constant | HMAC key for local presigned URLs; **must** be provided from the secret store in production |
| `CAP_ALLOWED_ORIGINS` | localhost dev + `https://cohealthinitiative.org` | Comma-separated browser origins the API will serve cross-origin (CORS). Set to `*` to reflect any origin, or a specific list in production. |
| `CAP_MAX_BODY_BYTES` | `12582912` | Request body cap (fits a 10 MB upload) |
| `CAP_RATE_LIMIT_WINDOW_MS` | `60000` | Rate-limit window for public POST routes |
| `CAP_RATE_LIMIT_MAX_REQUESTS` | `60` | Max requests per client in the window |

## Environment variables (frontend)

The frontend selects the real API vs the local mock through Vite env vars in
`src/services/index.ts` (`resolveServiceSelectionFromEnv`); the static
prototype remains the default:

- `VITE_CAP_SUBMISSION_MODE` — `api` selects `ApiSubmissionService`
- `VITE_CAP_UPLOAD_MODE` — `s3` selects `PresignedS3DocumentUploadService`
- `VITE_CAP_API_BASE_URL` — base URL for both adapters (e.g. `http://localhost:8787`)

Example `.env.local`:

```
VITE_CAP_SUBMISSION_MODE=api
VITE_CAP_UPLOAD_MODE=s3
VITE_CAP_API_BASE_URL=http://localhost:8787
```

## Lambda mapping

`createLambdaHandler` in `src/lambda.ts` translates an API Gateway proxy event
into the same `ApiRequest` the local server uses and calls the same dispatcher
(`src/api.ts`), so there is exactly one route implementation:

- `POST /intakes` -> `createIntake`
- `POST /intakes/:id/upload-url` -> `createUploadUrl`
- `PUT /uploads/:id` -> `receiveUpload` (local presigner only in production)
- `GET /health` -> `health`

The in-memory store (`src/repository/memoryStore.ts`) implements the
`Store` contract and is swapped for DynamoDB records and S3 metadata in a
production deployment; the presigner is swapped for an S3 V4 presigner.

## Security and privacy

- HTTPS-only when deployed; plain-HTTP requests are rejected under
  `CAP_REQUIRE_HTTPS=true` and sensitive data never appears in query strings.
- CORS is enabled for the configured `CAP_ALLOWED_ORIGINS` so a static frontend
  host can call the API cross-origin. Preflight (`OPTIONS`) requests are
  answered with scoped allow headers; disallowed origins receive no allow header
  (and a `403` on preflight), so the browser blocks them. `ACCESS-CONTROL-ALLOW-*`
  are emitted by the shared dispatcher (`backend/src/api.ts`) so both the local
  server and the Lambda adapter behave identically.
- Idempotency is enforced on the intake id so retries and double-clicks cannot
  create duplicate records.
- Document metadata is sanitized (path separators and control characters
  stripped) before persistence; object keys never include the original file
  name.
- Logs carry only safe identifiers (`intakeId`, `referenceId`, `documentId`)
  and error categories. Raw payloads, PHI, and file bytes are never logged.
- Public POST routes are rate limited; secrets come from the environment and
  never reach the frontend bundle.