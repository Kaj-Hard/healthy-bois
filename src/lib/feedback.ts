import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { useApp } from '../store/app';

/* Tiny synth so the app has juicy sounds without shipping audio files. */
let ctx: AudioContext | null = null;
function audio(): AudioContext | null {
  if (!useApp.getState().settings.sound) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.18) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + start;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function haptic(fn: () => Promise<void>) {
  if (!useApp.getState().settings.haptics) return;
  fn().catch(() => {});
}

export const fx = {
  tap() {
    tone(660, 0, 0.06, 'triangle', 0.08);
    haptic(() => Haptics.impact({ style: ImpactStyle.Light }));
  },
  select() {
    tone(880, 0, 0.08, 'triangle', 0.1);
    haptic(() => Haptics.impact({ style: ImpactStyle.Medium }));
  },
  score(points: number) {
    const notes = [523, 659, 784, 1047, 1319, 1568];
    for (let i = 0; i < Math.min(points, notes.length); i++) tone(notes[i], i * 0.07, 0.16, 'square', 0.07);
    haptic(() => Haptics.impact({ style: ImpactStyle.Heavy }));
  },
  undo() {
    tone(500, 0, 0.08, 'triangle', 0.1);
    tone(350, 0.08, 0.12, 'triangle', 0.1);
    haptic(() => Haptics.impact({ style: ImpactStyle.Light }));
  },
  coin() {
    for (let i = 0; i < 8; i++) tone(1400 + (i % 2) * 300, i * 0.09, 0.05, 'sine', 0.06);
    haptic(() => Haptics.impact({ style: ImpactStyle.Light }));
  },
  win() {
    const fanfare: [number, number, number][] = [
      [523, 0, 0.14], [659, 0.14, 0.14], [784, 0.28, 0.14], [1047, 0.42, 0.5],
      [784, 0.42, 0.5], [659, 0.42, 0.5],
    ];
    for (const [f, s, d] of fanfare) tone(f, s, d, 'square', 0.07);
    haptic(() => Haptics.notification({ type: NotificationType.Success }));
  },
  /** Taking a letter / a hit: a low "bonk". */
  stamp() {
    tone(220, 0, 0.12, 'square', 0.09);
    tone(165, 0.06, 0.18, 'triangle', 0.12);
    haptic(() => Haptics.impact({ style: ImpactStyle.Heavy }));
  },
  /** Knocked out: a sad slide-whistle down. */
  knockout() {
    const a = audio();
    haptic(() => Haptics.notification({ type: NotificationType.Error }));
    if (!a) return;
    const t = a.currentTime;
    const osc = a.createOscillator();
    const g = a.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.7);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
    osc.connect(g).connect(a.destination);
    osc.start(t);
    osc.stop(t + 0.85);
  },
  /** Camera shutter: a quick click-clack. */
  shutter() {
    tone(2400, 0, 0.03, 'square', 0.06);
    tone(1200, 0.05, 0.04, 'square', 0.05);
    haptic(() => Haptics.impact({ style: ImpactStyle.Medium }));
  },
  error() {
    tone(200, 0, 0.15, 'sawtooth', 0.06);
    haptic(() => Haptics.notification({ type: NotificationType.Warning }));
  },
};
