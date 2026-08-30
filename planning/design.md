# CAP Design System Documentation

## Overview

The CAP design system provides a complete, accessible, mobile-first UI foundation for the Consumer Assistance Program frontend. All components follow WCAG 2.2 AA accessibility standards and are optimized for phone-based form completion.

## Installation

All form and feedback components are ready to use via barrel exports:

```tsx
import { Button, TextInput, EmailInput, FormField, Card } from '@/components/forms'
import { FormError, Alert, ProgressBar } from '@/components/feedback'
import { Container, FormFooter } from '@/components/layout'
```

## Design Tokens

### Colors

**Brand Colors** (`tailwind.config.ts`):
- **Primary**: `#01599A` (headers, buttons, links, active states)
- **Secondary**: `#7AABDB` (backgrounds, secondary actions, accents)
- **Highlight**: `#FEC524` (calls-to-action, attention areas)

**Semantic Colors**:
- **Error**: `#B91C1C` (validation errors, alerts)
- **Success**: `#166534` (success states, confirmations)
- **Focus**: `#2563EB` (keyboard focus indicators)

### Typography

- **Body**: 16px (phone-friendly)
- **Line Height**: 1.5 (generous, readable)
- **Small Text**: 14px minimum (never below)
- **Headings**: Clear hierarchy with responsive sizing

### Spacing & Touch Targets

- **Minimum Touch Target**: 44px × 44px (WCAG compliant)
- **Preferred Button Height**: 48px
- **Container Max Width**: 1100–1200px (responsive padding)
- **Narrow Reading Width**: ~760px (long-form content)

## Form Primitives

All form controls support:
- `isInvalid` prop for error states
- Controlled input patterns (name, value, onChange, onBlur)
- Keyboard focus with visible indicators
- Strong contrast and clear validation feedback

### Button

```tsx
<Button variant="primary" size="lg" fullWidth>
  Submit
</Button>
```

**Props**:
- `variant`: `'primary'` | `'secondary'` | `'outline'` (default: `'primary'`)
- `size`: `'sm'` | `'md'` | `'lg'` (default: `'md'`)
- `fullWidth`: boolean (default: `false`)
- `isLoading`: boolean (default: `false`)
- All standard HTML button attributes

### TextInput

```tsx
<TextInput
  value={firstName}
  onChange={(e) => setFirstName(e.target.value)}
  isInvalid={error !== undefined}
/>
```

**Props**:
- `isInvalid`: boolean (default: `false`)
- Standard HTML input attributes (`autoComplete`, `required`, etc.)

### EmailInput

Auto-configures for email input with `type="email"` and `inputMode="email"`.

```tsx
<EmailInput
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  autoComplete="email"
  isInvalid={error !== undefined}
/>
```

### PhoneInput

Auto-configures for phone input with `type="tel"` and `inputMode="tel"`.

```tsx
<PhoneInput
  value={phone}
  onChange={(e) => setPhone(e.target.value)}
  autoComplete="tel"
  isInvalid={error !== undefined}
/>
```

### ZipInput

Auto-configures for ZIP code (max 5 digits, `inputMode="numeric"`).

```tsx
<ZipInput
  value={zip}
  onChange={(e) => setZip(e.target.value)}
  autoComplete="postal-code"
  isInvalid={error !== undefined}
/>
```

### Select

```tsx
<Select
  value={state}
  onChange={(e) => setState(e.target.value)}
  options={[
    { value: 'CO', label: 'Colorado' },
    { value: 'WY', label: 'Wyoming' },
  ]}
  isInvalid={error !== undefined}
/>
```

**Props**:
- `options`: `Array<{ value: string; label: string }>` (alternative to children)
- `isInvalid`: boolean (default: `false`)

### Textarea

```tsx
<Textarea
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  rows={5}
  isInvalid={error !== undefined}
/>
```

### Checkbox

```tsx
<Checkbox
  label="I agree to the terms"
  checked={agreed}
  onChange={(e) => setAgreed(e.target.checked)}
  isInvalid={error !== undefined}
/>
```

**Props**:
- `label`: string (optional label text)
- `isInvalid`: boolean (default: `false`)

### RadioGroup

```tsx
<RadioGroup
  name="language"
  value={language}
  onChange={(e) => setLanguage(e.target.value)}
  options={[
    { value: 'en', label: '🇺🇸 English' },
    { value: 'es', label: '🇲🇽 Español' },
  ]}
  orientation="vertical"
  isInvalid={error !== undefined}
/>
```

**Props**:
- `name`: string (required, for form grouping)
- `options`: `RadioOption[]` (required)
- `orientation`: `'horizontal'` | `'vertical'` (default: `'vertical'`)
- `isInvalid`: boolean (default: `false`)

### FileInput

```tsx
<FileInput
  label="PDF, JPG, or PNG (max 10 MB)"
  accept=".pdf,.jpg,.jpeg,.png"
  onChange={(e) => handleFileSelect(e.target.files?.[0])}
/>
```

**Props**:
- `label`: string (helper text below input)
- All standard HTML file input attributes

## Form Integration

### FormField Wrapper

Wrap any input with `FormField` for consistent label, error, and hint text:

```tsx
<FormField
  label="Email"
  htmlFor="email-input"
  required
  error={errors.email}
  hint="We'll use this to follow up on your request"
>
  <EmailInput
    id="email-input"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    isInvalid={!!errors.email}
    aria-describedby={errors.email ? 'email-error' : 'email-hint'}
  />
</FormField>
```

**Props**:
- `label`: string (optional)
- `htmlFor`: string (connects label to input)
- `required`: boolean (adds red asterisk)
- `error`: string (shows error message, replaces hint)
- `hint`: string (shows helper text, hidden if error exists)
- `className`: string (optional styling)

## Feedback Components

### FormError

Standalone error alert for non-field errors:

```tsx
<FormError message="Failed to submit. Please try again." />
```

**Props**:
- `message`: string (optional)
- `className`: string (optional)

### Alert

Multi-purpose alert for info, success, warning, and error:

```tsx
<Alert type="success" title="Form submitted!">
  Your intake has been received. A CAP team member will follow up within 5 business days.
</Alert>
```

**Props**:
- `type`: `'error'` | `'success'` | `'info'` | `'warning'` (default: `'info'`)
- `title`: string (optional bold headline)
- `className`: string (optional)

### Card

Simple container for grouping content:

```tsx
<Card>
  <h2>Contact Information</h2>
  <FormField label="Name" required>
    <TextInput />
  </FormField>
</Card>
```

**Props**:
- `variant`: `'default'` | `'elevated'` (default: `'default'`)
  - `'default'`: border-based
  - `'elevated'`: shadow-based
- `className`: string (optional)

### ProgressBar

Step progress indicator for multi-step forms:

```tsx
<ProgressBar current={2} total={4} showLabel />
```

Output: "Step 2 of 4" with visual bar

**Props**:
- `current`: number (current step, 1-indexed)
- `total`: number (total steps)
- `size`: `'sm'` | `'md'` | `'lg'` (default: `'md'`)
- `showLabel`: boolean (default: `false`)
- `className`: string (optional)

### FormHint

Standalone hint/helper text:

```tsx
<FormHint message="Response time may be longer during high-volume periods." />
```

**Props**:
- `message`: string (optional)
- `className`: string (optional)

## Layout Components

### Container

Centered, responsive container with padding and max-width:

```tsx
<Container size="md">
  <h1>How We Help</h1>
  <p>Content</p>
</Container>
```

**Props**:
- `size`: `'sm'` | `'md'` | `'lg'` | `'full'` (default: `'md'`)
  - `'sm'`: max-w-md (reading width)
  - `'md'`: max-w-3xl (typical pages)
  - `'lg'`: max-w-4xl (wider layouts)
  - `'full'`: no max-width
- `className`: string (optional)

### FormFooter

Navigation footer for multi-step forms (back/continue buttons):

```tsx
<FormFooter
  showBack
  onBack={() => goToPreviousStep()}
  onContinue={() => goToNextStep()}
  isLoading={isSubmitting}
  isDisabled={!isValid}
/>
```

**Props**:
- `showBack`: boolean (default: `true`)
- `onBack`: () => void (optional)
- `onContinue`: () => void (optional)
- `backLabel`: string (default: `'Back'`)
- `continueLabel`: string (default: `'Continue'`)
- `isLoading`: boolean (default: `false`)
- `isDisabled`: boolean (default: `false`)
- `className`: string (optional)
- Children: custom content instead of default buttons

### AppShell

Global layout wrapper (header, main, footer):

```tsx
<AppShell>
  <Router />
</AppShell>
```

Includes:
- Header with CAP logo and navigation
- Main content area with responsive padding
- Footer with copyright

## Accessibility Guarantees

✓ **Keyboard Navigation**: All interactive elements are keyboard accessible
✓ **Focus Visibility**: Clear focus rings on all focusable elements
✓ **Color Contrast**: All text and controls meet WCAG AA contrast requirements
✓ **Semantic HTML**: Proper heading hierarchy, labels, and form structure
✓ **ARIA**: `aria-invalid`, `aria-describedby`, `role="alert"`, etc. where needed
✓ **Touch Targets**: 44px minimum (48px preferred) for all interactive controls
✓ **Error Association**: Error messages tied to relevant form fields
✓ **Screen Reader Support**: Proper labeling and live regions for feedback

## Mobile-First Responsive Design

All components are optimized for:
- **Phone** (320px–767px): Stack, full-width, large touch targets
- **Tablet** (768px–1023px): Adaptive spacing and layout
- **Desktop** (1024px+): Full navigation and multi-column layouts

## Using with Formik

All primitives work directly with Formik's field state:

```tsx
<Formik
  initialValues={{ email: '', language: 'en' }}
  validationSchema={validationSchema}
  onSubmit={handleSubmit}
>
  {({ values, errors, touched, setFieldValue }) => (
    <form>
      <FormField
        label="Email"
        htmlFor="email"
        required
        error={touched.email && errors.email}
        hint="We'll use this to follow up"
      >
        <EmailInput
          id="email"
          name="email"
          value={values.email}
          onChange={(e) => setFieldValue('email', e.target.value)}
          onBlur={() => setFieldTouched('email', true)}
          isInvalid={touched.email && !!errors.email}
          aria-describedby={touched.email && errors.email ? 'email-error' : 'email-hint'}
        />
      </FormField>

      <FormFooter
        onContinue={handleContinue}
        isLoading={isSubmitting}
        isDisabled={!isValid}
      />
    </form>
  )}
</Formik>
```

## Styling Customization

All components accept `className` for additional Tailwind classes:

```tsx
<Button className="shadow-lg">Custom Button</Button>
<Card className="border-2 border-cap-primary">Custom Card</Card>
```

Use Tailwind's utility classes for quick modifications without breaking the design system.

## What This Design System Does NOT Include

- Page-level logic or business behavior
- ZIP lookup, submission, or document upload logic
- Route navigation or page composition
- Copy-heavy marketing text
- API integration or data fetching
- Formik form state management (left to consuming pages)

These remain the responsibility of downstream page and intake form components.

## Definition of Done

The design system is complete and ready for intake form work when:
- ✓ All primitives are implemented and tested
- ✓ Styling matches CAP/CCHI visual direction
- ✓ Mobile-first design is verified on real phones
- ✓ All WCAG 2.2 AA requirements are met
- ✓ Components have clear, stable APIs
- ✓ Build, lint, test, and typecheck all pass
- ✓ Documentation is complete and examples work
- ✓ Downstream page agents can compose without redesigning the UI layer

---

**Last Updated**: 2026-08-29
**Status**: Ready for Integration and Content work
