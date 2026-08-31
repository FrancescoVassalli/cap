# Handoffs
This is the current implementation handoff for the CAP frontend. It reflects the verified state of the repo and the remaining work needed before the project is ready for final integration.

## Lead summary
Status: the service layer is now finalized behind real adapters and hook-based consumption boundaries, and the navigation/shell polish is complete. The remaining work before final integration is a full end-to-end QA / Integration pass across the assembled application.

The app has delivered the foundation, design system, localized bilingual intake flow, the public informational routes, a calm mobile-first shell, and a service layer that no longer depends on direct form-layer mocks.

Recommendation: the next (and final) implementation wave is the Integration / QA Agent to validate the app end-to-end and confirm accessibility and mobile UX before sign-off.

## Current implementation status
Verified as of 2026-08-30:
- Foundation is complete and stable.
- **CSS / Tailwind foundation is complete**: Tailwind is bootstrapped in `src/index.css` and now actually generates utilities, Preflight, and theme output (production CSS grew from ~1 KB to ~30 KB); tokens were migrated to the CSS-first `@theme` block (brand, semantic, touch targets, Inter font); v4-incompatible/typo utility classes were fixed; dead Vite scaffold CSS was removed. Details in `architecture/master.md`.
- Design system is complete and working.
- Content + localization is complete and consumed by the app.
- /how-we-help and /intake are implemented and tested.
- The multi-step intake flow on /intake/:id is implemented and locally passes tests.
- The app shell, header/footer, and route-level navigation have been refined into a calm, mobile-first CAP experience (Navigation Agent).
- The service layer is finalized behind real adapters and routed through dedicated hooks (Services Agent).
- The project passes: `npm run test`, `npm run build`, `npm run lint`, and `npm run typecheck`.
- Autofill behavior is verified across every intake field: each contact/ZIP input carries the correct browser `autocomplete` token (given-name, family-name, email, tel, street-address, address-line2, address-level2, address-level1, postal-code), and entering a known ZIP autofills city and state (still editable), including a re-autofill pass after navigating back and changing the ZIP. Locked in by `src/components/intake/IntakeAutofill.test.tsx`.

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
- Wired in the approved CCHI branding assets: the header `SiteBrand` and footer now render `CCHI_Logo.png` (header logo keeps an accessible full-program-name label with a decorative image; footer logo carries the full name alt), and `index.html` uses `CCHI-logo-favicon.png` with the page title set to "Consumer Assistance Program".
- Kept accessibility intact: visible focus states, `aria-current="page"`, move-keyboard-first skip link, semantic landmarks, and no color-only progress.

### 3. Visual / Branding pass
Priority: planned (next implementation wave)
This is a presentational-only change that follows the color/branding inspiration in `planning/master.md` (primary `#01599a`, secondary `#7aabdb`, highlight `#fec524`) and the character of the reference CAP/CCHI site (hero blue, photography, bold color bands). No business logic, no component API changes, no accessibility-structure changes.

Reason: the app "works" but renders flat and generic — pages are painted almost entirely in neutral slate grays (white/slate-50 cards, thin slate-200 borders, shadow-sm), and the brand colors appear only as tiny accents. The three brand colors are underused (cap-secondary and cap-highlight are effectively absent from the informational pages).

Planned work (in this order):
1. **Tokens/theme** (`src/index.css`) — add light brand tint tokens (`cap-primary-50/100`, `cap-secondary-50`) and a warm canvas background derived from the brand hexes; keep existing `status-*`, `touch`, and `font` tokens unchanged.
2. **AppShell** — swap `bg-slate-50` for a warm canvas; add a thin primary→secondary gradient brand bar along the top; use `border-cap-secondary/40` accents on header/footer.
3. **Hero** (HowWeHelp + IntakeLanding) — primary-blue gradient hero with white text, a highlight `#fec524` underline/eyebrow accent, and a white or highlight CTA pill.
4. **Cards/sections** — replace flat `white border-slate-200 shadow-sm` stacking with warm cards (`border-cap-secondary/40`, `cap-secondary-50` header rows/accent tops, larger rounding); service/step tiles get `border-l-4 border-cap-primary` or highlight number chips; give one "expectations" block a secondary/highlight band callout.
5. **Buttons/CTA** (`Button.tsx`) — launch/get-help CTA uses `bg-cap-highlight text-cap-primary` (never white on yellow); add a subtle hover lift while keeping focus rings.
6. **Header/nav/footer** — stronger brand wordmark/logo, active-route underline in secondary/highlight, and a brand-toned footer (primary-dark or secondary-tint with light text) instead of gray.
7. **Intake form + progress** (`IntakeProgress`) — completed segments cap-primary, current/active fill cap-secondary, active cap cap-highlight; step cards get highlight step chips. Keep text labels (no color-only meaning).
8. **Imagery** — add CAP logo into hero/header and team-photo placeholders in a trust section on /how-we-help, pulling real assets from the current site into `public/`.
9. **Verification** — contrast check (dark text on highlight, white on primary/secondary), then re-run `npm run test`, `npm run build`, `npm run lint`, `npm run typecheck`, plus a browser visual smoke check (mobile + desktop).

Accessibility guardrails (preserved): no color-only meaning (text labels kept), existing focus-visible rings kept on all new backgrounds, 44px touch targets unchanged, semantic structure untouched.

### 4. Final QA / Integration Agent
Priority: required before sign-off
Required work:
- Validate the app as one experience rather than a collection of independent features.
- Test routing, state flow, ZIP skip/unknown behaviors, document skipping, submission states, and success paths.
- Confirm accessibility and mobile UX under the project’s WCAG target.
- Run the final verification pass across the repo before sign-off.

## Integration recommendation
Status: functionally complete; the next implementation wave is the Visual / Branding pass, followed by final QA before sign-off.

Reason:
- Navigation polish is complete and the service layer is finalized behind real adapters and hook boundaries. The app is functionally complete but renders flat; a presentational Visual / Branding pass will align the look with the brand direction in `planning/master.md`. After that, the remaining value is an end-to-end validation pass that exercises the assembled application, service error/retry states, skip flows, accessibility, and mobile behavior as one experience.

## Agent boundaries reference
- Services Agent: ownership of ZIP, submission, and document-upload adapters — completed
- Navigation Agent: ownership of route shell polish and mobile UX consistency — completed
- Design System Agent: ownership of the visual/branding pass (tokens, shell, hero, cards, CTA, nav/footer, intake progress, imagery) — planned next
- Integration / QA Agent: ownership of end-to-end validation and release readiness

## Verification evidence
- `cd "c:\Development\cap\cap"; npm run test; npm run build; npm run lint; npm run typecheck` succeeded after the services pass.
- Result: 9 test files passed, 53 tests passed (including AppShell navigation, intake-progress, and ZIP/submission/document-upload service tests), production build succeeded (`tsc -b` strict), lint was clean, and typecheck succeeded.

## Working note for the next handoff
This is a stable prototype with strong feature coverage. Navigation/shell polish and the service layer are complete. The app is functionally complete but renders flat/generic (neutral slate grays; brand colors underused), so a presentational-only Visual / Branding pass is planned next to follow the color/branding inspiration in `planning/master.md`.

The next agent sequence should be:
1. Design System Agent — Visual / Branding pass (tokens, shell, hero, cards, CTA, nav/footer, intake progress, imagery + contrast check and full verification)
2. Integration / QA Agent (end-to-end validation: routing, skip flows, service error/retry, submission states, accessibility, mobile)
3. Final accessibility audit under the WCAG 2.2 AA target

That sequence keeps the architecture honest and reduces the chance of polishing around mock behavior without a real backend contract.
