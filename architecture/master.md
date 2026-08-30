# Architecture Progress Summary

## Current status

The CAP frontend has moved past the initial scaffold phase and is now in the downstream implementation phase. The project is no longer primarily about setup and infrastructure; the remaining work is focused on completing the intake flow, integrating service behaviors, and validating the app as a cohesive experience.

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

### Informational routes
- /how-we-help page with the service overview and trust-building content
- /intake landing page with orientation and next-step guidance
- Route-level structure ready for later flow implementation

## Remaining work

The main remaining gap is the intake experience itself:

- Build the multi-step Formik intake flow on /intake/:id
- Implement ZIP lookup, skip logic, and unknown ZIP handling
- Add the language, contact, and documents steps with validation and error feedback
- Define final submission UX and success/error states
- Preserve the no-persistence requirement and avoid storing PHI in browser storage
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
- [../src/types/index.ts](../src/types/index.ts)
- [../src/validation/intakeSchema.ts](../src/validation/intakeSchema.ts)
- [../src/services/zipService.ts](../src/services/zipService.ts)
- [../src/services/submissionService.ts](../src/services/submissionService.ts)
- [../src/services/documentUploadService.ts](../src/services/documentUploadService.ts)
- [../src/content/index.ts](../src/content/index.ts)

## Bottom line

The project is functionally past the foundation milestone and has a stable UI shell, reusable system, and content architecture in place. The remaining value is in shipping the intake flow and verifying the full application behavior end-to-end.
