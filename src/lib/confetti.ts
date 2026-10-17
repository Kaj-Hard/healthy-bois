import confetti from 'canvas-confetti';

/*
 * One confetti instance on our own full-screen canvas, rendered on the main thread.
 * canvas-confetti's default instance draws in a Web Worker on an OffscreenCanvas; in the Android
 * WebView that worker can stall and then catch up, which showed up on a Pixel as frozen
 * confetti piling up in still frames before suddenly animating again.
 */
let fire: confetti.CreateTypes | undefined;

function instance(): confetti.CreateTypes {
  if (fire) return fire;
  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '80',
  });
  document.body.appendChild(canvas);
  fire = confetti.create(canvas, { resize: true, useWorker: false, disableForReducedMotion: true });
  return fire;
}

/** The big win celebration: one burst from the middle, then a short stream from both sides. */
export function celebrate(colors: string[]) {
  const shoot = instance();
  void shoot({ particleCount: 110, spread: 100, startVelocity: 48, origin: { y: 0.45 }, colors, scalar: 1.2 });
  const end = Date.now() + 1200;
  let frame = 0;
  (function stream() {
    // Every third frame is plenty and keeps the particle count (and the GPU) calm on mid-range phones.
    if (frame++ % 3 === 0) {
      void shoot({ particleCount: 6, angle: 60, spread: 65, startVelocity: 60, origin: { x: 0, y: 0.75 }, colors, scalar: 1.15 });
      void shoot({ particleCount: 6, angle: 120, spread: 65, startVelocity: 60, origin: { x: 1, y: 0.75 }, colors, scalar: 1.15 });
    }
    if (Date.now() < end) requestAnimationFrame(stream);
  })();
}

/** Small particle pop from a point on screen (scoring, favourites). */
export function pop(x: number, y: number, colors: string[], count = 28) {
  void instance()({
    particleCount: Math.min(count, 48),
    spread: 360,
    startVelocity: 22,
    gravity: 0.9,
    ticks: 70,
    scalar: 0.9,
    shapes: ['circle'],
    origin: { x: x / window.innerWidth, y: y / window.innerHeight },
    colors,
  });
}
