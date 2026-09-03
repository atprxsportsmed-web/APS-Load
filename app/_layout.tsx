import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Modal } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { setBaseUrl } from '@/lib/api-client';
import { AssessmentProvider } from '@/context/AssessmentContext';
import { HistoryProvider } from '@/context/HistoryContext';
import { SubscriptionProvider } from '@/context/SubscriptionContext';
import OnboardingFlow from '@/components/OnboardingFlow';

const ONBOARDING_KEY = '@atprx/onboarding_v1';

// Configure API client base URL from env.
//
// Standalone web build: point this at the deployed API server. Prefer
// EXPO_PUBLIC_API_URL (a full origin, e.g. https://api.example.com); the
// bare-domain EXPO_PUBLIC_DOMAIN form is kept for parity with the monorepo
// build. Both are inlined by Metro at build time, so they must be read as
// literal `process.env.X` member expressions.
const apiUrl = process.env.EXPO_PUBLIC_API_URL;
const apiDomain = process.env.EXPO_PUBLIC_DOMAIN;
if (apiUrl) {
  setBaseUrl(apiUrl);
} else if (apiDomain) {
  setBaseUrl(`https://${apiDomain}`);
}

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

/**
 * Shows the one-time onboarding flow as a full-screen modal on first launch,
 * so the app structure behind it is fully mounted (nav stack, contexts, etc.)
 * and ready when the user dismisses it. Open-access build: no login, no
 * paywall — onboarding is the only gate.
 */
function OnboardingOverlay() {
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then(val => {
      setOnboardingDone(val === 'done');
    });
  }, []);

  const handleOnboardingComplete = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'done');
    setOnboardingDone(true);
  };

  if (onboardingDone === null || onboardingDone) return null;

  return (
    <Modal visible animationType="slide" statusBarTranslucent>
      <OnboardingFlow onComplete={handleOnboardingComplete} />
    </Modal>
  );
}


function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="assessment" options={{ headerShown: false }} />
      <Stack.Screen name="follow-up" options={{ headerShown: false }} />
      <Stack.Screen name="assessment-detail" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <HistoryProvider>
            <AssessmentProvider>
              <SubscriptionProvider>
                <GestureHandlerRootView>
                  <KeyboardProvider>
                    <RootLayoutNav />
                    <OnboardingOverlay />
                  </KeyboardProvider>
                </GestureHandlerRootView>
              </SubscriptionProvider>
            </AssessmentProvider>
          </HistoryProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
