import { BodoniModa_500Medium, BodoniModa_600SemiBold } from '@expo-google-fonts/bodoni-moda';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { PinyonScript_400Regular } from '@expo-google-fonts/pinyon-script';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuth } from '@/state/auth';
import { colors } from '@/theme';

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export default function RootLayout() {
  const restore = useAuth((state) => state.restore);
  const ready = useAuth((state) => state.ready);

  const [fontsLoaded, fontError] = useFonts({
    BodoniModa_500Medium,
    BodoniModa_600SemiBold,
    PinyonScript_400Regular,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  useEffect(() => {
    void restore();
  }, [restore]);

  useEffect(() => {
    if ((fontsLoaded || fontError) && ready) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, ready]);

  // The display faces carry the whole brand, so it is worth holding the splash
  // rather than flashing a system serif for a frame.
  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.ivory },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="sign-in" options={{ animation: 'fade' }} />
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
