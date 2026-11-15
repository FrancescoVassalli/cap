# Master Plan For the Project

The consumer assistance program helps Colorado consumers who have had insurance claims denied appeal the decisions and recover funds.

[Current website summary page](https://cohealthinitiative.org/cap/)

[Current get help page](https://cohealthinitiative.org/need-help/)

The current website is a simple form submit to begin the process and notify the staff.

This project will replace the current website with a react application frontend that collects the same info and is presented in a similar but better style. Then the collected intake forms can be used to begin a CRM like process for handling the case and use a backend system to automate some steps.

## Document map

- [master.md](./master.md) — this document; the canonical product scope, requirements, and contracts.
- [handoffs.md](./handoffs.md) — only the open next steps; completed work is removed once done.
- [mobile-release.md](./mobile-release.md) — active Google Play release plan (Apple App Store deferred).
- [conventional-commits.md](./conventional-commits.md) — commit message convention.
- [../architecture/master.md](../architecture/master.md) — completed work and current implementation status.
- [../architecture/react-native.md](../architecture/react-native.md) — mobile implementation status.
- [../docs/design-system.md](../docs/design-system.md) — component, token, and accessibility reference.
- [../docs/content-authoring.md](../docs/content-authoring.md) — content layer and EN/ES authoring guide.
- [../docs/archive/](../docs/archive/) — historical plans, retained for context only. Do not treat as active.

## Frontend

Begin with this. Create a static react frontend that can be hosted on s3. It should be inspired by the current website and use the images but be designed more for the user.
Use tailwind for the css. Include existing imagery and branding from the website. Here is a color inspo:

* primary `#01599a`
* secondary `#7aabdb`
* highlight `#fec524`

All the components should be dumb. The design tokens and component APIs are documented in [design-system.md](../docs/design-system.md).

This needs to be mobile compatible.

The new site should retain the approachable, nonprofit/community-oriented character of the current CAP site while substantially improving clarity, accessibility, and task completion.

### Expected pages

- `/how-we-help` — mostly informational like the current summary page.
- `/intake` — acts as the current `/need-help` page.
- `/intake/:id` — the multi-step intake form, using a unique UUIDv4 for the intake. The original spec's `/instake/id` is implemented as `/intake/:id`.
- `*` — a friendly not-found page.

After the intake landing page, users should be able to click to start a new intake, which directs them to `/intake/:id` with a unique id generated only when the intake starts. Use Formik for all information in a single form. Implement with custom input components, buttons, and any needed hooks. The form presents these steps:

1. ZIP code. Users can skip the ZIP code. If entered, it autofills city/state information stored within the frontend. A ZIP code cannot determine a street address.
1. Language select: English or Spanish, with a flag and visible text labels.
1. Name, email, phone, and address using the autofilled city/state. Only needs to support the US. All address fields remain editable.
1. Documents. These should be stored in S3 through a presigned upload flow.

Every step has a footer to continue or go back. The intake does not persist: a refresh loses the in-memory form.

### Cross-cutting requirements

- **Mobile first.** Phone completion of the intake is a first-class requirement, not an afterthought. One-column forms, full-width fields, 44px minimum touch targets (48px preferred), no horizontal scrolling, and intentional mobile progress and image behavior.
- **Accessibility.** Target WCAG 2.2 AA: keyboard navigation, screen-reader labels, visible focus, semantic headings, accessible error association, 44px+ targets, sufficient contrast, and never communicating state by color alone. Accessibility testing is part of acceptance.
- **Explicit UI states.** Every data-dependent action has idle, loading, success, and error states. The intake distinguishes submission failure, network interruption, duplicate submission, server validation failure, session expiration, and success. The success screen explains what happens next.
- **No global state manager.** Use React state for local UI, Formik for intake state, hooks for reusable behavior, and services for external operations.
- **Content independent of components.** Keep copy in typed content modules with EN/ES key parity. Do not concatenate translated fragments or hard-code large copy blocks in components. See [content-authoring.md](../docs/content-authoring.md).
- **Browser support.** Test current Chrome, Firefox, Safari, Edge, iOS Safari, and Android Chrome. Vite's modern production defaults are acceptable unless CAP explicitly needs older browsers.
- **Testing.** Unit tests for ZIP lookup, validation, navigation, document validation, and submission states; component tests for labels, errors, keyboard, disabled/loading states, file selection, and navigation; E2E happy path plus invalid email, invalid/unknown ZIP, missing fields, submission failure, duplicate click, mobile viewport, and keyboard-only completion. `npm test`, `npm run build`, `npm run lint`, and `npm run typecheck` must pass.

### Security

This is particularly important because the intake contains potentially sensitive healthcare and insurance information.

- No sensitive data in URL parameters, analytics, client logs, error-tracker breadcrumbs, telemetry, `localStorage`, or `sessionStorage`.
- HTTPS only in production; redirect HTTP to HTTPS.
- No AWS credentials, API private keys, or JWT signing secrets in the frontend bundle.
- No unreviewed third-party scripts on intake pages (including ads, session recording, heatmaps, and marketing trackers).
- No analytics by default; if added, never include identifiers or form contents.
- The frontend talks to the API through the service adapters, never directly to the CRM or S3 credentials.
- Document uploads use short-lived presigned URLs and a private bucket with server-controlled keys. Never use the original filename as the security boundary.

## Infrastructure

Plan AWS infrastructure to support this system. The frontend is hosted statically on S3 with the public `cap-frontend-590251390266-us-east-2-an` bucket accessed with CloudFront. There is a Lambda function for the API which logs to CloudWatch. The Windows-native deploy tooling, Lambda handler shape, IAM role requirements, and verified live deployment details are recorded in [architecture/master.md](../architecture/master.md).

## API

The frontend selects its runtime mode with environment variables:

- `VITE_CAP_SUBMISSION_MODE` — `mock` or `api`.
- `VITE_CAP_UPLOAD_MODE` — `local` or `s3`.
- `VITE_CAP_API_BASE_URL` — API base URL.

The mobile app uses the equivalent `EXPO_PUBLIC_CAP_*` variables. The backend selects S3 only when bucket, region, and credentials are configured; otherwise it falls back to a local/mock presigner. `CAP_LOCAL_PRESIGNER_MODE=mock` forces the local sink for development and CI.

### API contract

- `GET /health` — liveness/health check.
- `POST /intakes` — accepts the URL-encoded EveryAction form body. Requires an `Idempotency-Key` header containing the UUIDv4 intake id. Returns `201` with a `referenceId` on first submission, `200` with the same id on idempotent replay, `401 session_expired` for a missing/invalid session id, and `422` for a present-but-invalid body.
- `POST /intakes/{id}/upload-url` — accepts `{ "filename", "contentType", "size" }` and returns `{ "uploadUrl" }`, a short-lived presigned S3 PUT URL.
- `PUT /uploads/:id` — local development sink only; never exposed in production.

Validation must re-check file type, size, and anti-abuse limits server-side. The frontend contract is shaped around `intakeId`, language, demographics, address, and optional document metadata.

### Form submission

``` powershell
Invoke-WebRequest -UseBasicParsing -Uri "https://secure.everyaction.com/v2/Forms/jl7xMCgglkipe-xsRW1AMg2" `
-Method "POST" `
-UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:154.0) Gecko/20100101 Firefox/154.0" `
-Headers @{
"Accept" = "*/*"
  "Accept-Language" = "en-US,en;q=0.9"
  "Accept-Encoding" = "gzip, deflate, br, zstd"
  "Origin" = "https://cohealthinitiative.org"
  "Sec-Fetch-Storage-Access" = "none"
  "Referer" = "https://cohealthinitiative.org/"
  "Sec-Fetch-Dest" = "empty"
  "Sec-Fetch-Mode" = "cors"
  "Sec-Fetch-Site" = "cross-site"
  "Pragma" = "no-cache"
  "Cache-Control" = "no-cache"
  "TE" = "trailers"
} `
-ContentType "application/x-www-form-urlencoded; charset=UTF-8" `
-Body "FirstName=test&LastName=test&PreferredLanguages=62&AddressLine1=1565+N+Raleigh+St+306&PostalCode=80204&City=DENVER&EmailAddress=test%40test.com&HomePhoneCountryCode=us&HomePhoneInternationalDialingPrefix=1&HomePhone=3033333333&YesSignMeUpForUpdatesForBinder=true&CustomFormFieldQuestion_7775419738964799=test&CustomFormFieldQuestion_191236437614073_CustomFormFieldQuestion_8308097974681773=false&CustomFormFieldQuestion_191236437614073_CustomFormFieldQuestion_7444239866455935=true&CustomFormFieldQuestion_109184367424359_CustomFormFieldQuestion_8944715872682445=true&CustomFormFieldQuestion_109184367424359_CustomFormFieldQuestion_1197857230065095=false&CustomFormFieldQuestion_109184367424359_CustomFormFieldQuestion_2750002287485161=false&FormVersion=12%2F10%2F2024+6%3A54%3A59+PM%7C&type=SignupForm&FormSessionId=8bb5b7b7-0451-47ff-b231-1097ab3bcc90&ClientSubmissionId=202e5fc2-86f0-4f71-87bd-71156b57de41&BrowserName=firefox&DeviceType=desktop&XFromApp=ActionTag&ActionTagBaseUrl=https%3A%2F%2Fstatic.everyaction.com%2Fea-actiontag%2F"
```

The implemented EveryAction field mapping lives in the shared `everyActionMapper`; the API adapter builds this URL-encoded body and sends it with the idempotency header. The real API and a local mock are selectable via environment variables; mock mode is the default for local and CI.

### Form open

``` powershell
Invoke-WebRequest -UseBasicParsing -Uri "https://secure.everyaction.com/v1/Forms/jl7xMCgglkipe-xsRW1AMg2" `
-UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:154.0) Gecko/20100101 Firefox/154.0" `
-Headers @{
"Accept" = "application/json, text/javascript, */*; q=0.01"
  "Accept-Language" = "en-US,en;q=0.9"
  "Accept-Encoding" = "gzip, deflate, br, zstd"
  "Origin" = "https://cohealthinitiative.org"
  "Sec-Fetch-Storage-Access" = "none"
  "Referer" = "https://cohealthinitiative.org/"
  "Sec-Fetch-Dest" = "empty"
  "Sec-Fetch-Mode" = "cors"
  "Sec-Fetch-Site" = "cross-site"
  "Pragma" = "no-cache"
  "Cache-Control" = "no-cache"
}
```
The response is the EveryAction form definition. Key fields for the integration:

```json
{
  "submissionUrl": "https://secure.everyaction.com/v2/Forms/jl7xMCgglkipe-xsRW1AMg2",
  "formVersion": "12/10/2024 6:54:59 PM|",
  "formId": 2023965,
  "name": "CAP Inquiry Form",
  "type": "SignupForm",
  "shortCode": "jl7xMCgglkipe-xsRW1AMg2"
}
```

`form_elements` contains the field definitions and options, including the numeric `PreferredLanguages` ids. The approved application mapping uses `en -> 62` and `es -> 15`.

### File storage

Uploaded files are stored in S3. The API generates a presigned URL and the web/mobile client PUTs the file bytes directly to it. The bucket is private; objects use server-controlled keys shaped like `intakes/{intakeId}/documents/{documentId}` with metadata and server-side encryption. Limits: PDF/JPG/JPEG/PNG, 10 MB per file, 50 MB total intake. The frontend validates these limits for UX; the backend re-validates them as a security control.

## React native

In addition to the web app, the repo supports a React Native build for eventual shipping to the app stores. The active plan is Google Play only in [mobile-release.md](./mobile-release.md); the Apple App Store path is deferred until the org funds the Apple Developer Program. Web and mobile share the domain contract in `packages/shared` (types, validation, service interfaces, EveryAction mapping, and UUIDv4 intake id generation).
