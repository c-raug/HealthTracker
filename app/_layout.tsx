import { Stack } from 'expo-router';
import { AppProvider } from '../context/AppContext';
import { Colors } from '../constants/theme';

export default function RootLayout() {
  return (
    <AppProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.card },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="add-food-modal"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
      </Stack>
    </AppProvider>
  );
}
