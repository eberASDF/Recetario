import type { ComponentProps } from 'react';
import { Tabs } from 'expo-router';
import { Bookmark, Home, Search, Shuffle } from '@doodle-icons/react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { MotionPressable } from '@/components/MotionPressable';
import { colors as baseColors, useThemeColors, useThemeStyles, iconSizes, layout, motion, spacing, typography } from '@/theme';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const tabs = {
  index: { label: 'Inicio', Icon: Home },
  buscar: { label: 'Buscar', Icon: Search },
  agitar: { label: 'Descubrir', Icon: Shuffle },
  guardadas: { label: 'Guardadas', Icon: Bookmark },
};

function EditorialTabBar({ state, navigation }: TabBarProps) {
  const colors = useThemeColors();
  const styles = useThemeStyles(baseStyles);
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.xs) }]}>
      {state.routes.map((route, index) => {
        const item = tabs[route.name as keyof typeof tabs];
        if (!item) return null;
        const focused = state.index === index;
        const Icon = item.Icon;
        return (
          <MotionPressable
            key={route.key}
            style={styles.tab}
            role="tab"
            selected={focused}
            accessibilityLabel={`${item.label}, pestaña`}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
            }}
            haptic
          >
            <View style={styles.tabInner}>
              <View style={styles.indicatorSlot}>{focused && <Animated.View entering={FadeIn.duration(motion.standard)} style={styles.indicator} />}</View>
              <Icon size={iconSizes.md} color={focused ? colors.deepGreen : colors.textMuted} strokeWidth={focused ? 2.3 : 1.8} />
              <Text style={[styles.label, focused && styles.labelActive]}>{item.label}</Text>
            </View>
          </MotionPressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <EditorialTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="buscar" options={{ title: 'Buscar' }} />
      <Tabs.Screen name="agitar" options={{ title: 'Descubrir' }} />
      <Tabs.Screen name="guardadas" options={{ title: 'Guardadas' }} />
    </Tabs>
  );
}

const baseStyles = StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: baseColors.surface, borderTopWidth: 1, borderTopColor: baseColors.border, paddingHorizontal: spacing.xs, paddingTop: spacing.xs, minHeight: layout.minTouch + spacing.xxl },
  tab: { flex: 1 },
  tabInner: { minHeight: layout.minTouch + spacing.md, alignItems: 'center', justifyContent: 'center', gap: spacing.xxs },
  indicatorSlot: { height: spacing.xxs },
  indicator: { width: spacing.lg, height: spacing.xxs, borderRadius: spacing.xxs, backgroundColor: baseColors.accent },
  label: { ...typography.caption, color: baseColors.textMuted },
  labelActive: { color: baseColors.deepGreen },
});
