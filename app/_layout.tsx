import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AppProvider, useApp } from '../context/AppContext';
import { Colors, ThemeContext, useColors } from '../constants/theme';
import ErrorBoundary from '../components/ErrorBoundary';

function RootNavigator() {
  const { isLoading, preferences } = useApp();
  const colors = useColors();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const onboardingComplete = preferences.onboardingComplete === true;
    const inApp = segments[0] === '(tabs)' || segments[0] === 'add-food-modal' || segments[0] === 'create-meal-modal' || segments[0] === 'app-settings-modal' || segments[0] === 'appearance-modal' || segments[0] === 'nutrition-goals-modal';

    if (onboardingComplete && !inApp) {
      const tab = preferences.defaultTab ?? 'nutrition';
      const route =
        tab === 'weight' ? '/(tabs)/' :
        tab === 'activity' ? '/(tabs)/activities' :
        '/(tabs)/nutrition';
      router.replace(route);
    } else if (!onboardingComplete && inApp) {
      router.replace('/welcome');
    }
  }, [isLoading, preferences.onboardingComplete, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="add-food-modal"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="create-meal-modal"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="app-settings-modal"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="appearance-modal"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="nutrition-goals-modal"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
    </Stack>
  );
}

function ThemeColorSync({ children }: { children: React.ReactNode }) {
  const { preferences } = useApp();
  return (
    <ThemeContext.Provider value={{ accentColor: preferences.themeColor ?? null, appearanceMode: preferences.appearanceMode ?? 'system' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <ThemeColorSync>
            <ErrorBoundary>
              <RootNavigator />
            </ErrorBoundary>
          </ThemeColorSync>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
