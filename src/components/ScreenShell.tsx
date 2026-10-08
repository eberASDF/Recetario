import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors as baseColors, useThemeStyles, layout, spacing } from '@/theme';

export function ScreenShell({ children }: PropsWithChildren) {
  const styles = useThemeStyles(baseStyles);
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: baseColors.background },
  scroll: { flexGrow: 1, alignItems: 'center' },
  content: { width: '100%', maxWidth: layout.maxWidth, flexGrow: 1, paddingHorizontal: layout.gutter, paddingTop: spacing.lg, paddingBottom: spacing.xxxl },
});
