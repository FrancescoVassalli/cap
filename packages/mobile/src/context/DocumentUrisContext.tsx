/**
 * Transient local-file-URI registry.
 *
 * When the user selects documents, the native picker returns a local temp file
 * URI that is needed only to read the bytes during upload. It is PHI-adjacent
 * (a path to a sensitive file) but not the content itself, and it is never
 * logged, persisted, or sent in a URL. It lives in React state only for the
 * duration of the session, keyed by the document's id (the same id the submit
 * flow uses). Keeping it out of `IntakeDocument` keeps the shared domain type
 * metadata-only and platform-neutral.
 */

import React, { createContext, useContext, useMemo, useState } from 'react'

type DocumentUrisContextValue = {
  /** Registers the local file URI for a selected document id. */
  register: (id: string, uri: string) => void
  /** Removes the local file URI when a document is removed. */
  unregister: (id: string) => void
  /** Resolves the current local file URI for a document id, if any. */
  resolve: (id: string) => string | undefined
}

const DocumentUrisContext = createContext<DocumentUrisContextValue | null>(null)

export function DocumentUrisProvider({ children }: { children: React.ReactNode }) {
  const [uris, setUris] = useState<Record<string, string>>({})

  const value = useMemo<DocumentUrisContextValue>(
    () => ({
      register: (id, uri) =>
        setUris((prev) => ({ ...prev, [id]: uri })),
      unregister: (id) =>
        setUris((prev) => {
          if (!(id in prev)) return prev
          const next = { ...prev }
          delete next[id]
          return next
        }),
      resolve: (id) => uris[id],
    }),
    [uris],
  )

  return <DocumentUrisContext.Provider value={value}>{children}</DocumentUrisContext.Provider>
}

export function useDocumentUris(): DocumentUrisContextValue {
  const value = useContext(DocumentUrisContext)
  if (!value) {
    throw new Error('useDocumentUris must be used within a DocumentUrisProvider')
  }
  return value
}
