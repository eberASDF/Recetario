import type { ReactNode } from 'react';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions, type ReturnKeyTypeOptions } from 'react-native';
import { Cross } from '@doodle-icons/react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { IconButton } from '@/components/IconButton';
import { colors as baseColors, useTheme, useThemeColors, useThemeStyles, iconSizes, layout, motion, radii, spacing, typography } from '@/theme';

const MAX_INPUT_LENGTH = 50;

interface Props {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  accessibilityLabel: string;
  label?: string;
  leading?: ReactNode;
  clearable?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: () => void;
}

export function AppTextField({ value, onChangeText, placeholder, accessibilityLabel, label, leading, clearable, secureTextEntry, keyboardType, returnKeyType, onSubmitEditing }: Props) {
  const { scheme } = useTheme();
  const colors = useThemeColors();
  const styles = useThemeStyles(baseStyles);
  const [focused, setFocused] = useState(false);
  const focus = useSharedValue(0);
  const outline = useAnimatedStyle(() => ({ borderColor: focus.get() > 0.5 ? colors.accent : colors.border }));
  const updateFocus = (next: boolean) => {
    setFocused(next);
    focus.set(withTiming(next ? 1 : 0, { duration: motion.standard }));
  };

  return (
    <View>
      {label && <Text style={styles.label}>{label}</Text>}
      <Animated.View style={[styles.field, outline, focused && styles.focused, focused && scheme === 'dark' && styles.darkFocused]}>
        {leading}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          maxLength={MAX_INPUT_LENGTH}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={accessibilityLabel}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => updateFocus(true)}
          onBlur={() => updateFocus(false)}
          style={styles.input}
        />
        {clearable && value.length > 0 && <IconButton icon={<Cross color={colors.textSecondary} size={iconSizes.sm} />} label="Borrar texto" onPress={() => onChangeText('')} />}
      </Animated.View>
    </View>
  );
}

const baseStyles = StyleSheet.create({
  label: { ...typography.label, color: baseColors.textSecondary, marginBottom: spacing.xs },
  field: { minHeight: layout.minTouch + spacing.md, paddingLeft: spacing.md, paddingRight: spacing.xs, borderRadius: radii.md, borderWidth: 1.5, backgroundColor: baseColors.surface, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  focused: { backgroundColor: baseColors.inkInverse },
  darkFocused: { backgroundColor: '#303B34' },
  input: { ...typography.body, color: baseColors.textPrimary, flex: 1, minHeight: layout.minTouch, paddingVertical: spacing.xs },
});
