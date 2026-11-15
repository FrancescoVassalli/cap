> **Archived:** historical agent orchestration guide for the completed frontend build. Current scope is in [planning/master.md](../../planning/master.md); open work is in [planning/handoffs.md](../../planning/handoffs.md).

# Agent Orchestration 
Here is a orchestration guide for creating agents to implement the [frontend implementation plan](./frontend-implementation.md)

                         ┌─────────────────────┐
                         │  0. ORCHESTRATOR     │
                         │  Lead / Integrator   │
                         └──────────┬──────────┘
                                    │
                    ┌───────────────┼────────────────┐
                    │               │                │
                    ▼               ▼                ▼
             ┌───────────┐   ┌────────────┐   ┌─────────────┐
             │ 1. ARCH   │   │ 2. DESIGN  │   │ 3. CONTENT  │
             │ Foundation│   │ System     │   │ / i18n      │
             └─────┬─────┘   └─────┬──────┘   └──────┬──────┘
                   │               │                  │
                   └───────────────┼──────────────────┘
                                   ▼
                         ┌───────────────────┐
                         │ 4. SHARED UI      │
                         │ Components/Layout │
                         └─────────┬─────────┘
                                   │
                    ┌──────────────┼─────────────────┐
                    │              │                 │
                    ▼              ▼                 ▼
             ┌────────────┐ ┌────────────┐ ┌──────────────┐
             │ 5. INFO    │ │ 6. INTAKE  │ │ 7. SERVICES  │
             │ PAGES      │ │ FORM       │ │ / DATA       │
             └────────────┘ └─────┬──────┘ └──────────────┘
                                  │
                                  ▼
                         ┌───────────────────┐
                         │ 8. INTEGRATION    │
                         │ / STATE / ERRORS  │
                         └─────────┬─────────┘
                                   │
                  ┌────────────────┼────────────────┐
                  │                │                │
                  ▼                ▼                ▼
           ┌────────────┐  ┌────────────┐  ┌─────────────┐
           │ 9. TEST    │  │ 10. A11Y   │  │ 11. SECURITY │
           │ AGENT      │  │ AUDITOR    │  │ AUDITOR      │
           └──────┬─────┘  └─────┬──────┘  └──────┬──────┘
                  └──────────────┼─────────────────┘
                                 ▼
                       ┌────────────────────┐
                       │ 12. RELEASE AGENT  │
                       │ Build / Deploy     │
                       └────────────────────┘

## Lead 
Role: Own the implementation from beginning to end.

This is the highest-level agent and should not do most of the coding itself.

Responsibilities
Read the implementation guide.
Establish the repository structure.
Create the implementation task graph.
Assign work to other agents.
Track dependencies.
Prevent agents from modifying the same files unnecessarily.
Review agent output.
Run integration after each major wave.
Resolve conflicts.
Decide when the implementation is ready for audit.
Maintain the definition of done.

The source explicitly defines a fairly strict architectural boundary between components, hooks, services, content, types, and validation. The orchestrator should enforce this boundary.

Every agent gets:
* Task
* Scope
* Allowed files
* Dependencies
* Acceptance criteria
* Tests required
* Files it must NOT modify

For example:
Agent: ZIP Service

Allowed:
  src/services/zipService.ts
  src/data/zipCodes.json
  src/hooks/useZipLookup.ts
  tests/zipService.test.ts

Do not modify:
  IntakePage
  Formik configuration
  global CSS
  routing

Acceptance:
  80203 -> Denver, CO
  blank -> null
  unknown ZIP -> null
  no component imports zipCodes.json directly

## Foundation Agent
### Owns
* package.json
* vite.config.*
* tsconfig.*
* eslint.*
* prettier.*
* src/main.tsx
* src/App.tsx
* src/types/
* src/content/
* src/validation/
* test configuration

### Tasks
* Initialize/clean the Vite React TypeScript application.
* Install:
    * React
    * React Router
    * Formik
    * Yup
    * Tailwind
    * Vitest
    * React Testing Library
    * Playwright
* Establish directory structure.
* Establish path aliases if desired.
* Configure linting.
* Configure formatting.
* Configure testing.
* Configure production build.
* Establish initial interfaces.

### Deliverable
A completely boring but working application:
* npm run dev
* npm run build
* npm run test
* npm run lint
* npm run typecheck
all work 
Do not let this agent build pages.

## Design-System Agent

Can run in parallel with Agent 1 after the basic project exists.

### Owns
src/styles/
src/components/forms/
src/components/layout/
src/components/feedback/

### Builds
* Primitive UI:
* Button
* TextInput
* EmailInput
* PhoneInput
* ZipInput
* Select
* RadioGroup
* FileInput
* Textarea
* Checkbox
* FormField
* FormError
* FormHint
* Card

### Design requirements 
* CAP/CCHI visual identity
* Mobile first
* 44–48px interaction targets
* visible focus
* semantic markup
* responsive containers
* typography
* error/success states

This agent should not implement business behavior.

## Content + Localization

#### Owns
src/content/

#### Creates 
* howWeHelp.ts
* intake.ts
* navigation.ts
* legal.ts
* en/
* es/

#### Responsibilities
* Extract approved copy from the specification.
* Structure it as data.
* Create English and Spanish content interfaces.
* Ensure components don't contain large blocks of CAP copy.
* Flag copy that needs human/CAP approval rather than inventing policy language.

## Navigation
### Owns
* src/components/layout/
* src/components/navigation/
* src/components/icons/
* src/routes/router.tsx

### Implements
* SiteLayout
* Header
* Footer
* MobileMenu
* IntakeHeader
* Navigation
* /how-we-help
* /intake
* /intake/:id
* *

## Informational Pages
### Owns
* src/routes/HowWeHelpPage.tsx
* src/routes/IntakeLandingPage.tsx

### Implements
#### how we help 
* Hero
* What We Help With
* How CAP Works
* What CAP Doesn't Do
* Expectations
* CTA
#### intake
* Introduction
* What You'll Need
* Privacy/information notice
* Start New Request

### Acceptance 
A first-time visitor should understand:

Am I in the right place?

and:

What happens if I continue?

without needing to start the form.

## Intake Form
Make create subagents 
### Owns
* src/routes/IntakePage.tsx
* src/components/intake/
* src/hooks/useIntakeNavigation.ts
* src/validation/intakeSchema.ts

### Implements 
Formik
 └── IntakeForm
      ├── ZipStep
      ├── LanguageStep
      ├── ContactStep
      ├── DocumentsStep
      └── Submission

### subtasks
6A — Intake shell
Formik provider
initial values
current step
progress
navigation
success state
6B — ZIP
five-digit validation
optional skip
lookup
loading
unknown ZIP behavior
6C — Language
English
Español
accessible radio group
6D — Contact
names
email
phone
address
autocomplete attributes
editable city/state
6E — Documents
file picker
validation
selected-file display
remove file
upload abstraction
6F — Submission
submit
loading
success
error
duplicate-click prevention

## Services 
### Owns 
src/services/
src/data/
src/types/
Implements
zipService
submissionService
documentUploadService

with adapters:

MockSubmissionService
EmailSubmissionService
ApiSubmissionService

The source explicitly identifies the submission abstraction as one of the highest-value architectural decisions because it allows the static prototype to be replaced by a backend without rewriting the intake UI.

ZIP
interface ZipService {
  lookup(zip: string): ZipLocation | null;
}

The UI should never directly import the JSON dataset.

Document upload
interface DocumentUploadService {
  upload(
    file: File,
    intakeId: string
  ): Promise<UploadedDocument>;
}

Prototype:

LocalDocumentUploadService

Production:

PresignedS3DocumentUploadService

The guide deliberately calls for this abstraction.

## Integration 
After the major implementation agents finish, give a fresh agent the repository.

Its job is not to add features.

Its job is to ask:

Does this actually work as one application?
Checks
* Formik state survives step changes.
* Back/Continue works.
* Browser navigation is sensible.
* Skip ZIP works.
* Unknown ZIP works.
* City/state autofill works but remains editable.
* Documents can be skipped.
* Submission state is correct.
* Success page receives reference number.
* Errors don't expose exceptions.
* No accidental persistence exists.
* Language selection propagates correctly.

## Testing
Give this agent a fresh context and read-only-first mandate.
Owns
tests/
src/**/*.test.*
playwright/
Unit tests
ZIP lookup
validation
step navigation
document validation
submission state
formatting
Component tests
labels
errors
keyboard
disabled states
loading
file selection
navigation
E2E

Primary happy path:

/how-we-help
    ↓
/intake
    ↓
start
    ↓
ZIP
    ↓
language
    ↓
contact
    ↓
skip documents
    ↓
submit
    ↓
success

Plus failure cases:

invalid email
invalid ZIP
unknown ZIP
missing required field
submission failure
duplicate click

## Accessibility
his should be a specialized adversarial agent, not the same agent that wrote the components.

Goal

Find accessibility bugs.

Test
keyboard-only navigation
Tab order
Shift+Tab
Enter/Space
radio groups
file picker
error focus
screen-reader semantics
labels
aria-invalid
aria-describedby
required fields
focus visibility
heading hierarchy
contrast
200% zoom
narrow viewport
reflow

Run automated axe tests plus manual-style inspection.

The target is explicitly WCAG 2.2 AA, with automated axe, keyboard, screen-reader, focus, mobile, zoom/reflow, and contrast testing required

