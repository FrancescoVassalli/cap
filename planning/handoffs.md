# Handoffs

This file lists only open work. Completed work and verified status live in [architecture/master.md](../architecture/master.md) and [architecture/react-native.md](../architecture/react-native.md). When an item is finished, remove it here and record the outcome in the architecture docs.

## BugFix

Fix one item at a time. Add focused regression tests with each fix, update this list as items close, and record completed fixes in [architecture/master.md](../architecture/master.md).

1. **B1 — Enter key bypasses the step flow.** `src/components/intake/IntakeForm.tsx:76-80`, `:306-321`. The ZIP step has one text input and no submit button, so browser implicit submission calls Formik `onSubmit` → `handleSubmission` instead of `handleNext`. Invalid full-form data makes Enter a silent no-op; valid data can submit from step 1. Route `onSubmit` through the step-validation gate or block Enter before the final step. Test keyboard Enter on ZIP.
2. **B2 — ZIP changes leave stale city/state.** `src/components/intake/IntakeForm.tsx:141-153`. Changing a known ZIP to unknown/partial/blank leaves the previous autofilled city/state, allowing a wrong address to be submitted. Clear prior autofill when the ZIP is no longer resolved; avoid clobbering manual edits. Test known → unknown and known → blank.
3. **B3 — `sessionExpired` is shown as a generic error.** `src/components/intake/IntakeForm.tsx:60`, `src/components/intake/SubmissionError.tsx:11-30`. The hook preserves `sessionExpired`, but the UI coerces it to `error`, so the existing bilingual session-expired copy is unused. Pass all three error kinds through and render the matching content/action.
4. **B4 — Server field errors are discarded.** `src/hooks/useEveryActionSubmission.ts:63-74`. `IntakeSubmissionResult.fieldErrors` is dropped, so server validation failures cannot be mapped back to fields. Expose field errors in hook state, map them to Formik fields/steps, and show the error summary.
5. **B5 — “Try Again” does not retry.** `src/components/intake/IntakeForm.tsx:67-69`. Retry only resets submission state and returns to the form. Either resubmit the preserved values or relabel the action. Add a retry test.
6. **B6 — Final-step validation failure has no visible feedback.** `src/components/intake/IntakeForm.tsx:118-128`, `:197-205`. `errorEntries` only uses current-step errors; at Documents, `stepErrors` is empty, so a failed `validateForm()` leaves the user stuck with no summary. Build the summary from `fullErrors` and/or jump to the first invalid step.
7. **B7 — Duplicate-file validation can accept the rejected duplicate.** `src/validation/documentValidation.ts:37-38`. Accepted files are mapped back by `name-size`; two files with the same name and size cause both to be uploaded though the shared validator rejected one. Map accepted candidates by object identity/index. Add a same-name/same-size test.
8. **B8 — Concurrent uploads can lose documents / submit during upload.** `src/components/intake/DocumentsStep.tsx:36-58`, `src/components/intake/IntakeForm.tsx:156-158`. `onAddDocuments` closes over stale `values.documents`, and there is no uploading state. Use a functional Formik update, track upload state, and disable Submit while uploading. Test overlapping selections and submit-during-upload.
9. **B9 — “Skip this step” only clears files.** `src/components/intake/DocumentsStep.tsx:122-131`. The label implies advancing, but it only clears selected documents and the user still must press Submit. Rename to “Clear selected files” or implement the intended skip action; clear document errors too.
10. **B10 — Field errors/hints are not programmatically associated.** `src/components/forms/FormField.tsx:34-35`. Inputs set `aria-invalid` but hints/errors have no ids and no `aria-describedby`. Add generated ids and associate hint/error text, preferably inside `FormField`.
11. **B11 — Language radio group has no accessible group name.** `src/components/intake/LanguageStep.tsx:24-36`, `src/components/forms/RadioGroup.tsx:34-40`. The fieldset has no legend and the visible heading is not referenced. Add a legend or `aria-labelledby`.
12. **B12 — Focus is lost on success/error screens.** `src/components/intake/IntakeForm.tsx:71-72`, `:85-86`. The focused submit button unmounts and focus falls to the body; `RouteFocus` only runs on pathname changes. Focus the result heading and/or expose `role="alert"`/`role="status"`.
13. **B13 — Nested interactive controls in the error screen.** `src/components/intake/SubmissionError.tsx:24-30`. `<Link><Button /></Link>` renders a button inside an anchor. Use a styled link or navigate from a button. Keyboard activation of the inner button is currently broken.
14. **B14 — Repeated “Remove” accessible names.** `src/components/intake/DocumentsStep.tsx:114-116`. Every remove button is announced as “Remove”. Include the document name in `aria-label`.
15. **B15 — Spanish selection does not update the document language.** `src/components/intake/IntakeForm.tsx:82-83`, `index.html:2`. The UI switches to Spanish but `<html lang="en">` remains, affecting screen-reader pronunciation. Set/restore `document.documentElement.lang` while the form is active.
16. **B16 — Unknown-ZIP notice is not announced.** `src/components/intake/ZipStep.tsx:43-47`. Add `role="status"`/`aria-live` to the ZIP notice.
17. **B17 — Start intake ID generation and dead code.** `src/routes/IntakeLandingPage.tsx:11-14`, `src/routes/IntakePage.tsx:11-22`. Use shared `generateIntakeId()` (has a fallback) instead of direct `crypto.randomUUID()`, and remove the dead `IntakeStartButton` export.
18. **B18 — `/intake/:id` accepts malformed IDs.** `src/routes/IntakePage.tsx:6-8`. Validate the route id early or redirect/start a new request before the user fills the form.
19. **B19 — Language options lack required flags.** `src/components/intake/LanguageStep.tsx:24-36`. The plan calls for a flag plus visible text labels; only text labels are implemented. Add flag assets/labels or record an explicit scope exception.

## API and backend

1. **EveryAction (CRM) contract** — confirm the final endpoint, field mapping, and production credentials, then point the live `ApiSubmissionService` at the real EveryAction submission flow. The API Gateway/Lambda deployment, idempotency, intake audit log, presigned uploads, CORS, and CloudWatch logging are otherwise live.
2. **Confirm production CORS** — set `CAP_ALLOWED_ORIGINS` to the exact static-host origin before release.

## QA and accessibility

3. **Final end-to-end QA + WCAG 2.2 AA sign-off** — validate the assembled app: routing, Formik state across steps, Back/Continue, ZIP skip/unknown/autofill, editable city/state, document skip/remove, submission success/error/retry, duplicate-click prevention, EN/ES propagation, and no browser persistence. Run axe, keyboard-only, screen-reader, focus, zoom/reflow, contrast, and mobile viewport checks.
4. **On-device Android QA** — confirm no keyboard overlap or safe-area clipping on contact/address steps, and that document picking, camera capture, upload, and submit → success complete end-to-end. **Blocked:** requires a physical device or emulator not available in this environment.

## CI and deployment

5. **Add the Playwright E2E upload test to the standard `npm test`/CI path** — it currently runs only via an explicit `npx playwright test` against a running frontend and backend.
6. **CloudFront distribution + OAC** — provision the CDN layer and recreate `cap-frontend-oac`. **Blocked:** `cloudfront:CreateDistribution` requires AWS account verification. The static frontend is deployed to S3 and the API Gateway HTTP API + `cap-api` Lambda are live.

## Mobile release

7. **Google Play release** — follow [mobile-release.md](./mobile-release.md). External first: create the Play Console org account and Expo project (`eas init`). In-repo: add `packages/mobile/assets/`, create `packages/mobile/eas.json`, modernize the Expo SDK for Play's target API, use a stable production API URL when available, then run the release verification and on-device QA before a staged rollout.
8. **Remove the legacy `apps/mobile` scaffold** — confirm nothing references it, then delete it in a cleanup commit.
