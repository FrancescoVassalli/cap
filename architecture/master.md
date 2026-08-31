# Architecture Progress Summary

## Current status

The CAP frontend has moved past the initial scaffold phase and is now in the downstream implementation phase. The project is no longer primarily about setup and infrastructure; the informational pages and the localized EN/ES intake form flow are implemented (with accessible validation and submission states), the app shell and navigation are polished, the service layer is finalized behind real adapters and dedicated hooks, and the visual / branding pass has repainted the app onto the CAP/CCHI palette. The remaining work is final end-to-end QA/validation of the assembled application.

The most current implementation status is captured in [../planning/handoffs.md](../planning/handoffs.md), which identifies the project as being in the product-facing feature stage rather than the startup phase.

For documented implementation drift against the original plan, see [./implementation-audit.md](./implementation-audit.md). The original audit's primary discrepancy — a service layer backed only by in-place mocks — has been resolved: the service contracts are now backed by real adapters and consumed through dedicated hooks and a service registry. The audit also records the resolved navigation polish gap.

## Completed work

### Foundation and app shell
- Vite + React + TypeScript project scaffold
- Route shell for the public-facing app, including the landing and intake entry points
- Shared domain types and validation contracts
- Basic service boundaries for ZIP lookup, document handling, and submission
- Test, lint, typecheck, and build scripts configured for the frontend

### Design system
- Reusable Tailwind-based form controls and layout primitives
- Mobile-first responsive patterns intended for phone-based completion
- Accessible patterns for inputs, errors, hints, and form feedback
- Shared layout-building blocks such as containers, card surfaces, and app shell framing

### CSS / Tailwind foundation
- Bootstrapped Tailwind by adding `@import url(...)` + `@import "tailwindcss";` as the first lines of `src/index.css`. Previously the Tailwind engine was never invoked — the single global stylesheet had no Tailwind directive, so the compiled production CSS was only ~1 KB of hand-written rules with **no** generated utilities, Preflight reset, or theme output (the app shipped unstyled; tests passed because Vitest asserts behavior, not styles).
- Migrated the design tokens from the deprecated JS `tailwind.config.ts` to Tailwind v4's CSS-first `@theme` block in `src/index.css` (and removed the now-redundant JS config). Every token becomes a real utility and stays in sync with the brand/semantic plan: `--color-cap-{primary,secondary,highlight}`, `--color-status-{error,success,focus}`, the semantic layer (`--color-{text,muted,border,background,surface}`), `--font-sans` (Inter), `--spacing-safe`, and `--min-height/width-touch` (44px).
- Loaded the Inter typeface (Google Fonts) and remapped `--font-sans` so the intended font actually renders instead of silently falling back to system-ui.
- Fixed Tailwind v4-incompatible or invalid utilities across the components:
  - Replaced the removed v3 `bg-opacity-*` / `file:bg-opacity-*` opacity utilities with the v4 color-mix syntax (`hover:bg-cap-primary/90`, `active:bg-cap-primary/90`, `hover:file:bg-cap-primary/90`) in `Button`, `FormFooter`, and `FileInput`.
  - Removed the invalid `font-base` class from all six input/select/textarea primitives (`TextInput`, `EmailInput`, `PhoneInput`, `ZipInput`, `Select`, `Textarea`).
  - Corrected `resize-vertical` → `resize-y` in `Textarea`.
- Removed the dead Vite scaffold `src/App.css` (leftover styles referencing nonexistent variables; never imported).
- Verification: `npm run build` now emits a ~30 KB production CSS bundle (up from ~1 KB) containing generated utilities (`bg-cap-primary`, `min-h-touch`, `focus-visible:ring-cap-primary`, `resize-y`), the Inter `--font-sans` variable, and the color-mix `/90` opacity output. `npm run test` (10 files / 58 tests), `npm run lint`, `npm run typecheck`, and `npm run build` all pass.

### Content and localization layer
- Typed English and Spanish content modules (src/content/types.ts, en.ts, es.ts, index.ts)
- Centralized copy for navigation, informational pages, intake form steps, submission states, and legal notices
- Clear separation between the content model and components; the content layer is now actually consumed by the app rather than sitting unused:
  - The app shell renders brand, nav labels, nav aria-label, and footer copy from the navigation content module
  - Informational pages render from their owned route files with component-scoped `getContent()` calls, and NotFound renders entirely from a `notFound` content block
  - The intake form derives content from `getContent(values.language)` inside the Formik render prop, so selecting Español on the language step switches the whole remaining flow to Spanish live
  - No large copy blocks remain inline in components; new copy must be added to the content modules with bilingual (EN/ES) key parity

### Informational pages
- /how-we-help page with the service overview, process steps, expectations, and trust-building content
- /intake landing page with orientation, what-you-need guidance, and an explicit privacy / information notice
- Both pages live in dedicated owned route files (src/routes/HowWeHelpPage.tsx and src/routes/IntakeLandingPage.tsx) and render entirely from the typed content modules; section copy and CTA labels come from the content layer rather than inline strings
- The Start CTA on /intake is content-driven and generates /intake/:id via crypto.randomUUID(), so visitors only enter the form once they are oriented and know what to expect
- Accessible, mobile-first structure: no nested <main> landmarks, no nested interactive controls, semantic heading hierarchy, keyboard-accessible actions, and visible focus states
- Route-level regression tests (src/routes/HowWeHelpPage.test.tsx and src/routes/IntakeLandingPage.test.tsx) cover the eligibility/orientation content and the CTA flow into the intake route
- Known placeholder: the secondary CTA on /how-we-help (content.howWeHelp.secondaryCta) still links to url: "#" and needs a real Consumer Resources URL from CAP review

### Localized intake form flow
- Multi-step Formik flow implemented on /intake/:id covering ZIP, language, contact, documents, and submission
- Live EN/ES switching: the form renders from `getContent(values.language)` inside the Formik render prop, so choosing Español on the language step immediately switches labels, hints, placeholders, validation messages, ZIP notices, document copy, buttons, and the error screen to Spanish; the success screen preserves the selected language through a `submittedLanguage` snapshot
- Validation messages come from the content layer via the step validator (`validateIntakeStep`) and a content-driven Yup schema (no inline error strings)
- Componentized step content under src/components/intake/ (ZipStep, LanguageStep, ContactStep, DocumentsStep, IntakeForm, SubmissionSuccess, SubmissionError, ErrorSummary), with navigation encapsulated in src/hooks/useIntakeNavigation.ts (currentStep/goNext/goBack/canGoBack)
- Step validation is authoritative for the current step: stale whole-form Formik errors no longer block progression, and field errors refresh as the user edits
- Accessible error summary: on a failed Continue attempt the error summary is shown (content-driven heading) and keyboard focus moves to it, but not re-stolen on every keystroke/remount; invalid fields carry aria-invalid and errors are associated via FormField (WCAG 2.2 AA)
- ZIP step supports optional lookup with frontend autofill of city/state (still editable) and an unknown-ZIP notice, all via the zip service contract; there is no dedicated "Skip this step" control — leaving the ZIP blank and continuing is the supported skip path (the Continue flow clears ZIP/city/state via the button handler)
- Document validation enforces per-file 10 MB, total 50 MB, allowed types (PDF/JPG/JPEG/PNG), and duplicate-file detection with content-driven messages, and shows selected files with per-file Remove
- Submission flow has idle/loading/success/error states with duplicate-click prevention (submit disabled while loading) and renders the reference number on the content-driven success screen; failure renders content-driven error/retry states
- No-persistence requirement preserved: no PHI or consumer data written to browser storage, URL parameters, analytics, or client logs (verified by test)
- Focused regression suite in src/components/intake/IntakeForm.test.tsx covers step navigation (Back/Continue), progress label, ZIP autofill/blank-continue/unknown, required-field and email validation, content-driven success screen with reference number, and no-persistence
- The old `IntakeStartButton` export was removed from IntakePage.tsx; the "Start a New Request" CTA now lives in IntakeLandingPage.tsx
- Known: the `npm run typecheck` script (tsc --noEmit on the solution tsconfig) passes trivially; the production `npm run build` (tsc -b) is the stricter check and is green

### App shell and navigation polish
- Refined `AppShell` into a calm, mobile-first shell: a skip-to-content link, a sticky brand header with active-route `NavLink`s (which publish `aria-current="page"`), a bare `<main id="main-content">` landmark, and a content-driven footer that includes the legal disclaimer and copyright.
- Wired in the real CCHI branding assets: the header `SiteBrand` and `FooterNav` now render the approved `CCHI_Logo.png` from `public/` instead of a text-only wordmark, and the favicon/title in `index.html` were switched from the Vite placeholder `favicon.svg` to the approved `CCHI-logo-favicon.png` (with the page title updated to "Consumer Assistance Program"). The header logo link keeps its full program name as an accessible name (`aria-label`) with the decorative image (`alt=""`), and the footer logo carries the full program-name alt text. The old Vite placeholder `favicon.svg`/`icons.svg` are no longer referenced by the shell.
- Introduced dedicated navigation components under `src/components/navigation/`: `SkipLink`, `SiteBrand`, `MainNav`, `FooterNav`, `IntakeProgress`, and `RouteFocus`.
- The multi-step intake flow now shows a visible segmented progress bar with an accessible “Step X of Y” label, so the visitor always knows where they are in the form.
- Route pages were normalized onto the shared `Container` primitive (a new `xl` width was added) so /how-we-help, /intake, /intake/:id, and the not-found page share consistent horizontal rhythm and vertical spacing.
- Route transitions reset scroll and move focus to the page heading on pathname change, keeping screen-reader users oriented without interfering with the intake step focus management.
- Accessibility preserved/improved: visible focus rings, 44px touch targets in the header, semantic landmarks, no color-only progress indication, and mobile-first reflow (the two-item main nav remains visible without a hidden menu).
- New regression tests cover the shell (skip link, brand home link, active-route nav, footer disclaimer/copyright) and the intake progress component.

### Visual / branding pass (Design System Agent)
- Added light brand-tint tokens to `src/index.css` (`--color-cap-primary-50`, `--color-cap-primary-100`, `--color-cap-secondary-50`), derived from the brand hexes, and warmed the semantic canvas (`--color-background`); existing `status-*`, `touch`, and `font` tokens were left unchanged.
- Repainted `AppShell` onto the warm brand canvas (`bg-cap-primary-50`), added a thin primary→secondary→highlight gradient brand bar across the top, and switched header/footer chrome to `border-cap-secondary/40` accents. The footer is now a brand-toned secondary band that swaps the gray chrome for the blue brand color while keeping dark text for contrast.
- Built a primary→secondary blue-gradient hero on both `/how-we-help` and `/intake` with white text, a highlight (`#fec524`) eyebrow pill, and a highlight CTA (never white-on-yellow). `/how-we-help` gained a real CAP hero image (`public/cchi-help-2.jpg`).
- Replaced the flat gray card stacking with branded surfaces: warm header rows (`bg-cap-secondary-50` + `border-cap-secondary/40`), service tiles with a `border-l-4 border-cap-primary` accent, "How CAP Works" step tiles with highlight number chips, and a highlight/expectations color-band callout block.
- Added a `highlight` variant to `Button.tsx` (`bg-cap-highlight text-cap-primary` with a subtle hover lift) used for the get-help/start CTAs, and normalized form-control borders to a secondary accent (`border-cap-secondary/70`, focus to primary) across the input/select/textarea primitives and `Card`.
- Branded the main nav active state (`bg-cap-primary` + white text) and inactive hover underline, and themed the intake form progress + step-card surfaces (completed segments cap-primary, current segment cap-secondary, `IntakeProgress` labels retained so color is never the only signal).
- Added a team/trust section on `/how-we-help` with the real CAP team headshots pulled into `public/` (`team-{stephanie,madi,melissa,monica,alejandra}.*`) as decorative-but-alt-labeled figures, plus a real hero photo. No new backend or business logic; all changes are presentational.
- Made `RadioGroup`/`LanguageStep` explicitly controlled so the selected language radio is actually checked (a pre-existing correctness improvement folded into this pass); the language step defaults to English with a regression test.
- Verification: `npm run test` (10 files / 60 tests), `npm run lint`, `npm run build`, and `npm run typecheck` are green; the production CSS grew to ~36 KB and contains the new brand-tint utilities and gradient/highlight styles. A Playwright visual smoke check confirmed the warm canvas, hero gradient + white text, highlight CTA (yellow bg / primary text), secondary footer, and no horizontal overflow at 390px mobile width on both informational pages.
- Contrast guardrails held: dark text on highlight, white on primary, and dark text on the secondary footer all meet target contrast; focus-visible rings and 44px touch targets were preserved on every repainted surface.

### Service layer
- Replaced the in-place mock ZIP adapter with `StaticZipService`, a dataset-driven adapter backed by a real Colorado ZIP dataset (`src/data/zipCodes.json`). It returns the postal locality for known codes and `null` for unknown, blank, or malformed codes, so the intake can show the “We couldn't find that ZIP code” notice and continue without blocking.
- Defined and implemented multiple submission adapters behind `SubmissionService`: `MockSubmissionService` (in-memory prototype), `EmailSubmissionService` (dev/demo notification that deliberately avoids placing PHI or documents in a `mailto:` URL), and `ApiSubmissionService` (production shape with an `Idempotency-Key`, network/session/server-field error discrimination, and no raw exceptions surfaced).
- Defined and implemented multiple document-upload adapters behind `DocumentUploadService`: `LocalDocumentUploadService` (prototype, UI-only) and `PresignedS3DocumentUploadService` (production presigned-URL flow that safe-throws when a backend is not configured so the UI never implies secure storage).
- Introduced a service registry / dependency-injection boundary (`src/services/index.ts`) so the form layer never instantiates concrete service classes directly; adapter selection is a configuration concern.
- Introduced the hook-based business-logic layer called for by the plan: `useZipLookup`, `useIntakeSubmission`, and `useDocumentUpload`, and wired them into `IntakeForm` and `DocumentsStep`.
- Submission error states are discriminated (`error` vs. `networkError` vs. `sessionExpired`) so the UI maps each to the correct content copy without exposing exceptions; retry resets submission state via the hook.
- Unit tests (`src/services/zipService.test.ts`, `submissionService.test.ts`, `documentUploadService.test.ts`) cover data access, unknown/blank/malformed ZIPs, error discrimination, idempotency header, presigned-URL flow, and storage-key safety (never using the original filename as a security boundary).

### EveryAction data transformation
- Added a pure mapper module (`src/services/everyActionMapper.ts`) that owns every EveryAction field name, numeric id, and request-metadata constant so the URL-encoding/field-name concerns live in one testable place rather than leaking into the UI or the generic API adapter.
  - `toEveryActionBody(payload, meta, config?)` maps the application `SubmissionPayload` to the flat EveryAction field map (`FirstName`, `LastName`, `PreferredLanguages`, `EmailAddress`, `AddressLine1`, `City`, `PostalCode`, and the split `HomePhoneCountryCode` / `HomePhoneInternationalDialingPrefix` / `HomePhone`), plus request metadata (`FormSessionId`, `ClientSubmissionId`, `BrowserName`, `DeviceType`, `XFromApp`, `ActionTagBaseUrl`, `FormVersion`, `type`).
  - `buildUrlEncoded(body)` produces the `application/x-www-form-urlencoded; charset=UTF-8` body, percent-encoding special characters via `URLSearchParams`.
  - A `DEFAULT_EVERY_ACTION_CONFIG` seam (mirroring the `services` DI boundary) holds the numeric language ids (`en` -> `62`, `es` -> `15` per the approved mapping) and defaults for `type`, `XFromApp`, `ActionTagBaseUrl`, and `FormVersion`, swappable without code changes.
  - `detectBrowserName` / `detectDeviceType` (pure, UA-string based) and `buildEveryActionMeta` (derives non-sensitive session/client submission ids client-side, with hardcoded fallbacks for non-browser environments).
  - Optional data is handled correctly: a skipped ZIP omits `PostalCode`, an omitted phone omits the `HomePhone*` group, and documents are never transmitted as bytes (they are uploaded separately via `useDocumentUpload`).
- `ApiSubmissionService` now consumes the mapper: it builds the EveryAction body and POSTs it URL-encoded (instead of raw JSON) while keeping the `Idempotency-Key` header, network/session/server-field error discrimination, and no-raw-exception guarantees. The mock and email adapters are untouched.
- Added a thin `useEveryActionSubmission` hook (mirroring `useIntakeSubmission`) that composes the mapper/payload assembly with the existing `SubmissionService` boundary, so `IntakeForm` calls a single clean `submit(values)` and never sees EveryAction specifics. It preserves the idle/loading/success/error lifecycle and duplicate-click prevention.
- Unit tests (`src/services/everyActionMapper.test.ts`, `src/hooks/useEveryActionSubmission.test.ts`) and new `ApiSubmissionService` assertions cover every mapped field, optional ZIP/phone skip, language-id mapping through the config seam, URL-encoding of special characters, session/client/browser/device metadata, the hook happy path + failures + duplicate guard, and the URL-encoded request body.

## Remaining work

The service layer, app shell, intake flow, and visual/branding pass are implemented and green. Remaining items are final QA and release-readiness:

- Validate the complete end-to-end experience in QA (state flow, step navigation, skip logic, service error/retry states, success handling, accessibility, mobile behavior) before signoff.
- Exercise the `ApiSubmissionService` and `PresignedS3DocumentUploadService` adapters against a real backend contract once one is available.
- Run the Accessibility auditor (WCAG 2.2 AA) as the designated sign-off gate; Security/Release auditors remain outside the demo scope per the plan.

## Architecture direction

The application is intentionally designed as a static, mobile-first frontend prototype that can later be connected to a CRM or backend workflow. The architecture stays simple and explicit:

- React + TypeScript for a predictable frontend
- Vite for a lightweight build/dev workflow
- Tailwind for styling and responsive design
- Formik + Yup for intake validation flow
- Centralized content modules for bilingual copy, consumed by components at render time
- Service abstractions for ZIP lookup, submission, and document upload so the static prototype can be replaced by a backend without rewriting the intake UI
- No browser persistence for intake data to keep sensitive information out of local storage

## Key implementation files

- [../src/App.tsx](../src/App.tsx)
- [../src/routes/AppRouter.tsx](../src/routes/AppRouter.tsx) (installs `RouteFocus` and the route table)
- [../src/routes/NotFoundPage.tsx](../src/routes/NotFoundPage.tsx)
- [../src/routes/HowWeHelpPage.tsx](../src/routes/HowWeHelpPage.tsx)
- [../src/routes/IntakeLandingPage.tsx](../src/routes/IntakeLandingPage.tsx)
- [../src/routes/IntakePage.tsx](../src/routes/IntakePage.tsx)
- [../src/components/layout/AppShell.tsx](../src/components/layout/AppShell.tsx)
- [../src/components/navigation/](../src/components/navigation/) (SkipLink, SiteBrand, MainNav, FooterNav, IntakeProgress, RouteFocus)
- [../src/components/intake/IntakeForm.tsx](../src/components/intake/IntakeForm.tsx) (with ZipStep, LanguageStep, ContactStep, DocumentsStep, SubmissionSuccess, SubmissionError, ErrorSummary, and IntakeForm.test.tsx)
- [../src/hooks/useIntakeNavigation.ts](../src/hooks/useIntakeNavigation.ts)
- [../src/validation/intakeSchema.ts](../src/validation/intakeSchema.ts)
- [../src/validation/intakeStepValidation.ts](../src/validation/intakeStepValidation.ts)
- [../src/validation/documentValidation.ts](../src/validation/documentValidation.ts)
- [../src/routes/HowWeHelpPage.test.tsx](../src/routes/HowWeHelpPage.test.tsx)
- [../src/routes/IntakeLandingPage.test.tsx](../src/routes/IntakeLandingPage.test.tsx)
- [../src/components/layout/AppShell.tsx](../src/components/layout/AppShell.tsx)
- [../src/types/index.ts](../src/types/index.ts)
- [../src/data/zipCodes.json](../src/data/zipCodes.json)
- [../src/services/index.ts](../src/services/index.ts)
- [../src/services/zipService.ts](../src/services/zipService.ts)
- [../src/services/submissionService.ts](../src/services/submissionService.ts)
- [../src/services/documentUploadService.ts](../src/services/documentUploadService.ts)
- [../src/services/zipService.test.ts](../src/services/zipService.test.ts)
- [../src/services/submissionService.test.ts](../src/services/submissionService.test.ts)
- [../src/services/documentUploadService.test.ts](../src/services/documentUploadService.test.ts)
- [../src/hooks/useZipLookup.ts](../src/hooks/useZipLookup.ts)
- [../src/hooks/useIntakeSubmission.ts](../src/hooks/useIntakeSubmission.ts)
- [../src/hooks/useDocumentUpload.ts](../src/hooks/useDocumentUpload.ts)
- [../src/hooks/useEveryActionSubmission.ts](../src/hooks/useEveryActionSubmission.ts)
- [../src/hooks/useEveryActionSubmission.test.ts](../src/hooks/useEveryActionSubmission.test.ts)
- [../src/services/everyActionMapper.ts](../src/services/everyActionMapper.ts)
- [../src/services/everyActionMapper.test.ts](../src/services/everyActionMapper.test.ts)
- [../src/content/index.ts](../src/content/index.ts)
- [../src/content/types.ts](../src/content/types.ts)
- [../src/content/en.ts](../src/content/en.ts)
- [../src/content/es.ts](../src/content/es.ts)

## Bottom line

The project is functionally past the foundation milestone and has a stable UI shell, reusable design system, content architecture that is fully consumed by the app, informational pages, a localized bilingual multi-step intake flow with accessible validation and submission states, a completed navigation polish pass (header/footer, route consistency, intake progress, and route-level orientation), and a finalized service layer (real ZIP/submission/upload adapters behind a service registry and dedicated hooks). The remaining value is validating the full application behavior end-to-end in final QA.