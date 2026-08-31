# Handoffs
This is the current implementation handoff for the CAP project. It reflects the verified state of the repo and the remaining work needed before the project is ready for final integration. Each section below is for a particular agent to read from.

## react-native-app — mobile app implementation

Drives the [React Native plan](./react-native-app.md) for the CAP mobile app. Web app and API are already implemented; backend deployment steps in master.md remain blocked on external dependencies (AWS credentials, CRM contract) and are not part of this handoff.

### Next steps

1. **Phase 1: mobile foundation**
   - Initialize `apps/mobile` as an Expo + React Native + TypeScript app (Node 20 available).
   - Configure project scripts, TypeScript, and Expo entry.
   - Add app theme and CAP/CCHI brand tokens (primary #01599a, secondary #7aabdb, highlight #fec524; Inter typeface; 44pt touch targets).
   - Create the app shell, navigation (React Navigation), and mobile layout system.
   - Acceptance: `apps/mobile` shows the app shell on first launch; theme tokens render; no web-only imports leak in.

2. **Phase 2: shared domain contract**
   - Create `packages/shared` housing the domain model now in `src/types/index.ts`: `Language`, `IntakeFormValues`, `IntakeDocument`, `SubmissionErrorKind`, `IntakeSubmissionResult`, service interfaces (`SubmissionService`, `DocumentUploadService`, `ZipService`), and validation rules.
   - Wire the web app to consume `packages/shared` (path alias without breaking the existing build/tests).
   - Acceptance: web build/tests stay green; web and mobile import the same domain types and validation rules.

3. **Phase 3: native intake screens**
   - Stepper-based flow mirroring the web app: home/how-we-help, intake landing, then ZIP → language → contact → documents → review → submit → success.
   - Large tap targets, full-width fields, sticky action footer, accessible focus order, semantic labels.
   - Acceptance: full intake completes on mobile without keyboard overlap.

4. **Phase 4: document handling**
   - Native file selection and photo capture, metadata stored locally (SecureStore), upload only after review, no sensitive data in logs or URLs.

5. **Phase 5: backend integration**
   - Connect mobile to the same API contract as the web app (HTTPS only), with retry, network-error, and session-expired handling.

6. **Phase 6: security + accessibility**
   - WCAG 2.2 AA patterns: accessible labels, visible focus, 44pt targets, field-tied errors, contrast, success/error states, secure storage, no PHI in analytics/logs/URLs.