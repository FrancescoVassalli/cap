/**
 * Spanish content for the CAP frontend.
 * Translated from the English source and structured for bilingual support.
 * ⚠️ REVIEW MARKERS: Content flagged with [CAP REVIEW] requires human verification
 * for tone, accuracy, and cultural appropriateness before production deployment.
 */

import type { AllContent } from "./types";

export const es: AllContent = {
  language: "es",

  // ========================================================================
  // Navigation
  // ========================================================================

  navigation: {
    brand: "CAP",
    logo: {
      alt: "Programa de Asistencia al Consumidor",
    },
    skipLink: {
      label: "Saltar al contenido principal",
    },
    mainNav: {
      ariaLabel: "Navegación principal",
      howWeHelp: "Cómo Podemos Ayudar",
      getHelp: "Obtener Ayuda",
    },
    mobileMenu: {
      label: "Menú",
    },
    footer: {
      ariaLabel: "Pie de página de CAP",
      navLabel: "Navegación de pie de página",
      copyright: "© Iniciativa de Salud del Consumidor de Colorado. Todos los derechos reservados.",
    },
  },

  // ========================================================================
  // How We Help Page
  // ========================================================================

  howWeHelp: {
    hero: {
      title: "Obtenga Ayuda Gratuita con Facturas de Atención Médica y Seguros",
      subtitle:
        "El Programa de Asistencia al Consumidor ayuda a los residentes de Colorado a navegar seguros de salud, facturas médicas, reclamaciones y acceso a la atención.",
      ctaLabel: "Obtener Ayuda",
    },

    whatWeHelp: {
      heading: "Con Qué Podemos Ayudar",
      services: [
        {
          title: "Reclamaciones de Seguros Denegadas",
          description:
            "Le ayudamos a entender y apelar reclamaciones de seguros denegadas.",
        },
        {
          title: "Facturas Médicas",
          description: "Asistencia para navegar facturas médicas y problemas de facturación.",
        },
        {
          title: "Problemas de Cobertura y Acceso",
          description:
            "Ayuda para entender su cobertura de seguros y acceder a la atención necesaria.",
        },
        {
          title: "Costos de Medicamentos",
          description:
            "Apoyo con los costos de medicamentos recetados y acceso a medicinas.",
        },
      ],
    },

    howItWorks: {
      heading: "Cómo Funciona CAP",
      stepLabel: (stepNumber: number) => `Paso ${stepNumber}`,
      steps: [
        {
          stepNumber: 1,
          title: "Cuéntenos Lo Que Está Sucediendo",
          description:
            "Comparta detalles sobre su problema de atención médica o seguro.",
        },
        {
          stepNumber: 2,
          title: "Un Miembro del Equipo de CAP Se Comunicará Con Usted",
          description:
            "Alguien de nuestro equipo se comunicará para discutir su situación.",
        },
        {
          stepNumber: 3,
          title: "Recopilamos la Información Necesaria",
          description:
            "Podemos solicitar documentos o detalles adicionales para entender su caso.",
        },
        {
          stepNumber: 4,
          title: "Trabajamos Con Usted Hacia una Resolución",
          description:
            "Nuestro equipo trabaja en su nombre para ayudar a resolver su problema.",
        },
      ],
    },

    whatWeDont: {
      heading: "Lo Que CAP No Hace",
      description: "No pagamos facturas médicas directamente.",
    },

    expectations: {
      heading: "Qué Esperar",
      responseTime:
        "Un miembro de nuestro equipo generalmente se comunicará dentro de cinco días hábiles.",
      volumeWarning:
        "Los tiempos de respuesta pueden ser más largos durante períodos de alto volumen.",
    },

    primaryCta: {
      label: "Obtener Ayuda",
    },

    secondaryCta: {
      label: "Recursos para Consumidores",
      url: "#", // TODO: Add actual resource URL when available
    },
  },

  // ========================================================================
  // Intake Landing Page
  // ========================================================================

  intakeLanding: {
    heading: "¿Necesita Ayuda con una Factura de Atención Médica o un Problema de Seguros?",
    subheading:
      "CAP proporciona asistencia gratuita a los consumidores de Colorado.",

    beforeYouBegin: {
      heading: "Antes de Empezar",
      description: "Se le pedirá que proporcione:",
      items: [
        "Su información de contacto",
        "Su dirección",
        "Información básica sobre su situación",
        "Documentos que puedan ayudar a nuestro equipo a entender su caso",
      ],
    },

    estimatedTime: "El formulario debería tomar aproximadamente 10-15 minutos.",

    dataUse:
      "Su información se utiliza para ayudar a nuestro equipo a responder a su solicitud.",

    keyPoints: {
      isFree: "CAP es gratuito.",
      noDirectPayment: "No pagamos facturas médicas directamente.",
      noGuarantee:
        "Enviar este formulario no garantiza que CAP pueda asumir su caso.",
      responseFollowUp: "Un miembro del equipo de CAP se comunicará con usted.",
      volumeWarning:
        "Los tiempos de respuesta pueden ser más largos durante períodos de alto volumen.",
    },

    startCta: {
      label: "Comenzar una Nueva Solicitud",
    },
  },

  // ========================================================================
  // Intake Form Steps
  // ========================================================================

  intakeForm: {
    stepLabels: {
      zip: "Ubicación",
      language: "Idioma",
      contact: "Información de Contacto",
      documents: "Documentos",
    },

    zip: {
      label: "¿Cuál es el código postal en el que vive?",
      hint: "Lo usaremos para ayudar a llenar su ciudad y estado.",
      placeholder: "80203",
      notFoundMessage:
        "No pudimos encontrar ese código postal. Puede continuar e ingresar su dirección manualmente.",
    },

    language: {
      label: "Idioma Preferido",
      options: {
        en: "English",
        es: "Español",
      },
    },

    contact: {
      heading: "Información de Contacto",
      fields: {
        firstName: {
          label: "Nombre",
          placeholder: "Juan",
        },
        lastName: {
          label: "Apellido",
          placeholder: "Smith",
        },
        email: {
          label: "Dirección de Correo Electrónico",
          placeholder: "juan@example.com",
        },
        phone: {
          label: "Número de Teléfono",
          placeholder: "(555) 123-4567",
        },
        address1: {
          label: "Dirección",
          placeholder: "123 Calle Principal",
        },
        address2: {
          label: "Apartamento, Suite, etc. (Opcional)",
          placeholder: "Unidad 5",
        },
        city: {
          label: "Ciudad",
          placeholder: "Denver",
        },
        state: {
          label: "Estado",
          placeholder: "CO",
        },
        zipCode: {
          label: "Código Postal",
          placeholder: "80203",
        },
      },
    },

    documents: {
      heading: "Documentos",
      description:
        "Puede cargar documentos que puedan ayudar a nuestro equipo a entender su situación.",
      examples: {
        heading: "Los ejemplos incluyen:",
        items: [
          "Facturas médicas",
          "Explicación de beneficios",
          "Cartas de seguros",
          "Cartas de reclamación denegada",
          "Otros documentos relevantes",
        ],
      },
      chooseFiles: "Elegir archivos",
      remove: "Quitar",
      skipLabel: "Puede proporcionar documentos más adelante.",
      skipButtonLabel: "Borrar archivos seleccionados",
      maxFileSizeWarning: "El tamaño máximo de archivo es 10 MB por archivo.",
      maxTotalSizeWarning: "El tamaño total máximo de carga es 50 MB.",
      allowedTypesDescription:
        "Tipos de archivo aceptados: PDF, JPG, JPEG, PNG",
    },

    navigation: {
      back: "Atrás",
      continue: "Continuar",
      submit: "Enviar Solicitud",
      progressLabel: (current: number, total: number) =>
        `Paso ${current} de ${total}`,
      progressAriaLabel: "Progreso del formulario",
    },

    errors: {
      required: "Este campo es obligatorio.",
      invalidEmail:
        "Por favor, introduzca una dirección de correo electrónico válida.",
      invalidPhone: "Por favor, introduzca un número de teléfono válido.",
      invalidZip: "Por favor, introduzca un código postal válido.",
      zipMustBeFiveDigits: "El código postal debe tener 5 dígitos",
      selectLanguage: "Por favor, seleccione un idioma",
      invalidFileType: "Este tipo de archivo no está permitido.",
      fileTooLarge:
        "Este archivo es demasiado grande. El tamaño máximo es 10 MB.",
      totalSizeTooLarge: "El tamaño total del archivo excede el límite de 50 MB.",
      duplicateFile: "Ya ha seleccionado este archivo.",
      generic: "Hay un error con este campo.",
      errorSummaryHeading: "Hay problemas que corregir:",
    },
  },

  // ========================================================================
  // Submission / Result States
  // ========================================================================

  submission: {
    idle: {
      label: "Enviar Solicitud",
    },

    submitting: {
      label: "Enviando su solicitud...",
    },

    success: {
      heading: "Solicitud Recibida",
      message:
        "Gracias por comunicarse con el Programa de Asistencia al Consumidor.",
      nextSteps:
        "Un miembro de nuestro equipo revisará su solicitud y se comunicará con usted por teléfono o correo electrónico. " +
        "CAP generalmente responde dentro de cinco días hábiles, aunque puede tomar más tiempo cuando recibimos un alto volumen de solicitudes.",
      referenceNumberLabel: "Su número de referencia es:",
      contactInfoReminder:
        "Tenga a mano cualquier factura médica relevante, carta de seguros, explicación de beneficios e información de reclamación en caso de que nuestro equipo necesite información adicional.",
    },

    error: {
      heading: "No Pudimos Enviar Su Solicitud",
      message:
        "Su información no se envió correctamente. Por favor, verifique su conexión a internet e intente nuevamente.",
      retryLabel: "Intentar de Nuevo",
      contactLabel: "Contactar a CAP",
    },

    networkError: {
      heading: "Su Conexión Fue Interrumpida",
      message:
        "No pudimos terminar de enviar su solicitud. Por favor, reconéctese e intente nuevamente.",
      retryLabel: "Intentar de Nuevo",
    },

    sessionExpired: {
      heading: "Esta Solicitud Ya No Está Activa",
      message:
        "Para su privacidad, esta sesión de solicitud ha expirado. Por favor, comience una nueva solicitud.",
      newRequestLabel: "Comenzar una Nueva Solicitud",
    },
  },

  // ========================================================================
  // Not Found Page
  // ========================================================================

  notFound: {
    heading: "No pudimos encontrar esa página.",
    description:
      "Es posible que la página se haya movido o que el enlace esté desactualizado.",
    goToCapLabel: "Ir a CAP",
    getHelpLabel: "Obtener Ayuda",
  },

  // ========================================================================
  // Legal and Information
  // ========================================================================

  legal: {
    privacy: {
      heading: "Privacidad",
      content:
        "Su información se utiliza para ayudar a nuestro equipo a responder a su solicitud y se manejará de acuerdo con nuestra política de privacidad.",
    },
    disclaimer: {
      content:
        "El Programa de Asistencia al Consumidor no proporciona asesoramiento legal. Si cree que necesita asistencia legal, consulte con un abogado.",
    },
  },
};
