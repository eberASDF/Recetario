import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '@/firebase/auth';
import { ThemeProvider, useTheme } from '@/theme';
import { EntryProvider, useEntry } from '@/features/auth/EntryContext';

function EntryNavigator() {
  const { colors } = useTheme();
  const { mode } = useEntry();
  const inAuthFlow = mode === 'welcome' || mode === 'verify' || mode === 'biometric';
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: 'fade_from_bottom' }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={inAuthFlow}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={mode === 'app'}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="perfil" />
        <Stack.Screen name="suscripcion" options={{ presentation: 'modal' }} />
        <Stack.Screen name="receta/[id]" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return <ThemeProvider><ThemedRoot /></ThemeProvider>;
}

function ThemedRoot() {
  const { colors, scheme } = useTheme();
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <EntryProvider><EntryNavigator /></EntryProvider>
    </GestureHandlerRootView>
  );
}
