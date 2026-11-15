# Content Layer Guide

This document explains how components use the implemented content layer and how to add or change copy. The content layer is the source of truth for user-facing text and keeps English and Spanish in sync.

## Quick Start

All UI copy is now centralized in `src/content/`. Components should never hard-code text.

### Pattern 1: Simple Components

```typescript
import { getContent } from "@/content";

export function Hero({ language }: { language: string }) {
  const content = getContent(language);
  
  return (
    <div>
      <h1>{content.howWeHelp.hero.title}</h1>
      <p>{content.howWeHelp.hero.subtitle}</p>
      <button>{content.howWeHelp.hero.ctaLabel}</button>
    </div>
  );
}
```

### Pattern 2: With Language Context

```typescript
import { getContent } from "@/content";
import { useLanguageContext } from "@/context/LanguageContext";

export function HowWeHelpPage() {
  const { language } = useLanguageContext();
  const content = getContent(language);
  
  return (
    <main>
      <h1>{content.howWeHelp.hero.title}</h1>
      {/* Use content throughout */}
    </main>
  );
}
```

### Pattern 3: Rendering Lists

```typescript
import { getContent } from "@/content";

export function ServiceGrid({ language }: { language: string }) {
  const content = getContent(language);
  
  return (
    <div className="grid">
      {content.howWeHelp.whatWeHelp.services.map((service) => (
        <div key={service.title}>
          <h3>{service.title}</h3>
          <p>{service.description}</p>
        </div>
      ))}
    </div>
  );
}
```

## Content Structure by Page

### Navigation / Header
- `content.navigation.logo.alt`
- `content.navigation.mainNav.howWeHelp`
- `content.navigation.mainNav.getHelp`
- `content.navigation.footer.copyright`

### How We Help Page (`/how-we-help`)
- `content.howWeHelp.hero.title`
- `content.howWeHelp.hero.subtitle`
- `content.howWeHelp.hero.ctaLabel`
- `content.howWeHelp.whatWeHelp.heading` and `.services[]`
- `content.howWeHelp.howItWorks.heading` and `.steps[]`
- `content.howWeHelp.whatWeDont.heading` and `.description`
- `content.howWeHelp.expectations.heading`, `.responseTime`, `.volumeWarning`
- `content.howWeHelp.primaryCta.label`
- `content.howWeHelp.secondaryCta.label` and `.url`

### Intake Landing Page (`/intake`)
- `content.intakeLanding.heading`
- `content.intakeLanding.subheading`
- `content.intakeLanding.beforeYouBegin.heading`
- `content.intakeLanding.beforeYouBegin.items[]`
- `content.intakeLanding.keyPoints` - all fields
- `content.intakeLanding.startCta.label`

### Intake Form (`/intake/:id`)

**ZIP Step:**
```typescript
const { 
  label, 
  hint, 
  placeholder, 
  skipLabel, 
  notFoundMessage 
} = content.intakeForm.zip;
```

**Language Step:**
```typescript
const {
  label,
  options: { en, es }
} = content.intakeForm.language;
```

**Contact Step:**
```typescript
const { 
  heading, 
  fields: {
    firstName, lastName, email, phone, 
    address1, address2, city, state, zipCode
  }
} = content.intakeForm.contact;

// Each field has:
// - label: string
// - placeholder?: string
```

**Documents Step:**
```typescript
const {
  heading,
  description,
  examples: { heading: exHeading, items },
  skipLabel,
  maxFileSizeWarning,
  maxTotalSizeWarning,
  allowedTypesDescription
} = content.intakeForm.documents;
```

**Navigation & Progress:**
```typescript
const { back, continue: continueLabel, submit, progressLabel } = content.intakeForm.navigation;

// Use progressLabel in your component:
const stepText = progressLabel(2, 4); // "Step 2 of 4"
```

**Error Messages:**
```typescript
const {
  required,
  invalidEmail,
  invalidPhone,
  invalidZip,
  invalidFileType,
  fileTooLarge,
  totalSizeTooLarge,
  duplicateFile,
  generic,
  errorSummaryHeading
} = content.intakeForm.errors;
```

### Submission Success Screen

```typescript
const {
  heading,
  message,
  nextSteps,
  referenceNumberLabel,
  contactInfoReminder
} = content.submission.success;

// Reference number layout:
<div>
  <p>{referenceNumberLabel}</p>
  <p className="font-bold text-2xl">{referenceId}</p>
</div>
```

### Submission Error States

**General Error:**
```typescript
const { heading, message, retryLabel, contactLabel } = content.submission.error;
```

**Network Error:**
```typescript
const { heading, message, retryLabel } = content.submission.networkError;
```

**Session Expired:**
```typescript
const { heading, message, newRequestLabel } = content.submission.sessionExpired;
```

**Submitting:**
```typescript
const { label } = content.submission.submitting;
// Use as button label while submitting
```

## Key Principles

1. **Type Safety** - All content is typed; TypeScript will warn if you access a non-existent key
2. **Bilingual from Start** - Always pass language down; never hard-code it
3. **Centralized Updates** - Change copy in `src/content/en.ts` or `src/content/es.ts`, and all components automatically pick up the change
4. **Key Parity** - English and Spanish have matching key structure; if you add to `en.ts`, you must add to `es.ts`
5. **No String Concatenation** - Don't do `"Hello " + name + "!"`; put complete strings in content

## Adding New Content

If you need to add a new content section:

1. Add interface to `src/content/types.ts`:
   ```typescript
   export interface MyNewContent {
     title: string;
     description: string;
   }
   ```

2. Add to `AllContent` interface in `types.ts`:
   ```typescript
   export interface AllContent {
     // ... existing
     myNewSection: MyNewContent;
   }
   ```

3. Add to `src/content/en.ts`:
   ```typescript
   myNewSection: {
     title: "My English Title",
     description: "My English description"
   }
   ```

4. Add to `src/content/es.ts`:
   ```typescript
   myNewSection: {
     title: "Mi Título en Español",
     description: "Mi descripción en español"
   }
   ```

5. Run `npm run typecheck` to verify

## File References

- **Main Module:** `src/content/index.ts`
- **Type Definitions:** `src/content/types.ts`
- **English Content:** `src/content/en.ts`
- **Spanish Content:** `src/content/es.ts`
- **Usage Examples:** `src/content/USAGE.md`

## For Form Validation

Error messages are pre-populated in `content.intakeForm.errors`. When Formik validation fails, use these messages:

```typescript
import { getContent } from "@/content";

function validateEmail(email: string, language: string): string | undefined {
  if (!email.includes("@")) {
    return getContent(language).intakeForm.errors.invalidEmail;
  }
  return undefined;
}
```

## Language Handling

The `getContent(language)` function:
- Accepts `"en"` or `"es"`
- Defaults to `"en"` if language is undefined or invalid
- Use `isSupportedLanguage()` type guard if you need validation

```typescript
import { getContent, isSupportedLanguage } from "@/content";

if (isSupportedLanguage(userLanguage)) {
  const content = getContent(userLanguage);
} else {
  const content = getContent("en"); // fallback
}
```

## Design System Coordination

The form primitives (`TextInput`, `Button`, etc.) in [design-system.md](./design-system.md) expect:
- `label` from content
- `placeholder` from content
- `error` message from content.intakeForm.errors

Example integration:
```typescript
import { TextInput } from "@/components/forms";
import { getContent } from "@/content";

const content = getContent(language);
const contactFields = content.intakeForm.contact.fields;

<TextInput
  label={contactFields.firstName.label}
  placeholder={contactFields.firstName.placeholder}
  name="firstName"
/>
```

## References

- `src/content/USAGE.md` for detailed examples
- `src/content/types.ts` for complete interface definitions
- [planning/master.md](../planning/master.md) for product scope and requirements
- [docs/archive/frontend-implementation.md](./archive/frontend-implementation.md) for historical copy context
