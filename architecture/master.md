# Architecture Progress Summary

## Current status

The CAP frontend has moved past the initial scaffold phase and is now in the downstream implementation phase. The project is no longer primarily about setup and infrastructure; the informational pages and the localized intake form flow are implemented, and the remaining work is focused on service-backed refinements (ZIP lookup, submission, document upload), navigation polish, and validating the app as a cohesive experience.

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
- Typed English and Spanish content modules
- Centralized copy for informational and flow-related UI
- Clear separation between content model and components to support future localization updates

### Informational pages
- /how-we-help page with the service overview, process steps, expectations, and trust-building content
- /intake landing page with orientation, what-you-need guidance, and an explicit privacy / information notice
- Both pages live in dedicated owned route files (src/routes/HowWeHelpPage.tsx and src/routes/IntakeLandingPage.tsx) and render entirely from the typed content modules; section copy and CTA labels come from the content layer rather than inline strings
- The Start CTA on /intake is content-driven and generates /intake/:id via crypto.randomUUID(), so visitors only enter the form once they are oriented and know what to expect
- Accessible, mobile-first structure: no nested <main> landmarks, no nested interactive controls, semantic heading hierarchy, keyboard-accessible actions, and visible focus states
- Route-level regression tests (src/routes/HowWeHelpPage.test.tsx and src/routes/IntakeLandingPage.test.tsx) cover the eligibility/orientation content and the CTA flow into the intake route
- Known placeholder: the secondary CTA on /how-we-help (content.howWeHelp.secondaryCta) still links to url: "#" and needs a real Consumer Resources URL from CAP review

## Remaining work

The multi-step intake form flow (ZIP, language, contact, documents, submission) is implemented on /intake/:id with live EN/ES switching, step-level validation, success/error states, and the no-persistence requirement (no PHI stored in browser storage). The remaining work is concentrated on service behavior, navigation polish, and final validation:

- Wire service-backed ZIP lookup behavior, skip logic, and unknown ZIP handling
- Add realistic submission, document upload, and retry behavior behind the service contracts
- Finish navigation polish and route consistency across the app shell
- Validate the complete end-to-end experience in QA

## Architecture direction

The application is intentionally designed as a static, mobile-first frontend prototype that can later be connected to a CRM or backend workflow. The architecture stays simple and explicit:

- React + TypeScript for a predictable frontend
- Vite for a lightweight build/dev workflow
- Tailwind for styling and responsive design
- Formik + Yup for intake validation flow
- Centralized content modules for bilingual copy
- Service abstractions for ZIP lookup, submission, and document upload
- No browser persistence for intake data to keep sensitive information out of local storage

## Key implementation files

- [../src/App.tsx](../src/App.tsx)
- [../src/routes/AppRouter.tsx](../src/routes/AppRouter.tsx)
- [../src/routes/HowWeHelpPage.tsx](../src/routes/HowWeHelpPage.tsx)
- [../src/routes/IntakeLandingPage.tsx](../src/routes/IntakeLandingPage.tsx)
- [../src/routes/HowWeHelpPage.test.tsx](../src/routes/HowWeHelpPage.test.tsx)
- [../src/routes/IntakeLandingPage.test.tsx](../src/routes/IntakeLandingPage.test.tsx)
- [../src/types/index.ts](../src/types/index.ts)
- [../src/validation/intakeSchema.ts](../src/validation/intakeSchema.ts)
- [../src/services/zipService.ts](../src/services/zipService.ts)
- [../src/services/submissionService.ts](../src/services/submissionService.ts)
- [../src/services/documentUploadService.ts](../src/services/documentUploadService.ts)
- [../src/content/index.ts](../src/content/index.ts)

## Bottom line

The project is functionally past the foundation milestone and has a stable UI shell, reusable design system, content architecture, informational pages, and an implemented localized intake flow in place. The remaining value is in wiring service-backed behavior (ZIP lookup, submission, uploads), navigation polish, and verifying the full application behavior end-to-end.
