export const RUNNING_ENTER_RMS_G = 0.54;
export const RUNNING_EXIT_RMS_G = 0.36;
export const RUNNING_ENTER_MS = 720;
export const RUNNING_EXIT_MS = 900;

const GRAVITY_ALPHA = 0.82;
const RMS_WINDOW_MS = 320;
const MAX_SAMPLE_GAP_MS = 250;

interface AccelerationSample {
  x: number;
  y: number;
  z: number;
}

export function createShakeDetector() {
  let gravity: AccelerationSample | null = null;
  let samples: { time: number; squared: number }[] = [];
  let squaredSum = 0;
  let lastSampleAt: number | null = null;
  let enterSince: number | null = null;
  let exitSince: number | null = null;
  let running = false;

  return {
    sample(value: AccelerationSample, now: number): boolean {
      if (lastSampleAt !== null && (now <= lastSampleAt || now - lastSampleAt > MAX_SAMPLE_GAP_MS)) {
        samples = [];
        squaredSum = 0;
        enterSince = null;
        exitSince = null;
      }
      lastSampleAt = now;
      if (!gravity) {
        gravity = { ...value };
        return false;
      }

      gravity = {
        x: GRAVITY_ALPHA * gravity.x + (1 - GRAVITY_ALPHA) * value.x,
        y: GRAVITY_ALPHA * gravity.y + (1 - GRAVITY_ALPHA) * value.y,
        z: GRAVITY_ALPHA * gravity.z + (1 - GRAVITY_ALPHA) * value.z,
      };
      const dx = value.x - gravity.x;
      const dy = value.y - gravity.y;
      const dz = value.z - gravity.z;
      const magnitudeSquared = dx * dx + dy * dy + dz * dz;
      samples.push({ time: now, squared: magnitudeSquared });
      squaredSum += magnitudeSquared;
      while (samples.length && samples[0].time < now - RMS_WINDOW_MS) {
        squaredSum -= samples.shift()!.squared;
      }
      const rms = Math.sqrt(squaredSum / samples.length);

      if (!running) {
        if (rms < RUNNING_ENTER_RMS_G) {
          enterSince = null;
          return false;
        }
        if (enterSince === null) enterSince = now;
        if (now - enterSince < RUNNING_ENTER_MS) return false;
        running = true;
        enterSince = null;
        exitSince = null;
        return true;
      }

      if (rms > RUNNING_EXIT_RMS_G) {
        exitSince = null;
        return false;
      }
      if (exitSince === null) exitSince = now;
      if (now - exitSince >= RUNNING_EXIT_MS) {
        running = false;
        exitSince = null;
      }
      return false;
    },
  };
}
