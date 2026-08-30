/**
 * Content Index
 *
 * This module provides the single source of truth for all UI copy in the CAP frontend.
 * It exports English and Spanish content, organized by page/feature concern.
 *
 * Usage:
 *
 *   import { getContent } from "@/content";
 *
 *   const content = getContent("en");
 *   console.log(content.howWeHelp.hero.title);
 *
 *   // Or access specific language:
 *   import { en, es } from "@/content";
 *   console.log(en.intakeLanding.heading);
 *
 * Content Principles:
 *
 * 1. All copy lives in these structured modules, not in components
 * 2. Components import content and render it; they don't define copy
 * 3. All copy is keyed and typed for maintainability and localization
 * 4. Add new content modules by extending the AllContent interface in types.ts
 * 5. Maintain English/Spanish parity by updating both language files together
 * 6. Flag uncertain copy with [CAP REVIEW] markers for human verification
 *
 */

import type { AllContent } from "./types";
import { en } from "./en";
import { es } from "./es";

/**
 * Content dictionary mapping language codes to content objects
 */
const contentByLanguage: Record<string, AllContent> = {
  en,
  es,
};

/**
 * Retrieves the content object for a given language.
 * Defaults to English if language is not found.
 *
 * @param language - Language code ("en" or "es")
 * @returns Content object for the specified language
 */
export function getContent(language: string | undefined): AllContent {
  return contentByLanguage[language || "en"] || en;
}

/**
 * Validates that a language is supported
 * @param language - Language code to check
 * @returns true if language is supported
 */
export function isSupportedLanguage(language: unknown): language is "en" | "es" {
  return language === "en" || language === "es";
}

// Export language-specific content for direct access if needed
export { en, es };

// Re-export types for consumers of this module
export type { AllContent } from "./types";
export type {
  NavigationContent,
  HowWeHelpContent,
  IntakeLandingContent,
  IntakeFormContent,
  SubmissionStateContent,
  LegalContent,
} from "./types";
