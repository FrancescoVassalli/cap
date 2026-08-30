# Handoffs
This is the current implementation handoff for the CAP frontend. It reflects the verified state of the repo and the remaining work needed before the project is ready for final integration.

## Lead summary
Status: the service layer is now finalized behind real adapters and hook-based consumption boundaries, and the navigation/shell polish is complete. The remaining work before final integration is a full end-to-end QA / Integration pass across the assembled application.

The app has delivered the foundation, design system, localized bilingual intake flow, the public informational routes, a calm mobile-first shell, and a service layer that no longer depends on direct form-layer mocks.

Recommendation: the next (and final) implementation wave is the Integration / QA Agent to validate the app end-to-end and confirm accessibility and mobile UX before sign-off.

## Current implementation status
Verified as of 2026-08-30:
- Foundation is complete and stable.
- Design system is complete and working.
- Content + localization is complete and consumed by the app.
- /how-we-help and /intake are implemented and tested.
- The multi-step intake flow on /intake/:id is implemented and locally passes tests.
- The app shell, header/footer, and route-level navigation have been refined into a calm, mobile-first CAP experience (Navigation Agent).
- The service layer is finalized behind real adapters and routed through dedicated hooks (Services Agent).
- The project passes: `npm run test`, `npm run build`, `npm run lint`, and `npm run typecheck`.

## Verified implementation reality
The repo is materially ahead of the original planning baseline:
- The localized bilingual intake form is live and works across the ZIP, language, contact, and documents steps.
- Validation and accessibility behaviors are implemented in the UI, including step validation, error summaries, and focus management.
- The application does not persist intake data in browser storage.
- Service interfaces exist for ZIP lookup, submission, and document upload.
- The app shell now includes a skip-to-content link, a sticky brand/header, active-route main navigation, a real content-driven footer with the legal disclaimer, and route-level focus/scroll restoration.
- The service contracts are backed by real adapters: a dataset-driven `StaticZipService` for ZIP lookup, submission adapters (`Mock`/`Email`/`Api`) behind `SubmissionService`, and document-upload adapters (`Local`/`PresignedS3`) behind `DocumentUploadService`, composed through a `src/services` registry.
- The form layer consumes services through dedicated hooks (`useZipLookup`, `useIntakeSubmission`, `useDocumentUpload`) instead of instantiating concrete service classes directly.

## Known gaps vs the plan
These remain the gating issues for final integration:
- The app is not yet validated as a full end-to-end experience across routing, skip flows, service behaviors, and mobile usage.
- The service layer is functionally complete for the static prototype but is not yet exercised against a real backend contract; the `ApiSubmissionService` and `PresignedS3DocumentUploadService` adapters are ready but not live.

## Next agent assignments

### 1. Services Agent
Priority: done
Completed work:
- Replaced the mock ZIP lookup with `StaticZipService`, a dataset-driven adapter backed by a real Colorado ZIP dataset (`src/data/zipCodes.json`). Unknown or malformed ZIPs return `null` so the intake never blocks and the “We couldn't find that ZIP code” notice renders.
- Defined and implemented realistic submission adapters behind `SubmissionService`: `MockSubmissionService` (in-memory prototype), `EmailSubmissionService` (dev/demo, PHI-limited), and `ApiSubmissionService` (production shape with idempotency header and mapped network/session/server-field errors).
- Defined and implemented realistic document-upload adapters behind `DocumentUploadService`: `LocalDocumentUploadService` (prototype, UI-only, never claims secure storage) and `PresignedS3DocumentUploadService` (production presigned-URL contract, safe-throws when unconfigured).
- Introduced a service registry / DI boundary (`src/services/index.ts`) so the form layer no longer instantiates concrete services directly.
- Introduced the hook-based consumption boundaries (`useZipLookup`, `useIntakeSubmission`, `useDocumentUpload`) and wired them into `IntakeForm` and `DocumentsStep`.
- Added unit tests for the ZIP, submission, and document-upload services covering data access, unknown/blank/malformed ZIPs, error discrimination (network vs. session vs. server-field), idempotency header, and storage-key safety.

### 2. Navigation Agent
Priority: done
Completed work:
- Refined the app shell into a calm, mobile-first CAP shell: skip-to-content link, sticky brand header with active-route main navigation, content-driven footer with legal disclaimer, and a bare `<main>` landmark.
- Introduced reusable navigation components (`src/components/navigation/*`): SkipLink, SiteBrand, MainNav, FooterNav, IntakeProgress, RouteFocus.
- Added a visible intake progress indicator (segmented steps + “Step X of Y” text) in the multi-step form.
- Normalized page rhythm with the shared Container (incl. new `xl` width) across /how-we-help, /intake, /intake/:id, and the not-found page.
- Added route-level scroll restoration and heading focus on route changes so the visitor always knows where they are.
- Kept accessibility intact: visible focus states, `aria-current="page"`, move-keyboard-first skip link, semantic landmarks, and no color-only progress.

### 3. Final QA / Integration Agent
Priority: required before sign-off
Required work:
- Validate the app as one experience rather than a collection of independent features.
- Test routing, state flow, ZIP skip/unknown behaviors, document skipping, submission states, and success paths.
- Confirm accessibility and mobile UX under the project’s WCAG target.
- Run the final verification pass across the repo before sign-off.

## Integration recommendation
Status: functionally complete; one remaining implementation wave (final QA) before sign-off.

Reason:
- Navigation polish is complete and the service layer is finalized behind real adapters and hook boundaries. The remaining value is an end-to-end validation pass that exercises the assembled application, service error/retry states, skip flows, accessibility, and mobile behavior as one experience.

## Agent boundaries reference
- Services Agent: ownership of ZIP, submission, and document-upload adapters — completed
- Navigation Agent: ownership of route shell polish and mobile UX consistency — completed
- Integration / QA Agent: ownership of end-to-end validation and release readiness

## Verification evidence
- `cd "c:\Development\cap\cap"; npm run test; npm run build; npm run lint; npm run typecheck` succeeded after the services pass.
- Result: 9 test files passed, 53 tests passed (including AppShell navigation, intake-progress, and ZIP/submission/document-upload service tests), production build succeeded (`tsc -b` strict), lint was clean, and typecheck succeeded.

## Working note for the next handoff
This is a stable prototype with strong feature coverage. Navigation/shell polish and the service layer are complete; the remaining value is the final end-to-end QA pass across the assembled application.

The next agent sequence should be:
1. Integration / QA Agent (end-to-end validation: routing, skip flows, service error/retry, submission states, accessibility, mobile)
2. Final accessibility audit under the WCAG 2.2 AA target

That sequence keeps the architecture honest and reduces the chance of polishing around mock behavior without a real backend contract.
