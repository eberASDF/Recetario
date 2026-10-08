import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { Bookmark } from '@doodle-icons/react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors as baseColors, iconSizes, spacing, typography, useThemeColors, useThemeStyles } from '@/theme';

interface Props {
  visible: boolean;
  onSignIn: () => void;
  onCancel: () => void;
}

export function SignInToSavePrompt({ visible, onSignIn, onCancel }: Props) {
  const colors = useThemeColors();
  const styles = useThemeStyles(baseStyles);
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} accessibilityLabel="Cancelar" onPress={onCancel} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]} accessibilityViewIsModal>
          <Bookmark color={colors.accent} size={iconSizes.xl} />
          <Text style={styles.title}>Inicia sesión para guardar recetas</Text>
          <Text style={styles.description}>Crea una cuenta o inicia sesión para conservar tus recetas favoritas.</Text>
          <View style={styles.actions}>
            <AppButton label="Iniciar sesión" onPress={onSignIn} />
            <AppButton label="Cancelar" onPress={onCancel} variant="quiet" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const baseStyles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: baseColors.overlay },
  sheet: { backgroundColor: baseColors.surface, paddingHorizontal: spacing.xl, paddingTop: spacing.xl, borderTopLeftRadius: 22, borderTopRightRadius: 22, gap: spacing.sm },
  title: { ...typography.title, color: baseColors.textPrimary, marginTop: spacing.sm },
  description: { ...typography.body, color: baseColors.textSecondary },
  actions: { gap: spacing.xs, marginTop: spacing.lg },
});
