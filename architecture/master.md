# Architecture Progress Summary

## Current status

The CAP frontend has moved past the initial scaffold phase and is now in the downstream implementation phase. The project is no longer primarily about setup and infrastructure; the informational pages and the localized EN/ES intake form flow are implemented (with accessible validation and submission states), and the remaining work is focused on service-backed refinements (ZIP lookup, submission, document upload), navigation polish, and validating the app as a cohesive experience.

The most current implementation status is captured in [../planning/handoffs.md](../planning/handoffs.md), which identifies the project as being in the product-facing feature stage rather than the startup phase.

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
- ZIP step supports optional lookup with frontend autofill of city/state (still editable), a skip flow, and an unknown-ZIP notice, all via the zip service contract
- Document validation enforces per-file 10 MB, total 50 MB, allowed types (PDF/JPG/JPEG/PNG), and duplicate-file detection with content-driven messages, and shows selected files with per-file Remove
- Submission flow has idle/loading/success/error states with duplicate-click prevention (submit disabled while loading) and renders the reference number on the content-driven success screen; failure renders content-driven error/retry states
- No-persistence requirement preserved: no PHI or consumer data written to browser storage, URL parameters, analytics, or client logs (verified by test)
- Focused regression suite in src/components/intake/IntakeForm.test.tsx covers step navigation (Back/Continue), progress label, ZIP autofill/skip/unknown, required-field and email validation, content-driven success screen with reference number, and no-persistence
- The old `IntakeStartButton` export was removed from IntakePage.tsx; the "Start a New Request" CTA now lives in IntakeLandingPage.tsx
- Known: the `npm run typecheck` script (tsc --noEmit on the solution tsconfig) passes trivially; the production `npm run build` (tsc -b) is the stricter check and is green

## Remaining work

The localized multi-step intake flow is implemented and green, but behavior behind the service contracts and the final presentation pass are still pending:

- Wire service-backed ZIP lookup behavior (data access and unknown ZIP handling) behind the zip service contract
- Add realistic submission, document upload, and retry behavior behind the submission and document-upload adapters
- Finish navigation polish and route consistency across the app shell (header behavior feel calm and mobile-friendly during the intake flow)
- Validate the complete end-to-end experience in QA (state flow, step navigation, skip logic, success handling, accessibility, mobile behavior) before signoff

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
- [../src/routes/AppRouter.tsx](../src/routes/AppRouter.tsx) (also holds the content-driven NotFoundPage)
- [../src/routes/HowWeHelpPage.tsx](../src/routes/HowWeHelpPage.tsx)
- [../src/routes/IntakeLandingPage.tsx](../src/routes/IntakeLandingPage.tsx)
- [../src/routes/IntakePage.tsx](../src/routes/IntakePage.tsx)
- [../src/components/intake/IntakeForm.tsx](../src/components/intake/IntakeForm.tsx) (with ZipStep, LanguageStep, ContactStep, DocumentsStep, SubmissionSuccess, SubmissionError, ErrorSummary, and IntakeForm.test.tsx)
- [../src/hooks/useIntakeNavigation.ts](../src/hooks/useIntakeNavigation.ts)
- [../src/validation/intakeSchema.ts](../src/validation/intakeSchema.ts)
- [../src/validation/intakeStepValidation.ts](../src/validation/intakeStepValidation.ts)
- [../src/validation/documentValidation.ts](../src/validation/documentValidation.ts)
- [../src/routes/HowWeHelpPage.test.tsx](../src/routes/HowWeHelpPage.test.tsx)
- [../src/routes/IntakeLandingPage.test.tsx](../src/routes/IntakeLandingPage.test.tsx)
- [../src/components/layout/AppShell.tsx](../src/components/layout/AppShell.tsx)
- [../src/types/index.ts](../src/types/index.ts)
- [../src/services/zipService.ts](../src/services/zipService.ts)
- [../src/services/submissionService.ts](../src/services/submissionService.ts)
- [../src/services/documentUploadService.ts](../src/services/documentUploadService.ts)
- [../src/content/index.ts](../src/content/index.ts)
- [../src/content/types.ts](../src/content/types.ts)
- [../src/content/en.ts](../src/content/en.ts)
- [../src/content/es.ts](../src/content/es.ts)

## Bottom line

The project is functionally past the foundation milestone and has a stable UI shell, reusable design system, content architecture that is fully consumed by the app, informational pages, and a localized bilingual multi-step intake flow with accessible validation and submission states in place. The remaining value is in wiring service-backed behavior (ZIP lookup, submission, uploads), navigation polish, and verifying the full application behavior end-to-end.