import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import type { IntakeStackParamList } from '@/navigation/types';
import { colors, layout, spacing } from '@/theme';

const beforeYouBeginItems = [
  'Your contact information',
  'Your address',
  'Basic information about your situation',
  'Documents that may help our team understand your case',
];

const keyPoints = [
  'CAP is free.',
  'We do not directly pay medical bills.',
  'Submitting this form does not guarantee that CAP can take your case.',
  'A CAP team member will follow up with you.',
];

export function IntakeLandingScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<IntakeStackParamList>>();

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="title">
          Need Help with a Health Care Bill or Insurance Issue?
        </AppText>
        <AppText variant="body" color={colors.semantic.muted}>
          CAP provides free assistance to Colorado consumers.
        </AppText>

        <View style={styles.section}>
          <AppText variant="heading">Before You Begin</AppText>
          <AppText variant="body" color={colors.semantic.muted}>
            You'll be asked for:
          </AppText>
          {beforeYouBeginItems.map((item) => (
            <View key={item} style={styles.row}>
              <View style={styles.bullet} />
              <AppText variant="body" style={styles.rowText}>
                {item}
              </AppText>
            </View>
          ))}
        </View>

        <AppText variant="caption" color={colors.semantic.muted}>
          The form should take approximately 10-15 minutes.
        </AppText>

        <View style={styles.section}>
          <AppText variant="heading">Good to Know</AppText>
          {keyPoints.map((point) => (
            <View key={point} style={styles.row}>
              <View style={styles.bullet} />
              <AppText variant="body" style={styles.rowText}>
                {point}
              </AppText>
            </View>
          ))}
        </View>

        <AppText variant="caption" color={colors.semantic.muted}>
          Your information is used to help our team respond to your request.
        </AppText>

        <View style={styles.cta}>
          <Button
            label="Start a New Request"
            onPress={() => navigation.navigate('Intake')}
          />
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
  section: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.cap.primary,
    marginTop: 8,
  },
  rowText: {
    flex: 1,
  },
  cta: {
    marginTop: spacing.sm,
  },
});