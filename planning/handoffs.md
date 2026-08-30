# Handoffs
This is the current implementation handoff for the CAP frontend. It reflects the verified state of the repo and the remaining work needed before the project is ready for final integration.

## Lead summary
Status: the prototype is functionally complete and green in the current branch, but it is not yet ready for final integration because the service layer is still mock-based and the shell/navigation polish is incomplete.

The app has already delivered the foundation, design system, localized bilingual intake flow, and the public informational routes. The main remaining work is not startup scaffolding; it is service completion, route polish, and final end-to-end validation.

Recommendation: do not treat this as a release-ready app yet. Treat it as a strong prototype that is close to integration, with the next work concentrated on the Services Agent and Navigation Agent, followed by a final QA / Integration pass.

## Current implementation status
Verified as of 2026-08-30:
- Foundation is complete and stable.
- Design system is complete and working.
- Content + localization is complete and consumed by the app.
- /how-we-help and /intake are implemented and tested.
- The multi-step intake flow on /intake/:id is implemented and locally passes tests.
- The app shell, header/footer, and route-level navigation have been refined into a calm, mobile-first CAP experience (Navigation Agent).
- The project passes: `npm run test`, `npm run build`, `npm run lint`, and `npm run typecheck`.

## Verified implementation reality
The repo is materially ahead of the original planning baseline:
- The localized bilingual intake form is live and works across the ZIP, language, contact, and documents steps.
- Validation and accessibility behaviors are implemented in the UI, including step validation, error summaries, and focus management.
- The application does not persist intake data in browser storage.
- Service interfaces exist for ZIP lookup, submission, and document upload.
- The app shell now includes a skip-to-content link, a sticky brand/header, active-route main navigation, a real content-driven footer with the legal disclaimer, and route-level focus/scroll restoration.

## Known gaps vs the plan
These remain the gating issues for final integration:
- The ZIP lookup, submission, and upload services are implemented behind the service contracts but the concrete adapters and the hook-based consumption boundaries are the responsibility of the Services Agent to verify and finalize.
- The app is not yet validated as a full end-to-end experience across routing, skip flows, service behaviors, and mobile usage.
- The architecture is close to the plan; the intended business logic layering (`useZipLookup`, `useIntakeSubmission`, `useDocumentUpload`) has been introduced and final wiring verification belongs to the Services Agent and the Integration Agent.

## Next agent assignments

### 1. Services Agent
Priority: highest
Required work:
- Verify and finalize the concrete service adapters behind the service contracts (ZIP lookup with real data access and unknown-ZIP handling, submission, document-upload).
- Confirm the hook-based consumption boundaries (`useZipLookup`, `useIntakeSubmission`, `useDocumentUpload`) are wired into the form layer and build cleanly.
- Validate service error states and retry behavior against content and UX expectations.
- Provide unknown-ZIP handling and submission/upload error handling that matches the UI content.

Allowed scope:
- src/services/*
- src/data/*
- src/types/*
- src/hooks/* (service-related hooks)
- relevant integration points where services are consumed

Do not broaden scope into unrelated app features.

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
Status: not ready for final integration yet.

Reason:
- Navigation polish is complete and the shell is consistent, but the service adapters still need the Services Agent’s verification (they were mid-refactor during the navigation pass) before a final QA pass can sign off.
- The next implementation step should be service completion/verification, then final QA.

The implementation is ready for the next implementation wave, not for final production-style integration.

## Agent boundaries reference
- Services Agent: ownership of ZIP, submission, and document-upload adapters
- Navigation Agent: ownership of route shell polish and mobile UX consistency — completed
- Integration / QA Agent: ownership of end-to-end validation and release readiness

## Verification evidence
- `cd "c:\Development\cap\cap"; npm run test; npm run build; npm run lint; npm run typecheck` succeeded after the navigation pass.
- Result: 7 test files passed, 33 tests passed (including AppShell navigation, intake-progress, and service-hook tests), production build succeeded, lint was clean, and typecheck succeeded.

## Working note for the next handoff
This is a stable prototype with strong feature coverage. The navigation/shell polish is complete; the remaining value is in service adapter verification and the final end-to-end QA pass.

The next agent sequence should be:
1. Services Agent (verify/finalize adapters and hook wiring)
2. Integration / QA Agent
3. Final accessibility audit under the WCAG 2.2 AA target

That sequence keeps the architecture honest and reduces the chance of polishing around mock behavior without a real backend contract.
