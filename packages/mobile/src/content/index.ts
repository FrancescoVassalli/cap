/**
 * CAP mobile content module.
 *
 * Extracts the approved CAP copy (from the web app's content modules) into
 * typed, bilingual content for the mobile screens. No inline copy lives in the
 * mobile screens/components — it all comes from these modules.
 */

export type Language = 'en' | 'es'

export type MobileContent = {
  language: Language
  howWeHelp: {
    heroTitle: string
    heroSubtitle: string
    ctaGetHelp: string
    whatWeHelpHeading: string
    services: Array<{ title: string; description: string }>
    howItWorksHeading: string
    steps: Array<{ title: string; description: string }>
    whatWeDontHeading: string
    whatWeDontDescription: string
    expectationsHeading: string
    responseTime: string
    volumeWarning: string
  }
  intakeLanding: {
    heading: string
    subheading: string
    beforeYouBeginHeading: string
    beforeYouBeginDescription: string
    beforeYouBeginItems: string[]
    estimatedTime: string
    dataUse: string
    keyPoints: string[]
    startCta: string
  }
  intakeForm: {
    stepLabels: string[]
    zip: {
      label: string
      hint: string
      placeholder: string
      notFoundMessage: string
      lookUp: string
      applying: string
    }
    language: {
      label: string
      options: Record<Language, string>
    }
    contact: {
      heading: string
      fields: {
        firstName: { label: string; placeholder: string }
        lastName: { label: string; placeholder: string }
        email: { label: string; placeholder: string }
        phone: { label: string; placeholder: string }
        streetAddress: { label: string; placeholder: string }
        apartment: { label: string; placeholder: string }
        city: { label: string; placeholder: string }
        state: { label: string; placeholder: string }
        zipCode: { label: string; placeholder: string }
      }
    }
    documents: {
      heading: string
      description: string
      examplesHeading: string
      exampleItems: string[]
      chooseFiles: string
      remove: string
      skipLabel: string
      skipButtonLabel: string
      maxFileSizeWarning: string
      maxTotalSizeWarning: string
      allowedTypesDescription: string
    }
    review: {
      heading: string
      subheading: string
      edit: string
    }
    navigation: {
      back: string
      continue: string
      submit: string
      progressLabel: (current: number, total: number) => string
      progressAriaLabel: string
    }
    errors: {
      required: string
      invalidEmail: string
      invalidPhone: string
      zipMustBeFiveDigits: string
      selectLanguage: string
      invalidFileType: string
      fileTooLarge: string
      totalSizeTooLarge: string
      duplicateFile: string
      generic: string
      errorSummaryHeading: string
    }
  }
  submission: {
    submittingLabel: string
    success: {
      heading: string
      message: string
      nextSteps: string
      referenceNumberLabel: string
      contactInfoReminder: string
      doneLabel: string
    }
    error: {
      heading: string
      message: string
      retryLabel: string
      contactLabel: string
    }
    networkError: {
      heading: string
      message: string
      retryLabel: string
    }
    sessionExpired: {
      heading: string
      message: string
      newRequestLabel: string
    }
  }
  appShell: {
    brand: string
    privacyNoticeLabel: string
    privacyCopy: string
    disclaimer: string
  }
}

/** Builds bilingual content from the web app's approved copy. */
export function createMobileContent(language: Language): MobileContent {
  return language === 'es' ? es : en
}

export const en: MobileContent = {
  language: 'en',

  howWeHelp: {
    heroTitle: 'Get Free Help with Health Care Bills and Insurance',
    heroSubtitle:
      'The Consumer Assistance Program helps Colorado consumers navigate health insurance, medical bills, claims, and access to care.',
    ctaGetHelp: 'Get Help',
    whatWeHelpHeading: 'What We Help With',
    services: [
      {
        title: 'Insurance Claim Denials',
        description: 'We help you understand and appeal denied insurance claims.',
      },
      {
        title: 'Medical Bills',
        description: 'Assistance navigating medical bills and billing issues.',
      },
      {
        title: 'Coverage and Access Issues',
        description: 'Help understanding your coverage and accessing needed care.',
      },
      {
        title: 'Prescription Costs',
        description: 'Support with prescription medication costs and access.',
      },
    ],
    howItWorksHeading: 'How CAP Works',
    steps: [
      {
        title: 'Tell Us What Is Happening',
        description: 'Share details about your health care issue or insurance problem.',
      },
      {
        title: 'A CAP Team Member Contacts You',
        description: 'Someone from our team will reach out to discuss your situation.',
      },
      {
        title: 'We Gather the Information Needed',
        description: 'We may ask for documents or additional details to understand your case.',
      },
      {
        title: 'We Work With You Toward a Resolution',
        description: 'Our team works on your behalf to help resolve your issue.',
      },
    ],
    whatWeDontHeading: 'What CAP Does Not Do',
    whatWeDontDescription: 'We do not directly pay medical bills.',
    expectationsHeading: 'What to Expect',
    responseTime:
      'A member of our team will generally follow up within five business days.',
    volumeWarning:
      'Response times may be longer during periods of high volume.',
  },

  intakeLanding: {
    heading: 'Need Help with a Health Care Bill or Insurance Issue?',
    subheading: 'CAP provides free assistance to Colorado consumers.',
    beforeYouBeginHeading: 'Before You Begin',
    beforeYouBeginDescription: "You'll be asked for:",
    beforeYouBeginItems: [
      'Your contact information',
      'Your address',
      'Basic information about your situation',
      'Documents that may help our team understand your case',
    ],
    estimatedTime: 'The form should take approximately 10-15 minutes.',
    dataUse: 'Your information is used to help our team respond to your request.',
    keyPoints: [
      'CAP is free.',
      'We do not directly pay medical bills.',
      'Submitting this form does not guarantee that CAP can take your case.',
      'A CAP team member will follow up with you.',
      'Response times may be longer during periods of high volume.',
    ],
    startCta: 'Start a New Request',
  },

  intakeForm: {
    stepLabels: ['Location', 'Language', 'Contact Information', 'Documents', 'Review'],
    zip: {
      label: 'What ZIP code do you live in?',
      hint: "We'll use this to help fill in your city and state.",
      placeholder: '80203',
      notFoundMessage:
        "We couldn't find that ZIP code. You can continue and enter your address manually.",
      lookUp: 'Look Up',
      applying: 'Looking up...',
    },
    language: {
      label: 'Preferred Language',
      options: { en: 'English', es: 'Spanish' },
    },
    contact: {
      heading: 'Contact Information',
      fields: {
        firstName: { label: 'First Name', placeholder: 'John' },
        lastName: { label: 'Last Name', placeholder: 'Smith' },
        email: { label: 'Email Address', placeholder: 'john@example.com' },
        phone: { label: 'Phone Number', placeholder: '(555) 123-4567' },
        streetAddress: { label: 'Street Address', placeholder: '123 Main Street' },
        apartment: { label: 'Apartment, Suite, etc. (Optional)', placeholder: 'Unit 5' },
        city: { label: 'City', placeholder: 'Denver' },
        state: { label: 'State', placeholder: 'CO' },
        zipCode: { label: 'ZIP Code', placeholder: '80203' },
      },
    },
    documents: {
      heading: 'Documents',
      description:
        'You can upload documents that may help our team understand your situation.',
      examplesHeading: 'Examples include:',
      exampleItems: [
        'Medical bills',
        'Explanation of benefits',
        'Insurance letters',
        'Claim denial letters',
        'Other relevant documents',
      ],
      chooseFiles: 'Choose files',
      remove: 'Remove',
      skipLabel: 'You can skip this step and provide documents later.',
      skipButtonLabel: 'Skip this step',
      maxFileSizeWarning: 'Maximum file size is 10 MB per file.',
      maxTotalSizeWarning: 'Maximum total upload size is 50 MB.',
      allowedTypesDescription: 'Accepted file types: PDF, JPG, JPEG, PNG',
    },
    review: {
      heading: 'Review Your Request',
      subheading: 'Please review your information before submitting.',
      edit: 'Edit',
    },
    navigation: {
      back: 'Back',
      continue: 'Continue',
      submit: 'Submit Request',
      progressLabel: (current: number, total: number) => `Step ${current} of ${total}`,
      progressAriaLabel: 'Form progress',
    },
    errors: {
      required: 'This field is required.',
      invalidEmail: 'Please enter a valid email address.',
      invalidPhone: 'Please enter a valid phone number.',
      zipMustBeFiveDigits: 'ZIP code must be 5 digits',
      selectLanguage: 'Please select a language',
      invalidFileType: 'This file type is not allowed.',
      fileTooLarge: 'This file is too large. Maximum size is 10 MB.',
      totalSizeTooLarge: 'Total file size exceeds the 50 MB limit.',
      duplicateFile: 'You have already selected this file.',
      generic: 'There is an error with this field.',
      errorSummaryHeading: 'There are issues to fix:',
    },
  },

  submission: {
    submittingLabel: 'Submitting your request...',
    success: {
      heading: 'Request Received',
      message: 'Thank you for contacting the Consumer Assistance Program.',
      nextSteps:
        'A member of our team will review your request and contact you by phone or email. CAP generally responds within five business days, although it may take longer when we receive a high volume of requests.',
      referenceNumberLabel: 'Your reference number is:',
      contactInfoReminder:
        'Please keep any relevant medical bills, insurance letters, explanations of benefits, and claim information available in case our team needs additional information.',
      doneLabel: 'Done',
    },
    error: {
      heading: "We Couldn't Submit Your Request",
      message:
        'Your information was not submitted successfully. Please check your internet connection and try again.',
      retryLabel: 'Try Again',
      contactLabel: 'Contact CAP',
    },
    networkError: {
      heading: 'Your Connection Was Interrupted',
      message:
        "We couldn't finish submitting your request. Please reconnect and try again.",
      retryLabel: 'Try Again',
    },
    sessionExpired: {
      heading: 'This Request Is No Longer Active',
      message:
        'For your privacy, this intake session has expired. Please start a new request.',
      newRequestLabel: 'Start a New Request',
    },
  },

  appShell: {
    brand: 'CAP',
    privacyNoticeLabel: 'Privacy',
    privacyCopy:
      'Your information is used to help our team respond to your request and will be handled according to our privacy policy.',
    disclaimer:
      'The Consumer Assistance Program does not provide legal advice. If you believe you need legal assistance, please consult with an attorney.',
  },
}

export const es: MobileContent = {
  language: 'es',

  howWeHelp: {
    heroTitle: 'Obtenga Ayuda Gratuita con Facturas de Atención Médica y Seguros',
    heroSubtitle:
      'El Programa de Asistencia al Consumidor ayuda a los residentes de Colorado a navegar seguros de salud, facturas médicas, reclamaciones y acceso a la atención.',
    ctaGetHelp: 'Obtener Ayuda',
    whatWeHelpHeading: 'Con Qué Podemos Ayudar',
    services: [
      {
        title: 'Reclamaciones de Seguros Denegadas',
        description: 'Le ayudamos a entender y apelar reclamaciones de seguros denegadas.',
      },
      {
        title: 'Facturas Médicas',
        description: 'Asistencia para navegar facturas médicas y problemas de facturación.',
      },
      {
        title: 'Problemas de Cobertura y Acceso',
        description:
          'Ayuda para entender su cobertura de seguros y acceder a la atención necesaria.',
      },
      {
        title: 'Costos de Medicamentos',
        description: 'Apoyo con los costos de medicamentos recetados y acceso a medicinas.',
      },
    ],
    howItWorksHeading: 'Cómo Funciona CAP',
    steps: [
      {
        title: 'Cuéntenos Lo Que Está Sucediendo',
        description:
          'Comparta detalles sobre su problema de atención médica o seguro.',
      },
      {
        title: 'Un Miembro del Equipo de CAP Se Comunicará Con Usted',
        description: 'Alguien de nuestro equipo se comunicará para discutir su situación.',
      },
      {
        title: 'Recopilamos la Información Necesaria',
        description: 'Podemos solicitar documentos o detalles adicionales para entender su caso.',
      },
      {
        title: 'Trabajamos Con Usted Hacia una Resolución',
        description: 'Nuestro equipo trabaja en su nombre para ayudar a resolver su problema.',
      },
    ],
    whatWeDontHeading: 'Lo Que CAP No Hace',
    whatWeDontDescription: 'No pagamos facturas médicas directamente.',
    expectationsHeading: 'Qué Esperar',
    responseTime:
      'Un miembro de nuestro equipo generalmente se comunicará dentro de cinco días hábiles.',
    volumeWarning:
      'Los tiempos de respuesta pueden ser más largos durante períodos de alto volumen.',
  },

  intakeLanding: {
    heading: '¿Necesita Ayuda con una Factura de Atención Médica o un Problema de Seguros?',
    subheading: 'CAP proporciona asistencia gratuita a los consumidores de Colorado.',
    beforeYouBeginHeading: 'Antes de Empezar',
    beforeYouBeginDescription: 'Se le pedirá que proporcione:',
    beforeYouBeginItems: [
      'Su información de contacto',
      'Su dirección',
      'Información básica sobre su situación',
      'Documentos que puedan ayudar a nuestro equipo a entender su caso',
    ],
    estimatedTime: 'El formulario debería tomar aproximadamente 10-15 minutos.',
    dataUse: 'Su información se utiliza para ayudar a nuestro equipo a responder a su solicitud.',
    keyPoints: [
      'CAP es gratuito.',
      'No pagamos facturas médicas directamente.',
      'Enviar este formulario no garantiza que CAP pueda asumir su caso.',
      'Un miembro del equipo de CAP se comunicará con usted.',
      'Los tiempos de respuesta pueden ser más largos durante períodos de alto volumen.',
    ],
    startCta: 'Comenzar una Nueva Solicitud',
  },

  intakeForm: {
    stepLabels: ['Ubicación', 'Idioma', 'Información de Contacto', 'Documentos', 'Revisión'],
    zip: {
      label: '¿Cuál es el código postal en el que vive?',
      hint: 'Lo usaremos para ayudar a llenar su ciudad y estado.',
      placeholder: '80203',
      notFoundMessage:
        'No pudimos encontrar ese código postal. Puede continuar e ingresar su dirección manualmente.',
      lookUp: 'Buscar',
      applying: 'Buscando...',
    },
    language: {
      label: 'Idioma Preferido',
      options: { en: 'English', es: 'Español' },
    },
    contact: {
      heading: 'Información de Contacto',
      fields: {
        firstName: { label: 'Nombre', placeholder: 'Juan' },
        lastName: { label: 'Apellido', placeholder: 'Smith' },
        email: { label: 'Dirección de Correo Electrónico', placeholder: 'juan@example.com' },
        phone: { label: 'Número de Teléfono', placeholder: '(555) 123-4567' },
        streetAddress: { label: 'Dirección', placeholder: '123 Calle Principal' },
        apartment: { label: 'Apartamento, Suite, etc. (Opcional)', placeholder: 'Unidad 5' },
        city: { label: 'Ciudad', placeholder: 'Denver' },
        state: { label: 'Estado', placeholder: 'CO' },
        zipCode: { label: 'Código Postal', placeholder: '80203' },
      },
    },
    documents: {
      heading: 'Documentos',
      description:
        'Puede cargar documentos que puedan ayudar a nuestro equipo a entender su situación.',
      examplesHeading: 'Los ejemplos incluyen:',
      exampleItems: [
        'Facturas médicas',
        'Explicación de beneficios',
        'Cartas de seguros',
        'Cartas de reclamación denegada',
        'Otros documentos relevantes',
      ],
      chooseFiles: 'Elegir archivos',
      remove: 'Quitar',
      skipLabel: 'Puede saltar este paso y proporcionar documentos después.',
      skipButtonLabel: 'Saltar este paso',
      maxFileSizeWarning: 'El tamaño máximo de archivo es 10 MB por archivo.',
      maxTotalSizeWarning: 'El tamaño total máximo de carga es 50 MB.',
      allowedTypesDescription: 'Tipos de archivo aceptados: PDF, JPG, JPEG, PNG',
    },
    review: {
      heading: 'Revise Su Solicitud',
      subheading: 'Por favor revise su información antes de enviarla.',
      edit: 'Editar',
    },
    navigation: {
      back: 'Atrás',
      continue: 'Continuar',
      submit: 'Enviar Solicitud',
      progressLabel: (current: number, total: number) => `Paso ${current} de ${total}`,
      progressAriaLabel: 'Progreso del formulario',
    },
    errors: {
      required: 'Este campo es obligatorio.',
      invalidEmail: 'Por favor, introduzca una dirección de correo electrónico válida.',
      invalidPhone: 'Por favor, introduzca un número de teléfono válido.',
      zipMustBeFiveDigits: 'El código postal debe tener 5 dígitos',
      selectLanguage: 'Por favor, seleccione un idioma',
      invalidFileType: 'Este tipo de archivo no está permitido.',
      fileTooLarge: 'Este archivo es demasiado grande. El tamaño máximo es 10 MB.',
      totalSizeTooLarge: 'El tamaño total del archivo excede el límite de 50 MB.',
      duplicateFile: 'Ya ha seleccionado este archivo.',
      generic: 'Hay un error con este campo.',
      errorSummaryHeading: 'Hay problemas que corregir:',
    },
  },

  submission: {
    submittingLabel: 'Enviando su solicitud...',
    success: {
      heading: 'Solicitud Recibida',
      message: 'Gracias por comunicarse con el Programa de Asistencia al Consumidor.',
      nextSteps:
        'Un miembro de nuestro equipo revisará su solicitud y se comunicará con usted por teléfono o correo electrónico. CAP generalmente responde dentro de cinco días hábiles, aunque puede tomar más tiempo cuando recibimos un alto volumen de solicitudes.',
      referenceNumberLabel: 'Su número de referencia es:',
      contactInfoReminder:
        'Tenga a mano cualquier factura médica relevante, carta de seguros, explicación de beneficios e información de reclamación en caso de que nuestro equipo necesite información adicional.',
      doneLabel: 'Listo',
    },
    error: {
      heading: 'No Pudimos Enviar Su Solicitud',
      message:
        'Su información no se envió correctamente. Por favor, verifique su conexión a internet e intente nuevamente.',
      retryLabel: 'Intentar de Nuevo',
      contactLabel: 'Contactar a CAP',
    },
    networkError: {
      heading: 'Su Conexión Fue Interrumpida',
      message:
        "No pudimos terminar de enviar su solicitud. Por favor, reconéctese e intente nuevamente.",
      retryLabel: 'Intentar de Nuevo',
    },
    sessionExpired: {
      heading: 'Esta Solicitud Ya No Está Activa',
      message:
        'Para su privacidad, esta sesión de solicitud ha expirado. Por favor, comience una nueva solicitud.',
      newRequestLabel: 'Comenzar una Nueva Solicitud',
    },
  },

  appShell: {
    brand: 'CAP',
    privacyNoticeLabel: 'Privacidad',
    privacyCopy:
      'Su información se utiliza para ayudar a nuestro equipo a responder a su solicitud y se manejará de acuerdo con nuestra política de privacidad.',
    disclaimer:
      'El Programa de Asistencia al Consumidor no proporciona asesoramiento legal. Si cree que necesita asistencia legal, consulte con un abogado.',
  },
}
