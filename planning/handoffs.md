# Handoffs
This is a frequently updated doc of what the next steps should be. It is sorted by the responsible agent.

## Status
The project is past the foundation milestone and is now in the downstream feature implementation phase. The app shell, design system, content layer, informational routes, and the localized EN/ES intake form flow are in place. The remaining work is concentrated on service-backed behavior (ZIP lookup, submission, document upload), intake form polish, navigation polish, and final QA.

## Current plan position
This repo is in the middle of the product-facing implementation phase, not the startup or infrastructure phase.

Where we are in the plan:
- Foundation is complete and stable.
- Design system is complete and verified.
- Content + localization layer is complete and is now consumed by the app shell, informational pages, and the intake form (no large copy blocks remain inline in components).
- Informational pages for /how-we-help and /intake are complete.
- The intake form flow (ZIP, language, contact, documents, submission) is implemented on /intake/:id and switches live between English and Spanish from the language step.
- Service-backed ZIP/data/submission behavior, intake form polish, navigation polish, and end-to-end QA remain.

The next person picking up work should treat the project as a partially built CAP app with route shells, typed bilingual content, reusable form components, and a working localized intake flow already in place; the next required work is feature refinement, not scaffolding.

## Where we are in the roadmap
- Phase 1: Foundation and app shell — complete
- Phase 2: Design system and reusable UI — complete
- Phase 3: Content and localization — complete (now wired into the app shell, info pages, and intake form)
- Phase 4: Informational pages — complete
- Phase 5: Intake shell and step flow — localized step flow implemented; behavior/UX polish pending (Intake Form Agent)
- Phase 6: ZIP, language, contact, documents, and submission flows — localized flow implemented with live EN/ES switching; service-backed behavior pending (Services Agent)
- Phase 7: Service refinement and accessibility QA — still pending
- Phase 8: Final end-to-end validation and release readiness — still pending

## What still needs to be done
- Wire service-backed ZIP lookup behavior, unknown ZIP handling, and data access (Services Agent).
- Add realistic submission, document upload, and retry behavior behind the service contracts (Services Agent).
- Complete the intake form polish on top of the wired localized flow: step-level validation UX, accessible error summary review, submission/retry refinement, and regression checks (Intake Form Agent).
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
- ZIP lookup data integration and unknown ZIP handling
- more realistic submission strategy (email/API adapters behind the submission abstraction)
- document upload abstraction refinements
- aligning service boundaries with the planned static prototype and future backend architecture

### Intake Form Agent
Start work on:
- finishing intake form behavior polish on top of the localized multi-step Formik flow in IntakePage.tsx (ZIP, language, contact, documents, and submission steps already render from the content layer and switch live between English and Spanish)
- step-level validation UX and accessible error summary pattern review against the plan
- submission/retry state review and any UX refinement
- regression checks on the localized flow after the Services Agent lands

Notes:
- The prior handoff pass only wired copy and localization; the full Intake Form Agent, Services Agent, and QA work is not done.
- The "Start a New Request" CTA lives in IntakeLandingPage.tsx (the old IntakeStartButton export was removed from IntakePage.tsx).
- Unknown ZIP handling and service-backed ZIP lookup messaging will land with the Services Agent.

### Final QA / Integration Agent
Start work on:
- validating the experience as one app
- checking state flow, step navigation, skip logic, and success handling
- confirming accessibility and mobile behavior
- running the final build/test/lint/typecheck checks before signoff

## Completed work

### Foundation
- Vite + React + TypeScript app scaffold
- app routing shell for /how-we-help, /intake, /intake/:id, and not found
- shared domain contracts in [src/types/index.ts](../src/types/index.ts)
- validation foundation in [src/validation/intakeSchema.ts](../src/validation/intakeSchema.ts)
- service boundaries in [src/services/zipService.ts](../src/services/zipService.ts), [src/services/submissionService.ts](../src/services/submissionService.ts), and [src/services/documentUploadService.ts](../src/services/documentUploadService.ts)
- testing, lint, format, and typecheck scripts in [package.json](../package.json)
- Vite config and TS alias setup in [vite.config.ts](../vite.config.ts) and [tsconfig.app.json](../tsconfig.app.json)

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

### Content + Localization Agent ✓
Completed (initial content layer):
- structured English and Spanish content modules in src/content/
- TypeScript interfaces for all content structure (types.ts)
- English content with all approved copy from planning docs (en.ts)
- Spanish translations with professional bilingual parity (es.ts)
- Main export module with getContent() utility (index.ts)
- Usage guide with component integration patterns (USAGE.md)

Completed (content-consumption integration follow-up):
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
- Pages live in the owned route files: src/routes/HowWeHelpPage.tsx and src/routes/IntakeLandingPage.tsx
- Content-driven rendering from the typed content modules; CTA labels come from the content layer (no inline copy)
- Explicit privacy / information notice on /intake rendered from the legal content module
- "Start a New Request" CTA on /intake generates /intake/:id with crypto.randomUUID() and labels from intakeLanding.startCta (moved out of IntakePage.tsx; IntakeStartButton removed)
- Mobile-first layout, accessible heading hierarchy; no nested <main> landmarks, no nested interactive controls
- Route-level regression tests in src/routes/HowWeHelpPage.test.tsx and src/routes/IntakeLandingPage.test.tsx
- Flagged for CAP review: the how-we-help secondary CTA (content.howWeHelp.secondaryCta) still points at url: "#" until a real Consumer Resources URL is supplied (TODO comment in the content module)
- Verified: npm run test, build, lint, typecheck all pass

## High-level notes for future handoff
- The repo is not at a final product state yet; the app is currently in the middle of feature implementation.
- The foundation is stable and should not require additional architecture changes unless a new dependency or service contract becomes necessary.
- Content is centralized and wired into the app; future work should use those modules rather than inline copy.
- The next critical features are service-backed ZIP and submission behavior, intake form polish, and navigation polish.
- QA should happen after the remaining feature agents finish so the app can be validated as one end-to-end experience.
- The application should stay intentionally simple and static for the prototype while preserving a clean path to the eventual CRM/backend architecture.

## Working tree note (current)
The committed code is green (see Verification evidence). The working tree also contains uncommitted, in-flight work from the Intake Form Agent's component/validation extraction pass; leave those files to that agent:
- Modified: src/App.test.tsx, src/routes/IntakePage.tsx, src/validation/intakeSchema.ts
- Untracked: src/components/intake/, src/hooks/, src/validation/documentValidation.ts, src/validation/intakeStepValidation.ts
- Deleted: opencode.json (unrelated removal; do not restore unless intended)
Do not commit, revert, or reformat these files from outside the Intake Form Agent pass.

## Verification evidence
- `cd "c:\Development\cap\cap"; npm run test; npm run build; npm run lint; npm run typecheck` passed (committed HEAD)
- Localization integration pass: `npm run test` (3 files / 9 tests), `npm run build`, `npm run lint`, `npm run typecheck` all pass with the content-wired app shell, info pages, and intake form; EN→Spanish propagation verified end-to-end with a temporary test (language → contact → documents → submission success), removed before commit.

## Agent boundaries (reference)
Each agent is given a task, a scope, allowed files, dependencies, and acceptance criteria. The canonical source is [planning/orchestration.md](./orchestration.md); the highlights below are maintained for quick reference.

### Design system
Purpose: create reusable form controls and layout primitives; build mobile-first form UI primitives; set up button, input, radio group, file input, card, and error presentation.
Allowed scope: src/components/forms/*, src/components/layout/*, src/styles/*
Dependencies: foundation shell and design tokens

### Context + localization
Purpose: move copy into typed content modules; create bilingual content structures for English and Spanish; keep large copy blocks out of components.
Allowed scope: src/content/*
Dependencies: app routes and type contracts

### Navigation Agent
Purpose: implement header/footer shell; wire app routes; prepare the minimal site navigation and landing routes.
Allowed scope: src/components/navigation/*, src/components/layout/*, src/routes/*
Dependencies: foundation app shell and route skeleton

### Informational Pages Agent
Purpose: build /how-we-help and /intake pages; answer "am I in the right place?" and "what happens next?".
Allowed scope: src/routes/HowWeHelpPage.tsx, src/routes/IntakeLandingPage.tsx
Dependencies: content model and navigation shell

### Intake Form Agent
Purpose: implement the Formik intake flow; build ZIP, language, contact, documents, and submission steps.
Allowed scope: src/routes/IntakePage.tsx, src/validation/intakeSchema.ts, src/components/intake/*, src/hooks/useIntakeNavigation.ts
Dependencies: service contracts and validation setup

### Services Agent
Purpose: add zip lookup service and data access; define submission abstraction and document upload adapter.
Allowed scope: src/services/*, src/data/*, src/types/*
Dependencies: shared contracts and route foundation

### Integration / QA Agent
Purpose: ensure the app works end-to-end as one experience; verify state flow, step navigation, skip logic, and success handling.
Allowed scope: repository-wide validation only
Dependencies: all major feature agents