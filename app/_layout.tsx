import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/src/features/auth/AuthProvider';
import { colors } from '@/src/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" backgroundColor={colors.cream} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.cream },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="recommendation/[id]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="settings/index" options={{ animation: 'slide_from_right' }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
