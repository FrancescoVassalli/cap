import { test, expect, type Page } from '@playwright/test'

/**
 * End-to-end verification that selecting a document in the intake flow drives
 * real network traffic to the backend to obtain a presigned upload URL (the
 * secure storage flow described in planning/master.md), rather than falling
 * back to the in-memory UI-only adapter.
 *
 * Prerequisites:
 *   - Backend running:  npm run server   (localhost:8787)
 *   - Frontend running with the backend wired:
 *       VITE_CAP_SUBMISSION_MODE=api
 *       VITE_CAP_UPLOAD_MODE=s3
 *       VITE_CAP_API_BASE_URL=http://localhost:8787
 */

const FRONTEND = process.env.CAP_E2E_FRONTEND_URL ?? 'http://localhost:5173'

function randomUuid(): string {
  return crypto.randomUUID()
}

async function advanceToDocumentsStep(page: Page, intakeId: string) {
  await page.goto(`${FRONTEND}/intake/${intakeId}`)

  // Step 0 — ZIP (skip)
  await page.getByRole('button', { name: 'Continue' }).click()

  // Step 1 — Language (English is selected by default)
  await page.getByRole('button', { name: 'Continue' }).click()

  // Step 2 — Contact (required fields)
  await page.getByLabel('First Name').fill('Avery')
  await page.getByLabel('Last Name').fill('Smith')
  await page.getByLabel('Email Address').fill('avery@example.com')
  await page.getByLabel('Street Address').fill('123 Main St')
  await page.getByLabel('City').fill('Denver')
  await page.getByLabel('State').fill('CO')
  await page.getByRole('button', { name: 'Continue' }).click()

  // Step 3 — Documents
  await expect(page.getByText('Documents', { exact: true }).first()).toBeVisible()
}

test('document selection requests a presigned URL from the backend', async ({ page }) => {
  const intakeId = randomUuid()

  // Track the upload-url request and the subsequent PUT to the presigned URL.
  const presignRequests: string[] = []
  const putUrls = new Set<string>()

  page.on('request', (request) => {
    if (request.url().includes(`/intakes/${intakeId}/upload-url`)) {
      presignRequests.push(request.url())
    }
    if (request.method() === 'PUT' && request.url().includes('/uploads/')) {
      putUrls.add(request.url())
    }
  })

  await advanceToDocumentsStep(page, intakeId)

  // Choose a small valid PDF file.
  await page.setInputFiles('input[name="documents"]', {
    name: 'eob.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 fake eob', 'utf8'),
  })

  // The adapter should POST to the backend to obtain a presigned URL.
  await expect
    .poll(async () => presignRequests.length)
    .toBeGreaterThan(0)
  expect(presignRequests[0]).toContain(`/intakes/${intakeId}/upload-url`)

  // The file bytes are then PUT to the returned presigned URL.
  await expect
    .poll(async () => putUrls.size)
    .toBeGreaterThan(0)

  // The chosen document appears in the list.
  await expect(page.getByText('eob.pdf', { exact: true }).first()).toBeVisible()
})
