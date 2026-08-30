# Handoffs
This is a frequently updated doc of what the next steps should be. It is sorted by the responsible agent.

## Status
The project is past the foundation milestone and is now in the downstream feature implementation phase. The app shell, design system, content layer, informational routes, and the localized intake form flow are in place, and the remaining work is concentrated on service integrations (ZIP lookup, submission, document upload), navigation polish, and final QA.

## Current plan position
This repo is in the middle of the product-facing implementation phase, not the startup or infrastructure phase.

Where we are in the plan:
- Foundation is complete and stable.
- Design system is complete and verified.
- Content + localization layer is complete and now consumed by the app shell, info pages, and intake form.
- Informational pages for /how-we-help and /intake are complete.
- The intake form flow (ZIP, language, contact, documents, submission) is implemented and switches live between English and Spanish.
- Service-backed ZIP/data/submission behavior, navigation polish, and end-to-end QA remain.

This means the next person picking up work should treat the project as a partially built CAP app with route shells, typed content, and reusable form components already in place; the next required work is feature completion rather than scaffolding.

## Where we are in the roadmap
- Phase 1: Foundation and app shell — complete
- Phase 2: Design system and reusable UI — complete
- Phase 3: Content and localization — complete
- Phase 4: Informational pages — complete
- Phase 5: Intake shell and step flow — in-app step flow implemented; behavior/UX polish pending (Intake Form Agent)
- Phase 6: ZIP, language, contact, documents, and submission flows — localized flow implemented with live EN/ES switching; service-backed behavior pending with the Services Agent
- Phase 7: Service refinement and accessibility QA — still pending
- Phase 8: Final end-to-end validation and release readiness — still pending

## What still needs to be done
- Wire service-backed ZIP lookup behavior, unknown ZIP handling, and data access (Services Agent).
- Add realistic submission, document upload, and retry behavior behind the service contracts (Services Agent).
- Complete the intake form polish on top of the wired localized flow: accessible error summary review, submission/retry behavior refinement, and regression checks (Intake Form Agent).
- Finish route/navigation polish so the app shell feels calm and mobile-first, including the intake experience (Navigation Agent).
- Validate the full app as one experience with end-to-end and regression checks (Integration / QA Agent).

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
- finish the intake form polish on top of the localized flow already wired in IntakePage.tsx (ZIP, language, contact, documents, and submission steps render from the content layer and switch live between English and Spanish)
- accessible error summary pattern review against the plan's description
- submission/retry state review and any UX refinement
- regression checks on the localized flow after the Services Agent lands

Notes:
- This pass only wired copy and localization; the full Intake Form Agent, Services Agent, and QA work is not done.
- The "Start a New Request" CTA lives in IntakeLandingPage.tsx (the old IntakeStartButton export was removed from IntakePage.tsx).
- Unknown ZIP handling and service-backed ZIP lookup messaging will land with the Services Agent.

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
- Content-consumption integration follow-up ✓ (this pass):
  - AppShell consumes content for brand, nav labels, nav aria-label, and footer copy.
  - AppRouter's NotFoundPage renders entirely from content.notFound (no inline not-found copy); the informational pages consume content per-route (eyebrow, step kicker) from their own owned route files (HowWeHelpPage.tsx, IntakeLandingPage.tsx) with component-scoped getContent calls.
  - IntakePage renders the whole form from getContent(values.language) inside the Formik render prop, so selecting Español on the language step switches the rest of the flow (labels, hints, validation messages, ZIP notice, document copy, buttons, and error screen) live to Spanish; validation messages come from the content layer via the step validator, and the success screen preserves the selected language through a submittedLanguage snapshot.
  - Added bilingual keys (EN/ES parity): navigation.brand, navigation.mainNav.ariaLabel, howWeHelp.howItWorks.stepLabel, intakeForm.stepLabels, intakeForm.documents (chooseFiles/remove/skipButtonLabel), intakeForm.errors (zipMustBeFiveDigits/selectLanguage), and notFound.
  - Fixed a value-override bug on the language step: RadioGroup spreads {...props} after value={option.value}, so passing value={values.language} forced every radio to the current language value (Spanish could never be selected). Removed the value prop from the IntakePage usage; Formik handleChange reads the radio's own value.
  - Baseline regression suite (src/App.test.tsx and route tests) unchanged; EN→ES propagation verified with a temporary Spanish test, then removed before commit.
- All checks verified: npm run test, build, lint, typecheck all pass.

### Informational Pages Agent ✓
Completed:
- /how-we-help page with hero, service grid, process steps, expectations, and CTAs
- /intake landing page with orientation, what-you-need guidance, trust/privacy, and eligibility messaging
- Pages live in the owned route files: src/routes/HowWeHelpPage.tsx and src/routes/IntakeLandingPage.tsx (previously inlined in AppRouter.tsx)
- Content-driven rendering from the typed content modules; CTA labels come from the content layer (no inline copy)
- Explicit privacy / information notice on /intake rendered from the legal content module
- "Start a New Request" CTA on /intake generates /intake/:id with crypto.randomUUID() and labels from intakeLanding.startCta (moved out of IntakePage.tsx; IntakeStartButton removed)
- Mobile-first layout, accessible heading hierarchy; no nested <main> landmarks, no nested interactive controls
- Route-level regression tests in src/routes/HowWeHelpPage.test.tsx and src/routes/IntakeLandingPage.test.tsx
- Flagged for CAP review: the how-we-help secondary CTA (content.howWeHelp.secondaryCta) still points at url: "#" until a real Consumer Resources URL is supplied (TODO comment in the content module)
- Verified: npm run test, build, lint, typecheck all pass

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
- finishing the intake form polish on top of the localized multi-step Formik flow in IntakePage.tsx (ZIP, language, contact, documents, submission)
- step-level validation and accessible error summary pattern review against the plan
- submission/retry behavior refinement and regression checks
- the flow already switches live between English and Spanish from the language step; the remaining Intake Form Agent work is behavior/UX polish, not copy authoring

## High-level notes for future handoff
- The repo is not at a final product state yet; the app is currently in the middle of feature implementation.
- The foundation is stable and should not require additional architecture changes unless a new dependency or service contract becomes necessary.
- Content is centralized and ready for page-level consumption; future work should use those modules rather than inline copy.
- The next critical features are route/navigation polish, service-backed ZIP and submission behavior, and the full intake form workflow.
- QA should happen after the remaining feature agents finish so the app can be validated as one end-to-end experience.

## Verification evidence
- `cd "c:\Development\cap\cap"; npm run test; npm run build; npm run lint; npm run typecheck` passed
- `cd "c:\Development\cap\cap"; npm run dev -- --host 0.0.0.0` started successfully and Vite reported the app at http://localhost:5173/
- Localization integration pass: `npm run test` (3 files / 9 tests), `npm run build`, `npm run lint`, `npm run typecheck` all pass with the content-wired app shell, info pages, and intake form; EN→Spanish propagation verified end-to-end with a temporary test (language → contact → documents → submission success), removed before commit.

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