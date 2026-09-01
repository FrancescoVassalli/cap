import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Screen } from '@/components/Screen';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import type { RootTabParamList } from '@/navigation/types';
import { colors, layout, spacing } from '@/theme';

const services = [
  {
    title: 'Insurance Claim Denials',
    description: 'We help you understand and appeal denied insurance claims.',
  },
  {
    title: 'Medical Bills',
    description: 'Assistance navigating medical bills and billing issues.',
  },
  {
    title: 'Coverage and Access Issues',
    description:
      'Help understanding your insurance coverage and accessing needed care.',
  },
  {
    title: 'Prescription Costs',
    description: 'Support with prescription medication costs and access.',
  },
];

export function HomeScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();

  return (
    <Screen>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <AppText variant="display" color={colors.cap.primary}>
            Get Free Help with Health Care Bills and Insurance
          </AppText>
          <AppText variant="body" color={colors.semantic.muted}>
            The Consumer Assistance Program helps Colorado consumers navigate
            health insurance, medical bills, claims, and access to care.
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="heading">What We Help With</AppText>
          {services.map((service) => (
            <View key={service.title} style={styles.card}>
              <AppText variant="heading" color={colors.semantic.text}>
                {service.title}
              </AppText>
              <AppText variant="body" color={colors.semantic.muted}>
                {service.description}
              </AppText>
            </View>
          ))}
        </View>

        <View style={styles.cta}>
          <Button
            label="Get Help"
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
    gap: spacing.lg,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
  },
  hero: {
    gap: spacing.md,
  },
  section: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.semantic.surface,
    borderRadius: 8,
    padding: spacing.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.semantic.border,
  },
  cta: {
    gap: spacing.md,
  },
});