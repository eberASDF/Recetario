import { useCallback, useRef, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { DoodleBurst, DoodleFoodAccent, DoodleSwirl } from '@/components/doodles';
import { ScreenShell } from '@/components/ScreenShell';
import { RecipePreview } from '@/features/recipes/RecipePreview';
import { useAccessState } from '@/hooks/useAccessState';
import { useOpenRecipe } from '@/hooks/useOpenRecipe';
import { useShakeDetection } from '@/hooks/useShakeDetection';
import { isRecipeLocked } from '@/services/accessRules';
import { discoveryService, repositories } from '@/services/container';
import { acknowledgeDiscovery } from '@/services/feedback';
import { colors as baseColors, useThemeColors, useThemeStyles, motion, spacing, typography } from '@/theme';
import type { Recipe } from '@/types';

type DiscoveryState = 'waiting' | 'detecting' | 'revealing' | 'result';
type Usage = Awaited<ReturnType<typeof discoveryService.getUsage>>;
const COOLDOWN_MS = 1800;
const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export default function RandomScreen() {
  const colors = useThemeColors();
  const styles = useThemeStyles(baseStyles);
  const [state, setState] = useState<DiscoveryState>('waiting');
  const [usage, setUsage] = useState<Usage | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { state: access } = useAccessState();
  const openRecipe = useOpenRecipe(access);
  const active = useRef(false);
  const runId = useRef(0);
  const inFlight = useRef(false);
  const cooldownUntil = useRef(0);

  useFocusEffect(useCallback(() => {
    let focused = true;
    active.current = true;
    runId.current += 1;
    setState('waiting');
    setRecipe(null);
    setUsage(null);
    setError(null);
    discoveryService.getUsage()
      .then((next) => { if (focused) setUsage(next); })
      .catch(() => { if (focused) setError('No pudimos revisar tus descubrimientos.'); });
    return () => { focused = false; active.current = false; runId.current += 1; };
  }, []));

  const triggerDiscovery = useCallback(async () => {
    if (!active.current || !usage || inFlight.current || Date.now() < cooldownUntil.current) return;
    const currentRun = runId.current;
    const previousRecipe = recipe;
    inFlight.current = true;
    cooldownUntil.current = Date.now() + COOLDOWN_MS;
    setError(null);
    setState('detecting');
    try {
      const [result] = await Promise.all([discoveryService.discover(), pause(motion.standard)]);
      if (result.status === 'ready') {
        if (active.current && runId.current === currentRun) {
          setRecipe(result.recipe);
          setUsage({ unlimited: result.remaining === null, remaining: result.remaining ?? usage.remaining });
          setState('revealing');
        }
        void repositories.user.getPreferences().then(acknowledgeDiscovery).catch(() => undefined);
        await pause(motion.reveal);
        if (active.current && runId.current === currentRun) setState('result');
      } else if (active.current && runId.current === currentRun) {
        setState(previousRecipe ? 'result' : 'waiting');
        if (result.status === 'limit') {
          setUsage((current) => current ? { ...current, remaining: 0 } : current);
        } else {
          setError('No hay recetas disponibles para descubrir ahora.');
        }
      }
    } catch {
      if (active.current && runId.current === currentRun) {
        setState(previousRecipe ? 'result' : 'waiting');
        setError('No pudimos descubrir una receta. Inténtalo de nuevo.');
      }
    } finally {
      inFlight.current = false;
    }
  }, [recipe, usage]);

  const limited = Boolean(usage && !usage.unlimited && usage.remaining === 0);
  useShakeDetection(Boolean(usage && !limited), triggerDiscovery);

  const remaining = usage && !usage.unlimited && !limited
    ? `${usage.remaining} ${usage.remaining === 1 ? 'descubrimiento disponible' : 'descubrimientos disponibles'}`
    : null;
  const showRecipe = recipe && (state === 'revealing' || state === 'result');

  return (
    <ScreenShell>
      {state === 'waiting' && (
        <View style={styles.waiting}>
          <View style={styles.shakeArt}>
            <View style={styles.artBurst}><DoodleBurst color={colors.deepGreen} size={74} rotation={-8} /></View>
            <View style={styles.artFood}><DoodleFoodAccent color={colors.accent} size={38} rotation={15} /></View>
            <View style={styles.artSwirl}><DoodleSwirl color={colors.accentSecondary} size={33} rotation={-18} /></View>
          </View>
          <Text style={styles.eyebrow}>DESCUBRIR</Text>
          <Text style={styles.introTitle}>La mejor idea puede llegar de sorpresa.</Text>
          <Text style={styles.instruction}>Agita el teléfono</Text>
          <Text style={styles.intro}>Sacude el teléfono para encontrar una receta.</Text>
          {remaining && <Text style={styles.remaining}>{remaining}</Text>}
          {limited && <Text style={styles.limitText}>Ya usaste tus descubrimientos gratuitos.</Text>}
          {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
          {limited && <View style={styles.waitingAction}><AppButton label="Ver suscripción" onPress={() => router.push('/suscripcion')} /></View>}
        </View>
      )}
      {state === 'detecting' && (
        <Animated.View entering={FadeIn.duration(motion.standard)} style={styles.detecting}>
          <View style={styles.detectingDoodle}><DoodleSwirl color={colors.accent} size={44} /></View>
          <Text style={styles.instruction}>Encontrando una receta…</Text>
        </Animated.View>
      )}
      {showRecipe && (
        <Animated.View entering={FadeInDown.duration(motion.reveal)} style={styles.result}>
          <RecipePreview recipe={recipe} featured locked={!access || isRecipeLocked(recipe.id, access)} onPress={() => openRecipe(recipe)} />
          {remaining && <Text style={styles.resultRemaining}>{remaining}</Text>}
          {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
          {limited ? <View style={styles.resultAction}><AppButton label="Ver suscripción" onPress={() => router.push('/suscripcion')} /></View>
            : state === 'result' && <Text style={styles.shakeAgain}>Agita el teléfono otra vez para descubrir otra receta</Text>}
        </Animated.View>
      )}
    </ScreenShell>
  );
}

const baseStyles = StyleSheet.create({
  waiting: { flex: 1, minHeight: 600, justifyContent: 'center', paddingBottom: spacing.xxl },
  shakeArt: { width: 160, height: 160, borderRadius: 80, backgroundColor: baseColors.softPeach, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: spacing.xl },
  artBurst: { position: 'absolute', left: 43, top: 38 },
  artFood: { position: 'absolute', right: -9, top: 15 },
  artSwirl: { position: 'absolute', left: -18, bottom: 16 },
  detectingDoodle: { alignSelf: 'center', marginBottom: spacing.lg },
  eyebrow: { ...typography.caption, color: baseColors.accent, textAlign: 'center', marginBottom: spacing.sm },
  introTitle: { ...typography.title, color: baseColors.textPrimary, textAlign: 'center', marginBottom: spacing.xl },
  instruction: { ...typography.heading, color: baseColors.textPrimary, textAlign: 'center' },
  intro: { ...typography.body, color: baseColors.textSecondary, textAlign: 'center', marginTop: spacing.md },
  remaining: { ...typography.bodySmall, color: baseColors.textMuted, textAlign: 'center', marginTop: spacing.lg },
  limitText: { ...typography.bodySmall, color: baseColors.textSecondary, textAlign: 'center', marginTop: spacing.lg },
  waitingAction: { marginTop: spacing.lg, alignSelf: 'stretch' },
  detecting: { flex: 1, minHeight: 450, justifyContent: 'center' },
  result: { marginTop: spacing.xl },
  resultRemaining: { ...typography.bodySmall, color: baseColors.textMuted, textAlign: 'center', marginTop: spacing.md },
  shakeAgain: { ...typography.bodySmall, color: baseColors.textSecondary, textAlign: 'center', marginTop: spacing.lg },
  resultAction: { marginTop: spacing.lg },
  error: { ...typography.bodySmall, color: baseColors.error, textAlign: 'center', marginTop: spacing.md },
});
