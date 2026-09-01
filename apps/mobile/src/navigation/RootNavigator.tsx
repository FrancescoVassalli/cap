import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '@/screens/HomeScreen';
import { IntakeLandingScreen } from '@/screens/IntakeLandingScreen';
import { IntakeScreen } from '@/screens/IntakeScreen';
import { colors, fontFamily } from '@/theme';
import type { IntakeStackParamList, RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();
const IntakeStack = createNativeStackNavigator<IntakeStackParamList>();

const tabScreenOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.cap.primary,
  tabBarInactiveTintColor: colors.semantic.muted,
  tabBarStyle: {
    backgroundColor: colors.semantic.surface,
    borderTopColor: colors.semantic.border,
  },
  tabBarLabelStyle: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
  },
} as const;

const intakeStackScreenOptions = {
  headerStyle: {
    backgroundColor: colors.cap.primary,
  },
  headerTintColor: colors.semantic.onPrimary,
  headerTitleStyle: {
    fontFamily: fontFamily.semibold,
  },
  headerTitleAlign: 'center',
  headerStatusBarStyle: 'light',
} as const;

export function RootNavigator() {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="Intake"
        component={IntakeStackNavigator}
        options={{ title: 'Intake' }}
      />
    </Tab.Navigator>
  );
}

function IntakeStackNavigator() {
  return (
    <IntakeStack.Navigator screenOptions={intakeStackScreenOptions}>
      <IntakeStack.Screen
        name="IntakeLanding"
        component={IntakeLandingScreen}
        options={{ title: 'Intake' }}
      />
      <IntakeStack.Screen
        name="Intake"
        component={IntakeScreen}
        options={{ title: 'Start Your Appeal' }}
      />
    </IntakeStack.Navigator>
  );
}