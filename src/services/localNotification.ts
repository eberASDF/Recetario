// SDK 57: the package entry point initializes push registration, which throws in Android Expo Go.
import { isRunningInExpoGo } from 'expo';
import { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';
import { getPermissionsAsync, requestPermissionsAsync } from 'expo-notifications/build/NotificationPermissions';
import { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
import { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
import { setNotificationChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync';
import { Platform } from 'react-native';

const CHANNEL_ID = 'default';

export async function scheduleSavedRecipesNotification(): Promise<boolean> {
  // Expo Go SDK 57 omits the channel provider; its native fallback channel handles local notifications.
  if (Platform.OS === 'android' && !isRunningInExpoGo()) {
    await setNotificationChannelAsync(CHANNEL_ID, {
      name: 'default',
      importance: AndroidImportance.MAX,
      sound: 'default',
    });
  }

  const currentPermission = await getPermissionsAsync();
  const permission = currentPermission.granted
    ? currentPermission
    : await requestPermissionsAsync();

  if (!permission.granted) return false;

  setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  await scheduleNotificationAsync({
    content: {
      title: 'Recetas guardadas',
      body: 'Tus recetas guardadas te están esperando',
      sound: 'default',
    },
    trigger: null,
  });

  return true;
}
