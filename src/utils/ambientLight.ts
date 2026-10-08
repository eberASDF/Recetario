export const DARK_ENTER_LUX = 10;
export const DARK_EXIT_LUX = 30;
export const LIGHT_STATE_CONFIRM_MS = 1500;

export type AmbientScheme = 'light' | 'dark';

export function createAmbientLightDetector(initial: AmbientScheme | null = null) {
  let current = initial;
  let candidate: AmbientScheme | null = null;
  let candidateSince = 0;

  return {
    sample(lux: number, now: number): AmbientScheme | null {
      if (!Number.isFinite(lux) || lux < 0 || !Number.isFinite(now)) return null;
      const next: AmbientScheme | null = lux <= DARK_ENTER_LUX ? 'dark' : lux >= DARK_EXIT_LUX ? 'light' : null;
      if (!next || next === current) {
        candidate = null;
        return null;
      }
      if (candidate !== next || now < candidateSince) {
        candidate = next;
        candidateSince = now;
        return null;
      }
      if (now - candidateSince < LIGHT_STATE_CONFIRM_MS) return null;
      current = next;
      candidate = null;
      return current;
    },
  };
}
