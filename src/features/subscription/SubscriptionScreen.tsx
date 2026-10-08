import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { ArrowLeft, Crown, Tick } from '@doodle-icons/react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppState, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { IconButton } from '@/components/IconButton';
import { ScreenShell } from '@/components/ScreenShell';
import { DoodleStar } from '@/components/doodles';
import { useEntry } from '@/features/auth/EntryContext';
import { subscriptionService } from '@/services/container';
import { openStripeTestCheckout, stripeTestCheckoutEnabled } from '@/services/StripeCheckoutService';
import { colors as baseColors, useThemeColors, useThemeStyles, iconSizes, layout, motion, spacing, typography } from '@/theme';
import type { SubscriptionState } from '@/types';

const benefits = [
  'Explora el catálogo completo.',
  'Abre ingredientes y pasos de cada receta.',
  'Cocina sin límite de recetas.',
];

export default function SubscriptionScreen() {
  const { isAuthenticated } = useEntry();
  const colors = useThemeColors();
  const styles = useThemeStyles(baseStyles);
  const [message, setMessage] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [checkoutBusy, setCheckoutBusy] = useState(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    setSubscribed(null);
    if (!isAuthenticated) {
      setSubscribed(false);
      return () => { active = false; };
    }

    const update = (subscription: SubscriptionState) => {
      if (!active) return;
      const isSubscribed = subscription.tier === 'subscribed' && subscription.isActive;
      setSubscribed(isSubscribed);
      if (isSubscribed) setMessage(null);
    };
    const onError = () => { if (active) setMessage('No pudimos consultar tu suscripción.'); };
    const unsubscribe = subscriptionService.subscribe(update, onError);
    const foreground = AppState.addEventListener('change', (next) => {
      if (next !== 'active') return;
      subscriptionService.getState()
        .then((state) => update(state.subscription))
        .catch(onError);
    });
    return () => {
      active = false;
      unsubscribe();
      foreground.remove();
    };
  }, [isAuthenticated]));

  const startCheckout = async () => {
    if (checkoutBusy) return;
    setCheckoutBusy(true);
    setMessage(null);
    try {
      await openStripeTestCheckout();
      setMessage('Si completaste el pago, tu acceso se actualizará automáticamente cuando Stripe lo confirme.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo abrir el pago de prueba.');
    } finally {
      setCheckoutBusy(false);
    }
  };

  return (
    <ScreenShell>
      <IconButton icon={<ArrowLeft color={colors.textPrimary} size={iconSizes.lg} />} label="Volver" onPress={() => router.back()} />
      <Animated.View entering={FadeInDown.duration(motion.reveal)}>
        <Text style={styles.eyebrow}>UN PASE PARA TODA LA MESA</Text>
        <Text style={styles.title}>Más recetas. Más momentos.</Text>
        <Text style={styles.intro}>Una suscripción activa abre todos los sabores del catálogo.</Text>
        <View style={styles.art}>
          <View style={styles.artCircle}><View style={styles.artCircleInner} /></View>
          <Crown color={colors.deepGreen} size={iconSizes.xl} strokeWidth={1.2} style={styles.crown} />
          <View style={styles.sparkle}><DoodleStar color={colors.accent} size={iconSizes.xl} rotation={-10} /></View>
          <Text style={styles.artWord}>todo</Text>
        </View>
        <Text style={styles.sectionLabel}>LO QUE SE ABRE</Text>
        {benefits.map((benefit, index) => (
          <View key={benefit} style={styles.benefit}>
            <Text style={styles.number}>{String(index + 1).padStart(2, '0')}</Text>
            <Text style={styles.benefitText}>{benefit}</Text>
            <Tick color={colors.success} size={iconSizes.md} />
          </View>
        ))}
        <View style={styles.actions}>
          {subscribed === true
            ? <Text style={styles.activeStatus}>Suscripción activa</Text>
            : subscribed === false && (stripeTestCheckoutEnabled && isAuthenticated
              ? <AppButton label="Suscribirte" onPress={startCheckout} loading={checkoutBusy} />
              : <Text style={styles.pendingStatus}>{isAuthenticated ? 'Las suscripciones estarán disponibles próximamente.' : 'Inicia sesión para suscribirte.'}</Text>)}
          {stripeTestCheckoutEnabled && isAuthenticated && subscribed !== true && <Text style={styles.pendingStatus}>Checkout de prueba: no se cobrará dinero real.</Text>}
          {message && subscribed !== true && <Animated.Text entering={FadeInDown.duration(motion.standard)} accessibilityRole="alert" style={styles.message}>{message}</Animated.Text>}
          <AppButton label="Seguir explorando" onPress={() => router.back()} variant="quiet" />
        </View>
      </Animated.View>
    </ScreenShell>
  );
}

const baseStyles = StyleSheet.create({
  eyebrow: { ...typography.caption, color: baseColors.accent, marginTop: spacing.xxl, marginBottom: spacing.sm },
  title: { ...typography.display, color: baseColors.textPrimary, maxWidth: 500 },
  intro: { ...typography.body, color: baseColors.textSecondary, marginTop: spacing.md, maxWidth: 420 },
  art: { height: 220, marginHorizontal: -layout.gutter, marginTop: spacing.xxl, backgroundColor: baseColors.softPeach, overflow: 'hidden', justifyContent: 'center' },
  artCircle: { position: 'absolute', width: 230, height: 230, borderRadius: 115, borderWidth: 20, borderColor: '#F4B89E', right: -30, top: -35 },
  artCircleInner: { position: 'absolute', width: 115, height: 115, borderRadius: 60, backgroundColor: '#F6C8AE', top: 37, left: 37 },
  crown: { position: 'absolute', left: spacing.xl, top: spacing.xl },
  sparkle: { position: 'absolute', right: spacing.xxl, bottom: spacing.lg },
  artWord: { ...typography.display, fontSize: 73, lineHeight: 78, color: baseColors.deepGreen, marginLeft: spacing.xl, marginTop: spacing.xl },
  sectionLabel: { ...typography.caption, color: baseColors.accent, marginTop: spacing.xxl, marginBottom: spacing.sm },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderTopWidth: 1, borderTopColor: baseColors.border, paddingVertical: spacing.lg },
  number: { ...typography.caption, color: baseColors.textMuted },
  benefitText: { ...typography.body, color: baseColors.textPrimary, flex: 1 },
  actions: { gap: spacing.sm, marginTop: spacing.xl },
  message: { ...typography.bodySmall, color: baseColors.textSecondary, textAlign: 'center', paddingVertical: spacing.sm },
  activeStatus: { ...typography.body, color: baseColors.success, textAlign: 'center', fontWeight: '700' },
  pendingStatus: { ...typography.bodySmall, color: baseColors.textSecondary, textAlign: 'center' },
});
