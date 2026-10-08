import type { PropsWithChildren } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { motion, opacity } from '@/theme';

interface Props extends PropsWithChildren {
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
  role?: 'button' | 'tab';
  selected?: boolean;
}

export function MotionPressable({ children, onPress, accessibilityLabel, disabled = false, haptic = false, style, role = 'button', selected }: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <Animated.View style={[style, animatedStyle, disabled && { opacity: opacity.disabled }]}>
      <Pressable
        accessibilityRole={role}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled, selected }}
        disabled={disabled}
        onPressIn={() => { scale.set(withTiming(0.97, { duration: motion.quick })); }}
        onPressOut={() => { scale.set(withTiming(1, { duration: motion.standard, easing: motion.easing })); }}
        onPress={() => {
          if (haptic) void Haptics.selectionAsync().catch(() => undefined);
          onPress();
        }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
