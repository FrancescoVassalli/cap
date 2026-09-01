/**
 * Web app domain types.
 *
 * The intake domain model (form values, documents, zip locations, submission
 * results/errors) is defined once in `@cap/shared` and re-exported here so both
 * the web and mobile apps use identical types and validation contracts. Only
 * web-specific content-structure types remain local.
 */

export type {
  Language,
  IntakeFormValues,
  IntakeDocument,
  ZipLocation,
  SubmissionStatus,
  SubmissionErrorKind,
  IntakeSubmissionResult,
} from '@cap/shared'

export type ContentSection = {
  title: string
  body: string
  id?: string
}

export type NavigationItem = {
  label: string
  to: string
}

export type PageContent = {
  title: string
  intro: string
  sections?: ContentSection[]
}