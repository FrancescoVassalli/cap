/**
 * Documents intake step.
 *
 * Uses the native document picker to select files, validates them with the
 * shared rules, and shows per-file Remove. Documents are stored as metadata in
 * form state only (never persisted or logged). Uploading happens after review
 * via the service adapter.
 */

import React, { useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useFormikContext } from 'formik'
import type { IntakeFormValues } from '@cap/shared'
import { validateDocumentCandidates } from '@cap/shared'
import { StepBody } from '../StepBody'
import { Button } from '../Button'
import { getContent } from '../../context/ContentContext'
import { useDocumentUris } from '../../context/DocumentUrisContext'
import { pickDocuments } from '../../services/documentPicker'
import { theme } from '../../theme'

export function DocumentsStep() {
  const content = getContent()
  const doc = content.intakeForm.documents
  const [errorsList, setErrorsList] = useState<string[]>([])
  const { values, setFieldValue } = useFormikContext<IntakeFormValues>()
  const { register, unregister } = useDocumentUris()

  const handleChooseFiles = async () => {
    setErrorsList([])
    const picked = await pickDocuments()
    if (picked.length === 0) return

    const candidates = picked.map((p) => ({ name: p.name, size: p.size, type: p.type }))
    const result = validateDocumentCandidates(candidates, values.documents, content.intakeForm.errors)
    setErrorsList(result.errors)
    if (result.accepted.length > 0) {
      const acceptedDocs = result.accepted.map((a) => {
        const source = picked.find((p) => p.name === a.name && p.size === a.size)
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        // Keep the transient local file uri out of the shared metadata type;
        // register it here so the upload adapter can access the bytes later.
        if (source?.uri) register(id, source.uri)
        return { id, name: a.name, size: a.size, type: a.type }
      })
      await setFieldValue('documents', [...values.documents, ...acceptedDocs])
    }
  }

  const removeDocument = async (id: string) => {
    unregister(id)
    await setFieldValue(
      'documents',
      values.documents.filter((doc) => doc.id !== id),
    )
  }

  return (
    <StepBody>
      <Text style={styles.heading}>{doc.heading}</Text>
      <Text style={styles.body}>{doc.description}</Text>

      <Text style={styles.examplesHeading}>{doc.examplesHeading}</Text>
      {doc.exampleItems.map((item, index) => (
        <View key={index} style={styles.listRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.body}>{item}</Text>
        </View>
      ))}

      <View style={styles.warnBox}>
        <Text style={styles.warnText}>{doc.maxFileSizeWarning}</Text>
        <Text style={styles.warnText}>{doc.maxTotalSizeWarning}</Text>
        <Text style={styles.warnText}>{doc.allowedTypesDescription}</Text>
      </View>

      {errorsList.length > 0 ? (
        <View style={styles.errorBox} accessibilityRole="alert">
          <Text style={styles.errorHeading}>{content.intakeForm.errors.errorSummaryHeading}</Text>
          {errorsList.map((error, index) => (
            <Text key={index} style={styles.errorItem}>
              • {error}
            </Text>
          ))}
        </View>
      ) : null}

      <Button
        label={doc.chooseFiles}
        variant="secondary"
        onPress={handleChooseFiles}
        fullWidth={false}
      />

      {values.documents.length > 0 ? (
        <View style={styles.docList}>
          {values.documents.map((document) => (
            <View key={document.id} style={styles.docRow}>
              <View style={styles.docInfo}>
                <Text style={styles.docName} numberOfLines={1}>
                  {document.name}
                </Text>
                <Text style={styles.docMeta}>{formatBytes(document.size)}</Text>
              </View>
              <Pressable
                onPress={() => removeDocument(document.id)}
                accessibilityRole="button"
                accessibilityLabel={`${doc.remove} ${document.name}`}
                style={({ pressed }) => [styles.removeBtn, pressed && styles.removePressed]}
                hitSlop={8}
              >
                <Text style={styles.removeText}>{doc.remove}</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <Text style={styles.skipLabel}>{doc.skipLabel}</Text>
      <Button
        label={doc.skipButtonLabel}
        variant="ghost"
        onPress={() => {}}
        fullWidth={false}
        accessibilityHint="Provided for parity; continuing also allows skipping"
      />
    </StepBody>
  )
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${bytes} B`
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  body: {
    fontSize: 15,
    lineHeight: 21,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  examplesHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  listRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  bullet: {
    color: theme.colors.capPrimary,
    fontWeight: '700',
  },
  warnBox: {
    backgroundColor: theme.colors.capSecondary50,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  warnText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  errorBox: {
    backgroundColor: theme.colors.error,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  errorHeading: {
    color: '#ffffff',
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  errorItem: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
  },
  docList: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  docMeta: {
    fontSize: 13,
    color: theme.colors.muted,
  },
  removeBtn: {
    minHeight: theme.minTouch,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  removePressed: {
    opacity: 0.7,
  },
  removeText: {
    color: theme.colors.error,
    fontWeight: '600',
    fontSize: 15,
  },
  skipLabel: {
    fontSize: 14,
    color: theme.colors.muted,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
})
