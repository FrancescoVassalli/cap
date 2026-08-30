import type { ChangeEvent, FocusEvent } from 'react'
import { EmailInput } from '@/components/forms/EmailInput'
import { FormField } from '@/components/forms/FormField'
import { PhoneInput } from '@/components/forms/PhoneInput'
import { TextInput } from '@/components/forms/TextInput'
import type { AllContent } from '@/content'
import type { IntakeFormValues } from '@/types/index'
import type { FormikErrors, FormikTouched } from 'formik'

interface ContactStepProps {
  content: AllContent
  values: IntakeFormValues
  errors: FormikErrors<IntakeFormValues>
  touched: FormikTouched<IntakeFormValues>
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  onBlur: (event: FocusEvent<HTMLInputElement>) => void
}

export function ContactStep({ content, values, errors, touched, onChange, onBlur }: ContactStepProps) {
  const fields = content.intakeForm.contact.fields

  const firstNameError = touched.firstName && errors.firstName ? errors.firstName : undefined
  const lastNameError = touched.lastName && errors.lastName ? errors.lastName : undefined
  const emailError = touched.email && errors.email ? errors.email : undefined
  const phoneError = touched.phone && errors.phone ? errors.phone : undefined
  const streetAddressError = touched.streetAddress && errors.streetAddress ? errors.streetAddress : undefined
  const apartmentError = touched.apartment && errors.apartment ? errors.apartment : undefined
  const cityError = touched.city && errors.city ? errors.city : undefined
  const stateError = touched.state && errors.state ? errors.state : undefined

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-slate-900">{content.intakeForm.contact.heading}</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={fields.firstName.label} htmlFor="firstName" required error={firstNameError}>
          <TextInput
            id="firstName"
            name="firstName"
            autoComplete="given-name"
            value={values.firstName}
            onChange={onChange}
            onBlur={onBlur}
            aria-required="true"
            isInvalid={Boolean(firstNameError)}
            aria-invalid={Boolean(firstNameError)}
          />
        </FormField>

        <FormField label={fields.lastName.label} htmlFor="lastName" required error={lastNameError}>
          <TextInput
            id="lastName"
            name="lastName"
            autoComplete="family-name"
            value={values.lastName}
            onChange={onChange}
            onBlur={onBlur}
            aria-required="true"
            isInvalid={Boolean(lastNameError)}
            aria-invalid={Boolean(lastNameError)}
          />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={fields.email.label} htmlFor="email" required error={emailError}>
          <EmailInput
            id="email"
            name="email"
            value={values.email}
            onChange={onChange}
            onBlur={onBlur}
            aria-required="true"
            isInvalid={Boolean(emailError)}
            aria-invalid={Boolean(emailError)}
          />
        </FormField>

        <FormField label={fields.phone.label} htmlFor="phone" error={phoneError}>
          <PhoneInput
            id="phone"
            name="phone"
            value={values.phone}
            onChange={onChange}
            onBlur={onBlur}
            isInvalid={Boolean(phoneError)}
            aria-invalid={Boolean(phoneError)}
          />
        </FormField>
      </div>

      <FormField label={fields.address1.label} htmlFor="streetAddress" required error={streetAddressError}>
        <TextInput
          id="streetAddress"
          name="streetAddress"
          autoComplete="street-address"
          value={values.streetAddress}
          onChange={onChange}
          onBlur={onBlur}
          aria-required="true"
          isInvalid={Boolean(streetAddressError)}
          aria-invalid={Boolean(streetAddressError)}
        />
      </FormField>

      <FormField label={fields.address2.label} htmlFor="apartment" error={apartmentError}>
        <TextInput
          id="apartment"
          name="apartment"
          autoComplete="address-line2"
          value={values.apartment}
          onChange={onChange}
          onBlur={onBlur}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={fields.city.label} htmlFor="city" required error={cityError}>
          <TextInput
            id="city"
            name="city"
            autoComplete="address-level2"
            value={values.city}
            onChange={onChange}
            onBlur={onBlur}
            aria-required="true"
            isInvalid={Boolean(cityError)}
            aria-invalid={Boolean(cityError)}
          />
        </FormField>

        <FormField label={fields.state.label} htmlFor="state" required error={stateError}>
          <TextInput
            id="state"
            name="state"
            autoComplete="address-level1"
            value={values.state}
            onChange={onChange}
            onBlur={onBlur}
            aria-required="true"
            isInvalid={Boolean(stateError)}
            aria-invalid={Boolean(stateError)}
          />
        </FormField>
      </div>
    </div>
  )
}