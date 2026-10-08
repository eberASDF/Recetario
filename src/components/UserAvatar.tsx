import { Image } from 'expo-image';
import { User } from '@doodle-icons/react-native';
import { StyleSheet, Text, View } from 'react-native';
import { MotionPressable } from '@/components/MotionPressable';
import { useThemeColors, typography } from '@/theme';

export interface UserAvatarProps {
  photoUri?: string | null;
  username?: string;
  size?: number;
  onPress?: () => void;
  accessibilityLabel?: string;
}

export function UserAvatar({ photoUri, username, size = 44, onPress, accessibilityLabel }: UserAvatarProps) {
  const colors = useThemeColors();
  const initial = username?.trim().charAt(0).toLocaleUpperCase();
  const content = (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.surfaceSecondary }]}>
      {photoUri ? <Image source={{ uri: photoUri }} contentFit="cover" accessibilityLabel={username ? `Foto de ${username}` : 'Foto de perfil'} style={styles.photo} />
        : initial ? <Text style={[styles.initial, { color: colors.deepGreen, fontSize: size * 0.43, lineHeight: size * 0.54 }]}>{initial}</Text>
          : <User color={colors.deepGreen} size={size * 0.52} />}
    </View>
  );
  return onPress ? <MotionPressable onPress={onPress} accessibilityLabel={accessibilityLabel ?? 'Abrir perfil'} haptic>{content}</MotionPressable> : content;
}

const styles = StyleSheet.create({
  circle: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  photo: { width: '100%', height: '100%' },
  initial: { ...typography.display, textAlign: 'center' },
});
