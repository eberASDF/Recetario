import { Stack } from 'expo-router';
import { useEntry } from '@/features/auth/EntryContext';
import { useThemeColors } from '@/theme';

export default function AuthLayout() {
  const colors = useThemeColors();
  const { mode, hasAuthenticatedSession } = useEntry();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: 'fade_from_bottom' }}>
      <Stack.Protected guard={mode === 'welcome'}>
        <Stack.Screen name="welcome" />
      </Stack.Protected>
      <Stack.Protected guard={(mode === 'welcome' && !hasAuthenticatedSession) || mode === 'verify'}>
        <Stack.Screen name="login" />
      </Stack.Protected>
      <Stack.Protected guard={mode === 'welcome' && !hasAuthenticatedSession}>
        <Stack.Screen name="register" />
      </Stack.Protected>
      <Stack.Protected guard={mode === 'verify'}>
        <Stack.Screen name="verify" />
      </Stack.Protected>
      <Stack.Protected guard={mode === 'biometric'}>
        <Stack.Screen name="biometric" />
      </Stack.Protected>
    </Stack>
  );
}
