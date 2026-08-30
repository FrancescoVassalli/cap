/**
 * CONTENT USAGE GUIDE
 *
 * This file demonstrates how page components should use the content module.
 * All UI copy in CAP frontend should be imported from the content layer,
 * not hard-coded in components.
 *
 * ============================================================================
 * BASIC USAGE
 * ============================================================================
 *
 * To use content in a component, import getContent and call it with the
 * current language:
 *
 *   import { getContent } from "@/content";
 *
 *   export function HowWeHelpPage() {
 *     const content = getContent(currentLanguage);
 *     return <h1>{content.howWeHelp.hero.title}</h1>;
 *   }
 *
 * ============================================================================
 * GETTING LANGUAGE FROM CONTEXT/STATE
 * ============================================================================
 *
 * In a real app, language typically comes from:
 *
 * 1. React Context (recommended):
 *
 *    export function HowWeHelpPage() {
 *      const { language } = useLanguageContext();
 *      const content = getContent(language);
 *      return <h1>{content.howWeHelp.hero.title}</h1>;
 *    }
 *
 * 2. Formik (for intake form):
 *
 *    export function IntakeForm() {
 *      return (
 *        <Formik>
 *          {({ values }) => {
 *            const content = getContent(values.language);
 *            return <label>{content.intakeForm.contact.fields.firstName.label}</label>;
 *          }}
 *        </Formik>
 *      );
 *    }
 *
 * 3. URL params (less ideal but possible):
 *
 *    export function HowWeHelpPage() {
 *      const { lang } = useParams();
 *      const content = getContent(lang);
 *      return <h1>{content.howWeHelp.hero.title}</h1>;
 *    }
 *
 * ============================================================================
 * COMPONENT PATTERNS
 * ============================================================================
 *
 * WRONG - Hard-coded copy in component:
 *
 *   export function Hero() {
 *     return (
 *       <div>
 *         <h1>Get Free Help with Health Care Bills and Insurance</h1>
 *         <p>The Consumer Assistance Program helps Colorado consumers...</p>
 *       </div>
 *     );
 *   }
 *
 * RIGHT - Content imported and rendered:
 *
 *   import { getContent } from "@/content";
 *
 *   export function Hero({ language }: { language: string }) {
 *     const content = getContent(language);
 *     return (
 *       <div>
 *         <h1>{content.howWeHelp.hero.title}</h1>
 *         <p>{content.howWeHelp.hero.subtitle}</p>
 *       </div>
 *     );
 *   }
 *
 * ============================================================================
 * FORM COMPONENTS
 * ============================================================================
 *
 * Form labels and placeholders come from the content module:
 *
 *   import { getContent } from "@/content";
 *   import { TextInput } from "@/components/forms";
 *
 *   export function ContactForm({ language }: { language: string }) {
 *     const content = getContent(language);
 *
 *     return (
 *       <div>
 *         <TextInput
 *           label={content.intakeForm.contact.fields.firstName.label}
 *           placeholder={content.intakeForm.contact.fields.firstName.placeholder}
 *           name=\"firstName\"
 *         />
 *       </div>
 *     );
 *   }
 *
 * ============================================================================
 * ERROR MESSAGES
 * ============================================================================
 *
 * Validation error messages also come from content:
 *
 *   function validateEmail(email: string, content: AllContent): string | undefined {
 *     if (!email.includes(\"@\")) {
 *       return content.intakeForm.errors.invalidEmail;
 *     }
 *     return undefined;
 *   }
 *
 * ============================================================================
 * LISTS AND LOOPS
 * ============================================================================
 *
 * When rendering lists from content, loop over the array:
 *
 *   export function ServiceGrid({ language }: { language: string }) {
 *     const content = getContent(language);
 *     return (
 *       <div>
 *         {content.howWeHelp.whatWeHelp.services.map((service) => (
 *           <ServiceCard key={service.title} title={service.title} description={service.description} />
 *         ))}
 *       </div>
 *     );
 *   }
 *
 * ============================================================================
 * TYPE SAFETY
 * ============================================================================
 *
 * The content module is fully typed. TypeScript will warn you if you access\n * a non-existent key:
 *
 *   const content = getContent(\"en\");
 *   content.howWeHelp.hero.title;  // ✓ Valid
 *   content.howWeHelp.hero.nonExistent;  // ✗ TypeScript error\n *\n * This helps catch copy mistakes at build time.\n *\n * ============================================================================\n * UPDATING CONTENT\n * ============================================================================\n *\n * To update UI copy:\n *\n * 1. Edit src/content/en.ts or src/content/es.ts\n * 2. Maintain key parity between en and es\n * 3. Run npm run typecheck to verify\n * 4. Components automatically pick up changes (no component edits needed)\n *\n * ============================================================================\n * ADDING NEW CONTENT SECTIONS\n * ============================================================================\n *\n * To add new content (e.g., email footer):\n *\n * 1. Add interface to src/content/types.ts:\n *\n *    export interface EmailContent {\n *      footer: string;\n *      unsubscribe: string;\n *    }\n *\n * 2. Add to AllContent interface:\n *\n *    export interface AllContent {\n *      // ... existing ...\n *      email: EmailContent;\n *    }\n *\n * 3. Add to en.ts:\n *\n *    export const en: AllContent = {\n *      // ... existing ...\n *      email: {\n *        footer: \"...\",\n *        unsubscribe: \"...\",\n *      },\n *    };\n *\n * 4. Add to es.ts with Spanish translation\n * 5. Run npm run typecheck\n *\n * ============================================================================\n */\n