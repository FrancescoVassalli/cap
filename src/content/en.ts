/**
 * English content for the CAP frontend.
 * All copy is extracted from approved planning documents.
 * This is the source of truth for English UI text.
 */

import type { AllContent } from "./types";

export const en: AllContent = {
  language: "en",

  // ========================================================================
  // Navigation
  // ========================================================================

  navigation: {
    brand: "CAP",
    logo: {
      alt: "Consumer Assistance Program",
    },
    mainNav: {
      ariaLabel: "Main navigation",
      howWeHelp: "How We Help",
      getHelp: "Get Help",
    },
    mobileMenu: {
      label: "Menu",
    },
    footer: {
      copyright: "© Colorado Consumer Health Initiative. All rights reserved.",
    },
  },

  // ========================================================================
  // How We Help Page
  // ========================================================================

  howWeHelp: {
    hero: {
      title: "Get Free Help with Health Care Bills and Insurance",
      subtitle:
        "The Consumer Assistance Program helps Colorado consumers navigate health insurance, medical bills, claims, and access to care.",
      ctaLabel: "Get Help",
    },

    whatWeHelp: {
      heading: "What We Help With",
      services: [
        {
          title: "Insurance Claim Denials",
          description:
            "We help you understand and appeal denied insurance claims.",
        },
        {
          title: "Medical Bills",
          description: "Assistance navigating medical bills and billing issues.",
        },
        {
          title: "Coverage and Access Issues",
          description:
            "Help understanding your insurance coverage and accessing needed care.",
        },
        {
          title: "Prescription Costs",
          description:
            "Support with prescription medication costs and access.",
        },
      ],
    },

    howItWorks: {
      heading: "How CAP Works",
      stepLabel: (stepNumber: number) => `Step ${stepNumber}`,
      steps: [
        {
          stepNumber: 1,
          title: "Tell Us What Is Happening",
          description:
            "Share details about your health care issue or insurance problem.",
        },
        {
          stepNumber: 2,
          title: "A CAP Team Member Contacts You",
          description:
            "Someone from our team will reach out to discuss your situation.",
        },
        {
          stepNumber: 3,
          title: "We Gather the Information Needed",
          description:
            "We may ask for documents or additional details to understand your case.",
        },
        {
          stepNumber: 4,
          title: "We Work With You Toward a Resolution",
          description:
            "Our team works on your behalf to help resolve your issue.",
        },
      ],
    },

    whatWeDont: {
      heading: "What CAP Does Not Do",
      description: "We do not directly pay medical bills.",
    },

    expectations: {
      heading: "What to Expect",
      responseTime:
        "A member of our team will generally follow up within five business days.",
      volumeWarning:
        "Response times may be longer during periods of high volume.",
    },

    primaryCta: {
      label: "Get Help",
    },

    secondaryCta: {
      label: "Consumer Resources",
      url: "#", // TODO: Add actual resource URL when available
    },
  },

  // ========================================================================
  // Intake Landing Page
  // ========================================================================

  intakeLanding: {
    heading: "Need Help with a Health Care Bill or Insurance Issue?",
    subheading: "CAP provides free assistance to Colorado consumers.",

    beforeYouBegin: {
      heading: "Before You Begin",
      description: "You'll be asked for:",
      items: [
        "Your contact information",
        "Your address",
        "Basic information about your situation",
        "Documents that may help our team understand your case",
      ],
    },

    estimatedTime: "The form should take approximately 10-15 minutes.",

    dataUse:
      "Your information is used to help our team respond to your request.",

    keyPoints: {
      isFree: "CAP is free.",
      noDirectPayment: "We do not directly pay medical bills.",
      noGuarantee:
        "Submitting this form does not guarantee that CAP can take your case.",
      responseFollowUp: "A CAP team member will follow up with you.",
      volumeWarning:
        "Response times may be longer during periods of high volume.",
    },

    startCta: {
      label: "Start a New Request",
    },
  },

  // ========================================================================
  // Intake Form Steps
  // ========================================================================

  intakeForm: {
    stepLabels: {
      zip: "Location",
      language: "Language",
      contact: "Contact Information",
      documents: "Documents",
    },

    zip: {
      label: "What ZIP code do you live in?",
      hint: "We'll use this to help fill in your city and state.",
      placeholder: "80203",
      skipLabel: "Skip this step",
      notFoundMessage:
        "We couldn't find that ZIP code. You can continue and enter your address manually.",
    },

    language: {
      label: "Preferred Language",
      options: {
        en: "English",
        es: "Spanish",
      },
    },

    contact: {
      heading: "Contact Information",
      fields: {
        firstName: {
          label: "First Name",
          placeholder: "John",
        },
        lastName: {
          label: "Last Name",
          placeholder: "Smith",
        },
        email: {
          label: "Email Address",
          placeholder: "john@example.com",
        },
        phone: {
          label: "Phone Number",
          placeholder: "(555) 123-4567",
        },
        address1: {
          label: "Street Address",
          placeholder: "123 Main Street",
        },
        address2: {
          label: "Apartment, Suite, etc. (Optional)",
          placeholder: "Unit 5",
        },
        city: {
          label: "City",
          placeholder: "Denver",
        },
        state: {
          label: "State",
          placeholder: "CO",
        },
        zipCode: {
          label: "ZIP Code",
          placeholder: "80203",
        },
      },
    },

    documents: {
      heading: "Documents",
      description:
        "You can upload documents that may help our team understand your situation.",
      examples: {
        heading: "Examples include:",
        items: [
          "Medical bills",
          "Explanation of benefits",
          "Insurance letters",
          "Claim denial letters",
          "Other relevant documents",
        ],
      },
      chooseFiles: "Choose files",
      remove: "Remove",
      skipLabel: "You can skip this step and provide documents later.",
      skipButtonLabel: "Skip this step",
      maxFileSizeWarning: "Maximum file size is 10 MB per file.",
      maxTotalSizeWarning: "Maximum total upload size is 50 MB.",
      allowedTypesDescription: "Accepted file types: PDF, JPG, JPEG, PNG",
    },

    navigation: {
      back: "Back",
      continue: "Continue",
      submit: "Submit Request",
      progressLabel: (current: number, total: number) =>
        `Step ${current} of ${total}`,
    },

    errors: {
      required: "This field is required.",
      invalidEmail: "Please enter a valid email address.",
      invalidPhone: "Please enter a valid phone number.",
      invalidZip: "Please enter a valid ZIP code.",
      zipMustBeFiveDigits: "ZIP code must be 5 digits",
      selectLanguage: "Please select a language",
      invalidFileType: "This file type is not allowed.",
      fileTooLarge: "This file is too large. Maximum size is 10 MB.",
      totalSizeTooLarge: "Total file size exceeds the 50 MB limit.",
      duplicateFile: "You have already selected this file.",
      generic: "There is an error with this field.",
      errorSummaryHeading: "There are issues to fix:",
    },
  },

  // ========================================================================
  // Submission / Result States
  // ========================================================================

  submission: {
    idle: {
      label: "Submit Request",
    },

    submitting: {
      label: "Submitting your request...",
    },

    success: {
      heading: "Request Received",
      message:
        "Thank you for contacting the Consumer Assistance Program.",
      nextSteps:
        "A member of our team will review your request and contact you by phone or email. " +
        "CAP generally responds within five business days, although it may take longer when we receive a high volume of requests.",
      referenceNumberLabel: "Your reference number is:",
      contactInfoReminder:
        "Please keep any relevant medical bills, insurance letters, explanations of benefits, and claim information available in case our team needs additional information.",
    },

    error: {
      heading: "We Couldn't Submit Your Request",
      message:
        "Your information was not submitted successfully. Please check your internet connection and try again.",
      retryLabel: "Try Again",
      contactLabel: "Contact CAP",
    },

    networkError: {
      heading: "Your Connection Was Interrupted",
      message:
        "We couldn't finish submitting your request. Please reconnect and try again.",
      retryLabel: "Try Again",
    },

    sessionExpired: {
      heading: "This Request Is No Longer Active",
      message:
        "For your privacy, this intake session has expired. Please start a new request.",
      newRequestLabel: "Start a New Request",
    },
  },

  // ========================================================================
  // Not Found Page
  // ========================================================================

  notFound: {
    heading: "We couldn't find that page.",
    description: "The page may have moved or the link may be outdated.",
    goToCapLabel: "Go to CAP",
    getHelpLabel: "Get Help",
  },

  // ========================================================================
  // Legal and Information
  // ========================================================================

  legal: {
    privacy: {
      heading: "Privacy",
      content:
        "Your information is used to help our team respond to your request and will be handled according to our privacy policy.",
    },
    disclaimer: {
      content:
        "The Consumer Assistance Program does not provide legal advice. If you believe you need legal assistance, please consult with an attorney.",
    },
  },
};
