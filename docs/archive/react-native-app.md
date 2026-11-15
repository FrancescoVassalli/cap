> **Archived:** historical React Native implementation plan. The app is implemented; release work is in [planning/mobile-release.md](../../planning/mobile-release.md), status in [architecture/react-native.md](../../architecture/react-native.md).

React Native plan for CAP
The safest approach is to keep the web app and mobile app aligned around the same domain model and submission contract, while letting each platform use native UI patterns. The current repo already has the right separation in src/types/index.ts, src/services/submissionService.ts, and src/routes/AppRouter.tsx, so the mobile build should extend that pattern instead of reinventing it.

Recommended architecture
1) Use a shared domain layer
Create a shared package for:

intake form types
validation rules
submission payloads
service interfaces
error enum definitions
This lets both web and mobile use the same business rules without copying logic.

Suggested structure:

apps/web — existing Vite app
apps/mobile — Expo/React Native app
packages/shared — types, validation, mappers, API contracts
2) Keep API transport behind adapters
The mobile app should follow the same pattern as the web app:

SubmissionService interface
MockSubmissionService
ApiSubmissionService
EmailSubmissionService for demo/dev
That keeps the UI from depending on Native/HTTP details and makes it easy to swap between mock, dev, and real backend calls.

3) Use native-first UI
For mobile:

bottom tab / stack navigation for screen flow
full-width fields with large tap targets
sticky action footer on the final steps
accessibility focus order
semantic labels for screen readers
large contrast colors based on CAP branding
Proposed mobile screens
Core screens
Home / How We Help
Intake landing
Intake flow:
language
personal info
address + zip lookup
contact details
document upload
review
submit
Success / next steps
Error / retry states
Flow alignment with the web app
The existing app already has a “how-we-help” and “intake” flow. The mobile version should mirror that:

/how-we-help → informational landing
/intake → start intake
/intake/:id → multi-step native flow
Shared contracts to preserve
The mobile app should reuse the same value model from src/types/index.ts, especially:

Language
IntakeFormValues
IntakeDocument
SubmissionErrorKind
IntakeSubmissionResult
This is critical because the mobile flow should behave consistently with the web app and make cross-platform QA easier.

Technical stack
Best fit for this repo
Expo
React Native + TypeScript
React Navigation
Formik + Yup
Expo Secure Store
expo-document-picker or expo-image-picker
react-native-safe-area-context
react-native-gesture-handler
optional: expo-location for zip/address enrichment
Why this fits
Keeps the app modern and fast to build
Works well with the existing Formik/Yup usage
Supports mobile-first intake completion
Keeps the app portable to app stores later
Implementation phases
Phase 1: foundation
initialize apps/mobile
configure Expo + TypeScript
add app theme and brand tokens
create app shell, navigation, and mobile layout system
Phase 2: shared domain migration
move shared types/validation into packages/shared
adapt existing mapping and submission interfaces
ensure same validation rules between web and mobile
Phase 3: intake screens
build the stepper-based intake flow
support:
optional zip lookup
language selection
personal info
address
contact info
document attachments
review screen
large tap targets and mobile-friendly forms
Phase 4: document handling
add native file selection and photo capture
store metadata locally before upload
upload only after user review
never include sensitive data in logs or URLs
Phase 5: backend integration
connect mobile app to the same API contract as the web app
use HTTPS only
keep the data model identical to the backend contract
implement retry, network error, and session-expired handling
Phase 6: security and accessibility
screen-reader labels
keyboard focus handling
visible states
no sensitive values in URLs or analytics
secure local storage only
no raw document contents in app logs
Security requirements for mobile
These should be explicit requirements:

never put sensitive info in query parameters
never send PHI to analytics providers
avoid logging document names or raw form payloads
use HTTPS everywhere
use secure storage for transient session state
keep auth/token handling out of the client bundle when possible
upload documents only through approved API routes
allow no third-party tracking scripts or ad networks
Accessibility requirements
The mobile app should target WCAG 2.2 AA-style patterns:

accessible labels for every field
visible focus states
large tap targets at least 44x44 points
form error text tied to the relevant field
sufficient color contrast
support for screen readers
good heading and screen structure
clear success/error states
Production readiness checklist
Before shipping, confirm:

app works on iPhone and Android
intake flow completes on mobile without keyboard overlap
uploads work on low-connectivity networks
all validation errors are user-friendly
submission errors map to proper retry and recovery states
no sensitive data leaks into logs, analytics, or URLs