# Handoffs
This is a frequently updated doc of what the next steps should be. It is sorted by the responsible agent.

## Status
The project is past the foundation milestone and is now in the downstream feature implementation phase. The app shell, design system, content layer, and informational routes are in place, and the remaining work is concentrated on the intake experience, service integrations, and final QA.

## Current plan position
This repo is in the middle of the product-facing implementation phase, not the startup or infrastructure phase.

Where we are in the plan:
- Foundation is complete and stable.
- Design system is complete and verified.
- Content + localization layer is complete.
- Informational pages for /how-we-help and /intake are complete.
- The intake form flow itself is still pending.
- Navigation polish, service behavior, and end-to-end QA remain.

This means the next person picking up work should treat the project as a partially built CAP app with route shells, typed content, and reusable form components already in place; the next required work is feature completion rather than scaffolding.

## Where we are in the roadmap
- Phase 1: Foundation and app shell — complete
- Phase 2: Design system and reusable UI — complete
- Phase 3: Content and localization — complete
- Phase 4: Informational pages — complete
- Phase 5: Intake shell and step flow — still pending
- Phase 6: ZIP, language, contact, documents, and submission flows — still pending
- Phase 7: Service refinement and accessibility QA — still pending
- Phase 8: Final end-to-end validation and release readiness — still pending

## What still needs to be done
- Implement the multi-step Formik intake flow on /intake/:id.
- Build ZIP lookup behavior, skip flow, and unknown ZIP handling.
- Add the language, contact, and documents steps with validation and accessible error states.
- Define the final submission behavior and success/error states.
- Preserve the no-persistence requirement and ensure no PHI is stored in browser storage.
- Finish route/navigation polish so the app shell feels calm and mobile-first.
- Validate the full experience as one app with real end-to-end behavior and regression checks.

## Next agent assignments

### Navigation Agent
Start work on:
- site header/footer layout refinement and styling
- route-level page wiring and navigation patterns
- ensuring the app shell is consistent across the informational and intake experiences
- making the header behavior feel calm and mobile-friendly while the user is in the intake flow

### Services Agent
Start work on:
- ZIP lookup data integration
- more realistic submission strategy
- document upload abstraction refinements
- aligning service boundaries with the planned static prototype and future backend architecture

### Intake Form Agent
Start work on:
- Formik multi-step intake flow
- ZIP, language, contact, and document steps
- validation UX and submission state handling
- preserving the no-persistence requirement and keeping PHI out of browser storage
- using step-level validation and accessible error summary patterns described in the plan

### Final QA / Integration Agent
Start work on:
- validating the experience as one app
- checking state flow, step navigation, skip logic, and success handling
- confirming accessibility and mobile behavior
- running the final build/test/lint/typecheck checks before signoff

## High-level notes for future handoff
- The repo is not at a final product state yet; the app is currently in the middle of feature implementation.
- The foundation is stable and should not require additional architecture changes unless a new dependency or service contract becomes necessary.
- Content is centralized and ready for page-level consumption; future work should use those modules rather than inline copy.
- The next critical features are route/navigation polish, service-backed ZIP and submission behavior, and the full intake form workflow.
- QA should happen after the remaining feature agents finish so the app can be validated as one end-to-end experience.
- The application should stay intentionally simple and static for the prototype while preserving a clean path to the eventual CRM/backend architecture.

## Foundation
Completed:
- Vite + React + TypeScript app scaffold
- app routing shell for /how-we-help, /intake, /intake/:id, and not found
- shared domain contracts in [src/types/index.ts](../src/types/index.ts)
- validation foundation in [src/validation/intakeSchema.ts](../src/validation/intakeSchema.ts)
- service boundaries in [src/services/zipService.ts](../src/services/zipService.ts), [src/services/submissionService.ts](../src/services/submissionService.ts), and [src/services/documentUploadService.ts](../src/services/documentUploadService.ts)
- testing, lint, format, and typecheck scripts in [package.json](../package.json)
- Vite config and TS alias setup in [vite.config.ts](../vite.config.ts) and [tsconfig.app.json](../tsconfig.app.json)

## Completed work
### Design System Agent ✓
Completed:
- tailwind.config.ts with CAP brand color tokens
- Reusable form primitives: Button, TextInput, EmailInput, PhoneInput, ZipInput, Select, Textarea, Checkbox, RadioGroup, FileInput
- FormField wrapper for label, error, hint integration
- Feedback components: FormError, FormHint, Card, Alert, ProgressBar
- Layout components: Container, FormFooter, AppShell
- Comprehensive [design](./design.md) documentation
- All accessibility (WCAG 2.2 AA) and mobile-first requirements implemented
- Verified: npm run build, lint, test, typecheck, dev all pass

## Next agent assignments

### Content + Localization Agent ✓
Completed:
- structured English and Spanish content modules in src/content/
- TypeScript interfaces for all content structure (types.ts)
- English content with all approved copy from planning docs (en.ts)
- Spanish translations with professional bilingual parity (es.ts)
- Main export module with getContent() utility (index.ts)
- Usage guide with component integration patterns (USAGE.md)
- All checks verified: build, test, lint, typecheck all pass

### Informational Pages Agent ✓
Completed:
- /how-we-help page with hero, service grid, process steps, expectations, and CTAs
- /intake landing page with orientation, what-you-need guidance, and trust messaging
- Content-driven rendering from structured copy modules
- Mobile-first layout and accessible heading hierarchy
- RadioGroup accessibility fix for language selection
- Route-level regression tests validating page content and intake flow
- All tests passing: npm run test succeeds

### Navigation Agent
Start work on:
- site header/footer layout refinement and styling
- route-level page wiring and navigation patterns
- ensuring the app shell is consistent across the informational and intake experiences
- making the header behavior feel calm and mobile-friendly while the user is in the intake flow

### Services Agent
Start work on:
- zip lookup data integration
- more realistic submission strategy
- document upload abstraction refinements
- aligning service boundaries with the planned static prototype and future backend architecture

### Intake Form Agent
Start work on:
- Formik multi-step intake flow
- ZIP, language, contact, and document steps
- validation UX and submission state handling
- preserving the no-persistence requirement and keeping PHI out of browser storage
- using step-level validation and accessible error summary patterns described in the plan

## High-level notes for future handoff
- The repo is not at a final product state yet; the app is currently in the middle of feature implementation.
- The foundation is stable and should not require additional architecture changes unless a new dependency or service contract becomes necessary.
- Content is centralized and ready for page-level consumption; future work should use those modules rather than inline copy.
- The next critical features are route/navigation polish, service-backed ZIP and submission behavior, and the full intake form workflow.
- QA should happen after the remaining feature agents finish so the app can be validated as one end-to-end experience.

## Verification evidence
- `cd "c:\Development\cap\cap"; npm run test; npm run build; npm run lint; npm run typecheck` passed
- `cd "c:\Development\cap\cap"; npm run dev -- --host 0.0.0.0` started successfully and Vite reported the app at http://localhost:5173/

## Notes
This foundation is intentionally minimal and stable. It is ready for downstream feature implementation without requiring any further infrastructure changes.
tsconfig.json
tsconfig.app.json
tsconfig.node.json
eslint.config.js
.prettierrc
index.html
src/main.tsx
src/App.tsx
src/routes/
AppRouter.tsx
HowWeHelpPage.tsx
IntakeLandingPage.tsx
IntakePage.tsx
NotFoundPage.tsx
src/components/layout/
src/components/navigation/
src/components/forms/
src/content/
src/types/
src/validation/
src/services/
src/hooks/
src/data/
src/styles/
src/test/
Definition of done for the foundation
The foundation should be considered ready only when all of these pass:

npm run dev starts the app
npm run build succeeds
npm run test passes
npm run lint passes
npm run typecheck passes
app shell renders without forcing page-level logic
route layout is ready for page agents
validation and service contracts are clear
design tokens exist for downstream UI work

## Design system
Purpose:

create reusable form controls and layout primitives
build mobile-first form UI primitives
set up button, input, radio group, file input, card, and error presentation
Allowed scope:

src/components/forms/*
src/components/layout/*
src/styles/*
Dependencies:

foundation shell and design tokens

## Context localization 
Purpose:

move copy into typed content modules
create bilingual content structures for English and Spanish
keep large copy blocks out of components
Allowed scope:

src/content/*
Dependencies:

app routes and type contracts

## Navigation Agent
Purpose:

implement header/footer shell
wire app routes
prepare the minimal site navigation and landing routes
Allowed scope:

src/components/navigation/*
src/components/layout/*
src/routes/*
Dependencies:

foundation app shell and route skeleton

## Informational Pages Agent
Purpose:

build /how-we-help and /intake pages
answer “am I in the right place?” and “what happens next?”
Allowed scope:

src/routes/HowWeHelpPage.tsx
src/routes/IntakeLandingPage.tsx
Dependencies:

content model and navigation shell

## Intake Form Agent
Purpose:

implement the Formik intake flow
build ZIP, language, contact, documents, and submission steps
Allowed scope:

src/routes/IntakePage.tsx
src/validation/intakeSchema.ts
src/components/intake/*
src/hooks/useIntakeNavigation.ts
Dependencies:

service contracts and validation setup

## Services Agent
Purpose:

add zip lookup service and data access
define submission abstraction and document upload adapter
Allowed scope:

src/services/*
src/data/*
src/types/*
Dependencies:

shared contracts and route foundation

## Integration / QA Agent
Purpose:

ensure the app works end-to-end as one experience
verify state flow, step navigation, skip logic, and success handling
Allowed scope:

repository-wide validation only
Dependencies:

all major feature agents