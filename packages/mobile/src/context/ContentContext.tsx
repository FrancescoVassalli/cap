/**
 * Content context for the mobile app.
 *
 * Holds the current `Language` and exposes the resolved `MobileContent` so any
 * screen/component can render localized copy. The language is a user preference
 * that does not carry PHI and is safe to keep in React state / secure storage.
 */

import React, { createContext, useContext, useMemo, useState } from 'react'
import { createMobileContent, type MobileContent, type Language } from '../content'

type ContentContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  content: MobileContent
}

const ContentContext = createContext<ContentContextValue | undefined>(undefined)

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en')
  const content = useMemo(() => createMobileContent(language), [language])

  const value = useMemo(
    () => ({ language, setLanguage, content }),
    [language, content],
  )

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
}

export function getContent(): MobileContent {
  const context = useContext(ContentContext)
  if (!context) {
    throw new Error('getContent must be used within a ContentProvider')
  }
  return context.content
}

export function useLanguage(): ContentContextValue {
  const context = useContext(ContentContext)
  if (!context) {
    throw new Error('useLanguage must be used within a ContentProvider')
  }
  return context
}
