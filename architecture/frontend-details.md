# Frontend and Backend Implementation Details

This document captures feature-level implementation details moved from [master.md](./master.md) to keep the quarterly architecture summary concise.

## Foundation and app shell
- Vite + React + TypeScript scaffold with route shell for public-facing pages (landing and intake entry points).
- Shared domain types and validation contracts.
- Service boundaries for ZIP lookup, document handling, and submission.
- Frontend test, lint, typecheck, and build scripts configured.

## Design system and styling
- Reusable Tailwind-based form controls, layout primitives, and mobile-first responsive patterns (phone-first completion).
- Accessible patterns for inputs, errors, hints, and form feedback.
- Shared layout building blocks: containers, card surfaces, and app-shell framing.
- Tailwind v4 CSS-first setup in `src/index.css` (`@import "tailwindcss"` + `@theme` tokens) replacing the prior ungenerated/scaffold stylesheet and deprecated JS config.
- Brand/semantic tokens, Inter font, safe spacing, and 44px touch-target tokens defined in theme.
- v4 utility fixes applied (color-mix opacity syntax, invalid class cleanup, `resize-y`) and dead scaffold CSS removed.
- Visual/branding pass: brand-tint tokens, warm canvas, gradient hero/brand bar, branded surfaces/cards/CTAs, themed nav and intake progress, and team/trust imagery. Contrast, focus visibility, and 44px targets preserved. `RadioGroup`/`LanguageStep` made explicitly controlled as part of this pass.

## Content and localization
- Typed EN/ES content modules (`src/content/types.ts`, `en.ts`, `es.ts`, `index.ts`) covering navigation, informational pages, intake steps, submission states, and legal notices.
- Content is consumed at render time (shell/nav/footer, informational routes, intake steps, validation/submission copy) with bilingual key parity; no large inline copy blocks remain in components.

## Informational pages
- `/how-we-help` (service overview, process, expectations, trust content) and `/intake` landing (orientation, what-you-need, privacy/information notice) in owned route files, rendered from content modules.
- Content-driven Start CTA generates `/intake/:id` via `crypto.randomUUID()`; accessible/mobile-first structure and route-level tests.
- Known placeholder: `/how-we-help` secondary CTA URL (`"#"`) pending CAP review.

## Localized intake flow
- Multi-step Formik flow on `/intake/:id`: ZIP, language, contact, documents, submission.
- Live EN/ES switching via `getContent(values.language)`; validation and UI copy are content-driven.
- Componentized steps/hooks (`src/components/intake/*`, `useIntakeNavigation`) with authoritative per-step validation, accessible error summary/focus handling, and refreshed field errors.
- ZIP step: optional lookup/autofill (editable), unknown-ZIP notice, blank-continue supported; no browser persistence of intake/PHI data.
- Document validation: per-file 10 MB, total 50 MB, allowed types (PDF/JPG/JPEG/PNG), duplicate detection, per-file remove.
- Submission states (idle/loading/success/error), duplicate-click prevention, reference number on success, content-driven retry/error handling.
- Regression coverage in `src/components/intake/IntakeForm.test.tsx` for navigation, validation, ZIP behavior, success/reference, and no-persistence.

## Intake bug-fix pass (B1–B19 highlights)
- Implicit Enter submits gated like Continue; ZIP autofill clears stale derived values without clobbering manual edits; final-step failures jump to first invalid step.
- Server `fieldErrors` mapped/surfaced per step and cleared on edit; “Try Again” resubmits preserved payload.
- Submission UI distinguishes generic/network/session-expired states with accessible status/alert semantics and non-nested action controls.
- Document handling hardened (identity-based mapping, functional updates, in-flight upload counter disables submit, clear-selected-files action, accessible remove labels).
- Accessibility/routing: `FormField` hint/error ids + `aria-describedby`, labeled language group, `html lang` sync, status region for unknown ZIP, shared intake-id generation/validation with redirect on malformed ids.
- Expanded regression coverage across form fields, submission errors, documents, validation, routing, and hooks.

## App shell and navigation
- Mobile-first `AppShell` with skip link, sticky branded header (`NavLink`/`aria-current`), main landmark, and content-driven footer/disclaimer.
- Real CCHI branding assets (header/footer logos, favicon/title), navigation components, segmented intake progress with “Step X of Y”, shared `Container` rhythm, and route-focus/scroll reset without disrupting step focus.
- Shell/progress regression tests added.

## Service layer and hooks
- `StaticZipService` backed by `src/data/zipCodes.json` (known locality lookup; unknown/blank/malformed return `null`).
- Submission adapters: `MockSubmissionService`, `EmailSubmissionService` (no PHI/docs in mailto), `ApiSubmissionService` (Idempotency-Key, network/session/server-field discrimination, no raw exceptions).
- Document upload adapters: `LocalDocumentUploadService` (prototype/UI-only) and `PresignedS3DocumentUploadService` (presigned flow, safe-throws when unconfigured).
- Service registry/DI boundary (`src/services/index.ts`) and hooks: `useZipLookup`, `useIntakeSubmission`, `useDocumentUpload`, `useEveryActionSubmission`; form layer avoids concrete service instantiation.

## EveryAction mapping
- Pure mapper `src/services/everyActionMapper.ts` centralizes field names/ids/metadata, URL-encoded body construction, UA-derived browser/device helpers, client-side non-sensitive ids, and config seam (language ids, defaults). Optional ZIP/phone omitted correctly; document bytes never mapped.
- `ApiSubmissionService` posts URL-encoded EveryAction payloads with idempotency and preserved error handling; `useEveryActionSubmission` composes mapping with submission boundary. Mapper/hook/adapter tests cover fields, optionality, encoding, metadata, lifecycle, and duplicate guard.

## Backend API and secure file storage
- Transport-neutral backend (`backend/src/api.ts`) shared by Node server and Lambda: `GET /health`, `POST /intakes`, `POST /intakes/:id/upload-url`, local-only `PUT /uploads/:id`.
- Intake handling: validation, UUID idempotency key enforcement, metadata storage, canonical reference id, structured errors, and append-only intake audit log (no PHI in stdout logs).
- Secure uploads: file/type/size validation, sanitized names, presigned upload URLs (S3 V4 or local signed/mock sink), metadata persistence, direct browser PUT to storage. Local sink discards bytes; presigner selection logged at startup.
- CORS shared across adapters, HTTPS toggle, no sensitive data in query strings, body caps, rate limiting, HMAC-signed upload tokens (`timingSafeEqual`), and safe structured logging.
- Frontend wiring via env-selected adapters; test env forces mock modes for determinism. Backend and frontend suites plus Playwright E2E upload flow verify behavior.

## Deployment (AWS, us-east-2, account 590251390266)
- `scripts/deploy/deploy-aws.ps1` builds/syncs frontend to S3 with cache headers and safety checks.
- `scripts/deploy/package-api.ps1` produces Lambda zip (CommonJS handler). `cap-api` Lambda (role `lambda-cap-role-1`, scoped S3 policy) and API Gateway HTTP API are live with intake/upload/CORS behavior verified; uploads land encrypted in the documents bucket.
- CloudFront/OAC not yet provisioned (account verification required); frontend currently served from S3 website endpoint (HTTP-only). Production CORS configured for the live static origin across API Gateway, Lambda env, and bucket CORS.
