import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AuthProvider } from '@/data/auth';
import { queryClient } from '@/data/queryClient';
import { appFonts } from '@/theme/fonts';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(appFonts);
  const { theme } = useUnistyles();
  const ready = fontsLoaded || !!fontError;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style={theme.id === 'dark' ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: theme.colors.surface },
            }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="spot/[id]/index" />
            <Stack.Screen name="spot/[id]/log-catch" options={{ presentation: 'modal' }} />
            <Stack.Screen name="pin-spot" options={{ presentation: 'modal' }} />
            <Stack.Screen name="sign-in" options={{ presentation: 'modal' }} />
            <Stack.Screen name="boat/[id]" />
            <Stack.Screen name="chat/[id]" />
            <Stack.Screen name="terms" />
            <Stack.Screen name="privacy" />
          </Stack>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.surface },
}));
