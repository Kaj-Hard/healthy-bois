import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { haptic, noise, tone } from '../../lib/feedback';

/** Pétanque sounds: steel on steel, gravel underfoot. */
export const sfx = {
  /** One boule "clack" per point, then the last one settles in the gravel. */
  clack(points: number) {
    const n = Math.min(points, 6);
    for (let i = 0; i < n; i++) {
      const t = i * 0.12;
      // Inharmonic partials make it ring like metal rather than beep.
      tone(2380, t, 0.06, 'sine', 0.13);
      tone(3640, t, 0.045, 'sine', 0.07);
      tone(5310, t, 0.03, 'sine', 0.04);
      noise(t, 0.035, { freq: 4200, q: 2.5, gain: 0.07 });
    }
    noise(n * 0.12, 0.16, { freq: 900, q: 0.7, gain: 0.12, type: 'lowpass', sweepTo: 300 });
    haptic(() => Haptics.impact({ style: ImpactStyle.Heavy }));
  },
  /** Soft gravel crunch for picking up / undoing. */
  crunch() {
    noise(0, 0.2, { freq: 1400, q: 0.6, gain: 0.13, sweepTo: 450 });
    haptic(() => Haptics.impact({ style: ImpactStyle.Light }));
  },
};
