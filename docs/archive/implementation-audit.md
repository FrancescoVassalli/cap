> **Archived:** historical implementation audit. Current status is in [architecture/master.md](../../architecture/master.md); open work is in [planning/handoffs.md](../../planning/handoffs.md).

# Implementation Audit

## Purpose
This document captures the gaps between the original frontend implementation guide and the current repository state, and tracks which gaps have been closed. It helps the next agent pick up the real remaining work without assuming the project is still at the design or foundation phase.

## Summary
The implementation is materially ahead of the initial planning baseline and is functionally green. The product-facing app shell, content layer, public routes, navigation polish, service layer, Formik intake form, backend API, and secure presigned file storage are all present, working, and wired together. The service contracts are no longer backed by in-place mocks; they are backed by real adapters behind a service registry and consumed through dedicated hooks. A real backend now sits behind those boundaries, and selecting a document issues a presigned URL and stores the uploaded file in the S3 bucket (with a local/mock sink for development and CI). The remaining work is a final end-to-end QA / Integration pass and, later, production deployment and pointing the submission adapter at the live EveryAction endpoint.

## Verified status
The repo passes the project verification commands:
- `npm run test` (17 test files, 149 tests — 95 frontend + 54 backend)
- `npm run build`
- `npm run lint`
- `npm run typecheck`
- Backend: `npm run test:backend`, typescript build (`tsc -p backend/tsconfig.build.json`), and a Playwright E2E upload test that asserts the presigned-URL request and the PUT to storage.

The production build uses the stricter `tsc -b` check and is green.

## Where implementation matches the plan
The following plan items are implemented:
- Vite + React + TypeScript foundation
- route shell with /how-we-help, /intake, /intake/:id, and wildcard page
- typed bilingual content model
- reusable form controls and layout primitives
- localized multi-step intake flow with Formik and step validation
- no browser storage for intake data
- service contracts for ZIP lookup, document upload, and submission, backed by realistic adapters
- production build and test tooling
- app shell / header / footer / route navigation polished into a calm, mobile-first CAP experience

## Gaps that have been closed
### 1. Service layer is now production-shaped, not merely mocked
The original audit flagged that the ZIP, submission, and document-upload services were still in-place mocks. This is resolved:
- `MockZipService` was replaced by `StaticZipService`, a dataset-driven adapter backed by `src/data/zipCodes.json`, with correct unknown/blank/malformed ZIP handling.
- `SubmissionService` now has multiple adapters: `MockSubmissionService`, `EmailSubmissionService` (dev/demo, PHI-limited), and `ApiSubmissionService` (production shape with idempotency and error discrimination).
- `DocumentUploadService` now has `LocalDocumentUploadService` (prototype, UI-only) and `PresignedS3DocumentUploadService` (production presigned-URL flow, safe-throws when unconfigured).
- Adapters are composed through a service registry (`src/services/index.ts`) rather than instantiated in the form layer.

### 2. Business logic moved out of the form layer
The original audit flagged concrete service instantiation inside the intake component. This is resolved: the form consumes services through `useZipLookup`, `useIntakeSubmission`, and `useDocumentUpload` hooks, keeping the components dumb and the business behavior behind service boundaries.

### 3. App shell and navigation are polished
The original audit flagged a minimal shell and utilitarian route experience. This is resolved by the navigation pass: skip-to-content link, sticky brand header with active-route navigation, content-driven footer with legal disclaimer, a visible intake progress indicator, a shared responsive `Container`, and route-level focus/scroll restoration — all mobile-first and accessible.

## Remaining gaps vs the plan
- The app is not yet validated as a single end-to-end experience (routing, state flow, ZIP skip/unknown, document skipping, submission error/retry, success paths, accessibility, mobile) — the Integration / QA pass.
- The `PresignedS3DocumentUploadService` adapter is exercised against the real backend and stores files in the S3 bucket (verified). The `ApiSubmissionService` adapter is implemented but not yet pointed at a live production EveryAction endpoint, which depends on the external CRM contract. Production deployment of the backend (API Gateway/Lambda/CloudFront) also remains pending.

## Recommendation
The implementation should proceed in the following order:
1. Final QA / Integration Agent: validate the assembled app end-to-end before sign-off.
2. Final accessibility audit under the WCAG 2.2 AA target, if not already covered by the QA pass.
3. Deploy the backend (API Gateway/Lambda/CloudFront) and wire the `ApiSubmissionService` to the production EveryAction endpoint once the CRM contract is available.

This preserves the architectural boundaries established in the plan.
