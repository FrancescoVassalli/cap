# Handoffs

This file lists only open work. Completed work and verified status live in [architecture/master.md](../architecture/master.md) and [architecture/react-native.md](../architecture/react-native.md). When an item is finished, remove it here and record the outcome in the architecture docs.

## API and backend

1. **EveryAction (CRM) contract** — confirm the final endpoint, field mapping, and production credentials, then point the live `ApiSubmissionService` at the real EveryAction submission flow. The API Gateway/Lambda deployment, idempotency, intake audit log, presigned uploads, CORS, and CloudWatch logging are otherwise live.

## QA and accessibility

3. **Final end-to-end QA + WCAG 2.2 AA sign-off** — validate the assembled app: routing, Formik state across steps, Back/Continue, ZIP skip/unknown/autofill, editable city/state, document skip/remove, submission success/error/retry, duplicate-click prevention, EN/ES propagation, and no browser persistence. Run axe, keyboard-only, screen-reader, focus, zoom/reflow, contrast, and mobile viewport checks.
4. **On-device Android QA** — confirm no keyboard overlap or safe-area clipping on contact/address steps, and that document picking, camera capture, upload, and submit → success complete end-to-end. **Blocked:** requires a physical device or emulator not available in this environment.

## CI and deployment

5. **Add the Playwright E2E upload test to the standard `npm test`/CI path** — it currently runs only via an explicit `npx playwright test` against a running frontend and backend.
6. **CloudFront distribution + OAC** — provision the CDN layer and recreate `cap-frontend-oac`. **Blocked:** `cloudfront:CreateDistribution` requires AWS account verification. The static frontend is deployed to S3 and the API Gateway HTTP API + `cap-api` Lambda are live.

## Mobile release

7. **Google Play release** — follow [mobile-release.md](./mobile-release.md). External first: create the Play Console org account and Expo project (`eas init`). In-repo: add `packages/mobile/assets/`, create `packages/mobile/eas.json`, modernize the Expo SDK for Play's target API, use a stable production API URL when available, then run the release verification and on-device QA before a staged rollout.
8. **Remove the legacy `apps/mobile` scaffold** — confirm nothing references it, then delete it in a cleanup commit.
