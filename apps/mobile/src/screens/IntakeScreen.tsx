import { ScrollView, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { AppText } from '@/components/AppText';
import { colors, layout, spacing } from '@/theme';

export function IntakeScreen() {
  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <AppText variant="heading">Your CAP Intake</AppText>
          <AppText variant="body" color={colors.semantic.muted}>
            The step-by-step intake flow will be built in a later phase. This
            route is where the language, personal info, address, contact,
            documents, review, and submit screens will live.
          </AppText>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: colors.semantic.surface,
    borderRadius: 8,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.semantic.border,
  },
});