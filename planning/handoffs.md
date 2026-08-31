# Handoffs
This is the current implementation handoff for the CAP frontend. It reflects the verified state of the repo and the remaining work needed before the project is ready for final integration. Each section below is for a particular agent to read from 

## Design system
Priority: done
The presentational Visual / Branding pass is complete. It follows the color/branding inspiration in `planning/master.md` (primary `#01599a`, secondary `#7aabdb`, highlight `#fec524`) and the character of the reference CAP/CCHI site (hero blue, photography, bold color bands). No business logic, no component API changes, and no accessibility-structure changes were introduced; details are recorded in `architecture/master.md`.

Completed:
1. **Tokens/theme** (`src/index.css`) — added light brand tint tokens (`cap-primary-50/100`, `cap-secondary-50`) and a warm canvas background derived from the brand hexes; existing `status-*`, `touch`, and `font` tokens are unchanged.
2. **AppShell** — swapped `bg-slate-50` for the warm canvas, added a thin primary→secondary→highlight gradient brand bar along the top, and used `border-cap-secondary/40` accents on the header and a brand-toned secondary footer band.
3. **Hero** (HowWeHelp + IntakeLanding) — primary→secondary blue gradient hero with white text, a highlight `#fec524` eyebrow, and a highlight CTA pill; HowWeHelp gained a real CAP hero photo.
4. **Cards/sections** — replaced flat gray stacking with warm cards (`border-cap-secondary/40`, `cap-secondary-50` header rows, larger rounding); service tiles get `border-l-4 border-cap-primary`, step tiles get highlight number chips, and the expectations block uses a secondary/highlight band callout.
5. **Buttons/CTA** (`Button.tsx`) — added a `highlight` variant (`bg-cap-highlight text-cap-primary`, never white on yellow) with a subtle hover lift, used for the get-help/start CTAs.
6. **Header/nav/footer** — active-route nav in primary with a secondary/highlight hover underline, and a brand-toned footer (secondary band with dark text) instead of gray.
7. **Intake form + progress** (`IntakeProgress`) — completed segments cap-primary, current segment cap-secondary, text labels retained; step cards surfaced in brand colors. No color-only meaning.
8. **Imagery** — pulled the real CAP assets into `public/`: the hero photo (`cchi-help-2.jpg`) on /how-we-help and the five real team headshots (`team-*.jpg/png`) in a new trust section.
9. **Verification** — contrast checked (dark text on highlight, white on primary, dark on secondary footer), then re-ran `npm run test` (60 tests), `npm run build`, `npm run lint`, `npm run typecheck` (all green), plus a Playwright visual smoke check (mobile + desktop) confirming the hero, canvas, CTA, and no overflow.

Also folded in: made `RadioGroup`/`LanguageStep` explicitly controlled so the selected language radio is actually checked (English default + regression test).

## Integration
Priority: required before sign-off
This is the next implementation wave. Required work:
- Validate the app as one experience rather than a collection of independent features.
- Test routing, state flow, ZIP blank/unknown behaviors, document skipping, submission states, and success paths.
- Confirm accessibility and mobile UX under the project’s WCAG target.
- Run the final verification pass across the repo before sign-off.
- Then run the Accessibility auditor (WCAG 2.2 AA) as the sign-off gate; Security/Release auditors remain later, outside the demo scope.

## Data transformation for EveryAction submission
Priority: next (awaiting gateway/backend decision)
Owner: intake-form agent

### Goal
Today the form produces an application-level `SubmissionPayload` (defined in `src/services/submissionService.ts`) that is submitted through the configurable `SubmissionService` boundary (mock / email / api). The `ApiSubmissionService` currently POSTs that payload verbatim as JSON. The EveryAction endpoint in `planning/master.md` expects a flat, URL-encoded body with its own field names (e.g. `FirstName`, `LastName`, `PreferredLanguages=<numericId>`, `PostalCode`, `EmailAddress`, `HomePhone`, `AddressLine1`, `City`, plus `FormSessionId`, `ClientSubmissionId`, `BrowserName`, `DeviceType`, and `CustomFormFieldQuestion_*` fields).

We need a data transformation **hook** that converts the collected form data into the shape required for submission, so the URL-encoding/field-name concerns live in one testable place instead of leaking into the UI or the generic API adapter.

### Design intent
- Keep the business behavior out of primitive components and out of the generic `ApiSubmissionService`.
- The transformation is a pure function wrapped in a hook (`useEveryActionFormData` or similar) that accepts the application `SubmissionPayload` (plus request metadata) and returns the URL-encoded body / field map for the EveryAction endpoint.
- Language must map to a numeric EveryAction id — the sample shows `PreferredLanguages=62` for English. Confirm the Español id from the form's back-end (flag as an open decision; do not guess a wire value).
- `phone` is split into `HomePhoneCountryCode=us`, `HomePhoneInternationalDialingPrefix=1`, and `HomePhone` per the sample.
- Documents are uploaded to S3 separately (see `useDocumentUpload`); the submission body references them via the appropriate `CustomFormFieldQuestion_*` / case id fields rather than transmitting file bytes.

### Open decisions (need a decision before implementation)
1. **Language numeric ids** — which EveryAction id each of `en` / `es` maps to (`PreferredLanguages`). Do not hardcode without confirmation.
2. **Sensitive-data / URL security** — the raw example puts `FormSessionId` and `ClientSubmissionId` in the body; confirm these are acceptably non-sensitive or whether they should be derived server-side.
3. **CustomFormFieldQuestion mapping** — which question ids correspond to which collected answers (documents, consent/updates, etc.). These ids are hard to read; the mapping must be provided or derived from the actual EveryAction form config.
4. **Browser/device metadata** — `BrowserName`, `DeviceType`, `XFromApp`, `ActionTagBaseUrl` need a source (UA sniffing vs. hardcoded), and whether we are allowed real UA detection.
5. **URL-encoding vs. JSON** — the sample uses `application/x-www-form-urlencoded`. Confirm whether the gateway will accept that shape or if we should send JSON and let a backend translate.

### Proposed implementation steps
1. Add a pure mapper module (e.g. `src/services/everyActionMapper.ts`) with `toEveryActionBody(payload, meta): Record<string,string>` and a `buildUrlEncoded(body)` helper, keeping all field-name and id constants here.
2. Add a thin hook (e.g. `src/hooks/useEveryActionSubmission.ts`) that composes the mapper with the existing `useIntakeSubmission`/`SubmissionService` so the form layer calls one clean `submit(values)` and doesn't see EveryAction specifics.
3. Add a `Secret`/config seam for the numeric language ids and question ids so they can be swapped without code changes (mirroring how `services` DI works).
4. Write unit tests for the mapper (every field, optional skip of ZIP/phone, language id mapping, URL-encoding of special characters, documents → reference field) and for the hook (happy path + failure), mirroring existing `submissionService.test.ts` style.
5. Keep the mock/email adapters intact; only the API-bound path consumes the mapper.
6. Per `AGENTS.md`, update `architecture/master.md` with what was implemented and remove this handoff section once the step is taken.

### Acceptance bar
- The mapper is pure and fully unit-tested (no UI in the module).
- The form layer calls a single hook that hides EveryAction field-name/id concerns.
- No raw exception or PHI leaks from errors; user-facing copy stays in content modules.
- ZIP (skipped or known) and phone (optional) are handled correctly in the mapped output.
- Language propagates through to the correct numeric id.
- `npm run test`, `npm run lint`, `npm run typecheck`, `npm run build` all pass.
- The handoff is removed from this file with a conventional-commit `docs(handoffs)` after implementation.


