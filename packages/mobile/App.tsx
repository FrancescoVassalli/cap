/**
 * CAP mobile app entry.
 *
 * Wires the content + safe-area providers and the root stack navigator.
 */

import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { ContentProvider } from './src/context/ContentContext'
import { HomeScreen } from './src/screens/HomeScreen'
import { IntakeLandingScreen } from './src/screens/IntakeLandingScreen'
import { IntakeScreen } from './src/screens/IntakeScreen'
import type { RootStackParamList } from './src/navigation/types'
import { theme } from './src/theme'

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function App() {
  return (
    <SafeAreaProvider>
      <ContentProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerStyle: { backgroundColor: theme.colors.capPrimary },
              headerTintColor: '#ffffff',
              headerTitleStyle: { fontWeight: '700' },
              contentStyle: { backgroundColor: theme.colors.background },
            }}
          >
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: 'CAP' }}
            />
            <Stack.Screen
              name="IntakeLanding"
              component={IntakeLandingScreen}
              options={{ title: 'Get Help' }}
            />
            <Stack.Screen
              name="Intake"
              component={IntakeScreen}
              options={{ title: 'New Request' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </ContentProvider>
    </SafeAreaProvider>
  )
}
