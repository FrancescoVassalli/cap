/**
 * Content type definitions for CAP frontend.
 * All content is structured as typed interfaces to support English/Spanish localization
 * and maintain a single source of truth for copy across the application.
 */

// ============================================================================
// Navigation Content
// ============================================================================

export interface NavigationContent {
  brand: string;
  logo: {
    alt: string;
  };
  skipLink: {
    label: string;
  };
  mainNav: {
    ariaLabel: string;
    howWeHelp: string;
    getHelp: string;
  };
  mobileMenu: {
    label: string;
  };
  footer: {
    ariaLabel: string;
    navLabel: string;
    copyright: string;
  };
}

// ============================================================================
// How We Help Page Content
// ============================================================================

export interface HeroSection {
  title: string;
  subtitle: string;
  ctaLabel: string;
}

export interface ServiceItem {
  title: string;
  description: string;
}

export interface HowItWorksStep {
  stepNumber: number;
  title: string;
  description: string;
}

export interface HowWeHelpContent {
  hero: HeroSection;
  whatWeHelp: {
    heading: string;
    services: ServiceItem[];
  };
  howItWorks: {
    heading: string;
    stepLabel: (stepNumber: number) => string;
    steps: HowItWorksStep[];
  };
  whatWeDont: {
    heading: string;
    description: string;
  };
  expectations: {
    heading: string;
    responseTime: string;
    volumeWarning: string;
  };
  primaryCta: {
    label: string;
  };
  secondaryCta: {
    label: string;
    url: string;
  };
}

// ============================================================================
// Intake Landing Page Content
// ============================================================================

export interface IntakeLandingContent {
  heading: string;
  subheading: string;
  beforeYouBegin: {
    heading: string;
    description: string;
    items: string[];
  };
  estimatedTime: string;
  dataUse: string;
  keyPoints: {
    isFree: string;
    noDirectPayment: string;
    noGuarantee: string;
    responseFollowUp: string;
    volumeWarning: string;
  };
  startCta: {
    label: string;
  };
}

// ============================================================================
// Intake Form Content (Steps)
// ============================================================================

export interface ZipStepContent {
  label: string;
  hint: string;
  placeholder: string;
  notFoundMessage: string;
}

export interface LanguageStepContent {
  label: string;
  options: {
    en: string;
    es: string;
  };
}

export interface ContactStepContent {
  heading: string;
  fields: {
    firstName: {
      label: string;
      placeholder?: string;
    };
    lastName: {
      label: string;
      placeholder?: string;
    };
    email: {
      label: string;
      placeholder?: string;
    };
    phone: {
      label: string;
      placeholder?: string;
    };
    address1: {
      label: string;
      placeholder?: string;
    };
    address2: {
      label: string;
      placeholder?: string;
    };
    city: {
      label: string;
      placeholder?: string;
    };
    state: {
      label: string;
      placeholder?: string;
    };
    zipCode: {
      label: string;
      placeholder?: string;
    };
  };
}

export interface DocumentsStepContent {
  heading: string;
  description: string;
  examples: {
    heading: string;
    items: string[];
  };
  chooseFiles: string;
  remove: string;
  skipLabel: string;
  skipButtonLabel: string;
  maxFileSizeWarning: string;
  maxTotalSizeWarning: string;
  allowedTypesDescription: string;
}

export interface FormNavigationContent {
  back: string;
  continue: string;
  submit: string;
  progressLabel: (current: number, total: number) => string;
  progressAriaLabel: string;
}

export interface FormErrorContent {
  required: string;
  invalidEmail: string;
  invalidPhone: string;
  invalidZip: string;
  zipMustBeFiveDigits: string;
  selectLanguage: string;
  invalidFileType: string;
  fileTooLarge: string;
  totalSizeTooLarge: string;
  duplicateFile: string;
  generic: string;
  errorSummaryHeading: string;
}

export interface IntakeFormContent {
  stepLabels: {
    zip: string;
    language: string;
    contact: string;
    documents: string;
  };
  zip: ZipStepContent;
  language: LanguageStepContent;
  contact: ContactStepContent;
  documents: DocumentsStepContent;
  navigation: FormNavigationContent;
  errors: FormErrorContent;
}

// ============================================================================
// Submission/Result Content
// ============================================================================

export interface SubmissionStateContent {
  idle: {
    label: string;
  };
  submitting: {
    label: string;
  };
  success: {
    heading: string;
    message: string;
    nextSteps: string;
    referenceNumberLabel: string;
    contactInfoReminder: string;
  };
  error: {
    heading: string;
    message: string;
    retryLabel: string;
    contactLabel: string;
  };
  networkError: {
    heading: string;
    message: string;
    retryLabel: string;
  };
  sessionExpired: {
    heading: string;
    message: string;
    newRequestLabel: string;
  };
}

// ============================================================================
// Legal/Information Content
// ============================================================================

export interface LegalContent {
  privacy: {
    heading: string;
    content: string;
  };
  disclaimer: {
    content: string;
  };
}

// ============================================================================
// Not Found Page Content
// ============================================================================

export interface NotFoundContent {
  heading: string;
  description: string;
  goToCapLabel: string;
  getHelpLabel: string;
}

// ============================================================================
// All Content Root
// ============================================================================

export interface AllContent {
  language: "en" | "es";
  navigation: NavigationContent;
  howWeHelp: HowWeHelpContent;
  intakeLanding: IntakeLandingContent;
  intakeForm: IntakeFormContent;
  submission: SubmissionStateContent;
  notFound: NotFoundContent;
  legal: LegalContent;
}
