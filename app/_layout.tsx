import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from '../context/AppContext';
import { Colors, ThemeContext, useColors } from '../constants/theme';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { initCrashReporting } from '../utils/crashReporting';
import { ToastProvider } from '../context/ToastContext';
import ToastNotification from '../components/ToastNotification';
import GamificationWatcher from '../components/GamificationWatcher';
import { getToday, getISOWeekString } from '../utils/dateUtils';

initCrashReporting();

function RootNavigator() {
  const { isLoading, preferences } = useApp();
  const colors = useColors();
  const router = useRouter();
  const segments = useSegments();
  const recapShownRef = useRef(false);

  useEffect(() => {
    if (isLoading) return;

    const onboardingComplete = preferences.onboardingComplete === true;
    const inApp = segments[0] === '(tabs)' || segments[0] === 'add-food-modal' || segments[0] === 'create-meal-modal' || segments[0] === 'app-settings-modal' || segments[0] === 'appearance-modal' || segments[0] === 'nutrition-goals-modal' || segments[0] === 'weekly-recap-modal';

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

  // Auto-show weekly recap on Monday if not yet shown this week
  useEffect(() => {
    if (isLoading) return;
    if (!preferences.onboardingComplete) return;
    if (recapShownRef.current) return;
    // Only trigger when the user is on a tabs screen
    if (segments[0] !== '(tabs)') return;

    const today = getToday();
    const [yearStr, monthStr, dayStr] = today.split('-');
    const date = new Date(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr));
    const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday

    if (dayOfWeek === 1) {
      const currentWeek = getISOWeekString(today);
      if (preferences.lastRecapShownWeek !== currentWeek) {
        recapShownRef.current = true;
        router.push('/weekly-recap-modal');
      }
    }
  }, [isLoading, preferences.onboardingComplete, preferences.lastRecapShownWeek, segments]);

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
      <Stack.Screen
        name="weekly-recap-modal"
        options={{
          presentation: 'fullScreenModal',
          headerShown: false,
        }}
      />
    </Stack>
  );
}

function ThemeColorSync({ children }: { children: React.ReactNode }) {
  const { preferences } = useApp();
  const systemScheme = useColorScheme();
  const appearanceMode = preferences.appearanceMode ?? 'system';
  const resolvedScheme =
    appearanceMode === 'light' ? 'light' :
    appearanceMode === 'dark' ? 'dark' :
    (systemScheme ?? 'light');
  const statusBarStyle = resolvedScheme === 'dark' ? 'light' : 'dark';
  return (
    <ThemeContext.Provider value={{ accentColor: preferences.themeColor ?? null, appearanceMode }}>
      <StatusBar style={statusBarStyle} />
      {children}
    </ThemeContext.Provider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <AppProvider>
            <ToastProvider>
              <ThemeColorSync>
                <GamificationWatcher />
                <RootNavigator />
                <ToastNotification />
              </ThemeColorSync>
            </ToastProvider>
          </AppProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
