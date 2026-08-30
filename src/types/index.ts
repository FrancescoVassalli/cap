export type Language = 'en' | 'es'

export type IntakeFormValues = {
  zipCode: string
  language: Language
  firstName: string
  lastName: string
  email: string
  phone: string
  streetAddress: string
  apartment: string
  city: string
  state: string
  documents: IntakeDocument[]
}

export type IntakeDocument = {
  id: string
  name: string
  size: number
  type: string
}

export type ZipLocation = {
  zipCode: string
  city: string
  state: string
  county?: string
}

export type SubmissionStatus = 'idle' | 'loading' | 'success' | 'error'

export type IntakeSubmissionResult = {
  success: boolean
  referenceId?: string
  message?: string
}

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
