import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { haptic, noise, trill } from '../../lib/feedback';

/** GRIS sounds: the referee's whistle and a disappointed crowd. */
export const sfx = {
  /** Yellow card: two short blasts. */
  whistle() {
    trill(2950, 0, 0.14, 0.09);
    trill(2950, 0.2, 0.26, 0.09);
    haptic(() => Haptics.impact({ style: ImpactStyle.Heavy }));
  },
  /** Red card: one long blast and the crowd goes "ohhh". */
  redCard() {
    trill(2950, 0, 0.75, 0.1);
    noise(0.15, 1.3, { freq: 520, q: 0.9, gain: 0.2, sweepTo: 230 });
    noise(0.15, 1.1, { freq: 1100, q: 1.2, gain: 0.08, sweepTo: 600 });
    haptic(() => Haptics.notification({ type: NotificationType.Error }));
  },
  /** Ball tap: a soft leather thump when opening a player. */
  thump() {
    noise(0, 0.08, { freq: 180, q: 0.8, gain: 0.25, type: 'lowpass' });
    haptic(() => Haptics.impact({ style: ImpactStyle.Light }));
  },
};
