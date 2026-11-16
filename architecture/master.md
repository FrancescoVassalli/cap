# Architecture Progress Summary

## Current status

CAP is in late-stage implementation: the web intake experience, backend API, and live AWS deployment are in place, with remaining work focused on production hardening and release readiness. The public web flow (informational pages and bilingual EN/ES intake with validation and submission states), branded mobile-first UI, adapter-based service layer, and a verified presigned document-upload flow are implemented. The static frontend, API Gateway, and Lambda are deployed live; CloudFront/OAC and the EveryAction CRM integration remain open, alongside final QA/accessibility sign-off and the mobile store release.

Open work is tracked in [../planning/handoffs.md](../planning/handoffs.md). Feature-level implementation detail moved from this summary lives in [frontend-details.md](./frontend-details.md); mobile details remain in [react-native.md](./react-native.md). Historical context is retained in [../docs/archive/implementation-audit.md](../docs/archive/implementation-audit.md).

## Completed work (quarterly view)

### Web experience and intake
- Delivered the public site shell and informational pages, plus a localized multi-step intake (ZIP, language, contact, documents, submission) with live EN/ES switching, accessible validation/error handling, and clear submission states.
- Established a mobile-first, WCAG-aware UI on CAP/CCHI branding (reusable form/layout primitives, branded shell/navigation, intake progress, focus and route-orientation behavior).

### Content, services, and data flow
- Centralized bilingual copy in typed content modules consumed at render time (no large inline copy blocks).
- Implemented real, swappable service adapters behind registries/hooks for ZIP lookup, submission, and document upload, including EveryAction request mapping and idempotency-aware submission behavior. Intake data is not persisted in browser storage.

### Backend, storage, and deployment
- Implemented a transport-neutral backend (Node + Lambda) for intake submission and presigned document uploads: validated/idempotent intake handling with durable audit logging, direct browser-to-storage uploads (S3 or local dev sink), and hardened CORS/security/logging practices.
- Deployed the static frontend, API Gateway HTTP API, and Lambda in AWS (us-east-2) with verified intake and presigned-upload behavior. Serving is currently HTTP-only via the S3 website endpoint pending CloudFront.

### Mobile foundation
- Implemented the React Native/Expo mobile app and shared domain package covering the core intake journey, native document selection/capture, and mock/API-configurable submission and upload flows. See [react-native.md](./react-native.md).

## Remaining work

Open items are tracked only in [../planning/handoffs.md](../planning/handoffs.md). At a high level:
- **Integrations & infrastructure:** finalize the EveryAction CRM contract/production wiring and provision CloudFront/OAC for HTTPS delivery.
- **Quality & release:** complete end-to-end QA and WCAG 2.2 AA sign-off (web and on-device Android), add E2E coverage to CI, and execute the Google Play release (including removal of the legacy mobile scaffold).

## Architecture direction

- **Client:** React + TypeScript (Vite) web app and Expo/React Native mobile app, styled mobile-first with accessible patterns and centralized bilingual content.
- **Contracts:** Formik/Yup-driven intake with service abstractions and a shared domain boundary so UI remains decoupled from backend/CRM specifics.
- **Backend:** Small serverless-ready API providing idempotent intake handling and presigned document uploads; storage is direct-to-bucket with a local/mock sink for development and CI.
- **Privacy:** No browser persistence of intake/PHI; sensitive data excluded from URLs and client logs.

## Key references

- [frontend-details.md](./frontend-details.md) — web/frontend and backend implementation details
- [react-native.md](./react-native.md) — mobile architecture and status
- [../planning/handoffs.md](../planning/handoffs.md) — open work
- [../docs/archive/implementation-audit.md](../docs/archive/implementation-audit.md) — historical audit
- Web routes: [../src/routes/AppRouter.tsx](../src/routes/AppRouter.tsx), [../src/routes/IntakePage.tsx](../src/routes/IntakePage.tsx)
- Intake UI: [../src/components/intake/IntakeForm.tsx](../src/components/intake/IntakeForm.tsx), [../src/components/layout/AppShell.tsx](../src/components/layout/AppShell.tsx)
- Service/contracts: [../src/services/index.ts](../src/services/index.ts), [../src/services/everyActionMapper.ts](../src/services/everyActionMapper.ts), [../src/content/index.ts](../src/content/index.ts)
- Backend: [../backend/src/api.ts](../backend/src/api.ts), [../backend/src/handlers/createIntake.ts](../backend/src/handlers/createIntake.ts), [../backend/src/handlers/createUploadUrl.ts](../backend/src/handlers/createUploadUrl.ts)

## Bottom line

The product is functionally complete through core intake, backend processing, and live cloud deployment. The primary value remaining is production-readiness: CRM integration, secure HTTPS distribution, final quality/accessibility assurance, and mobile release.