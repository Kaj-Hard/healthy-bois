import confetti from 'canvas-confetti';

export function celebrate(colors: string[]) {
  const end = Date.now() + 1400;
  const burst = (x: number, angle: number) =>
    confetti({ particleCount: 7, angle, spread: 70, startVelocity: 62, origin: { x, y: 0.75 }, colors, scalar: 1.2, disableForReducedMotion: true });
  confetti({ particleCount: 140, spread: 100, startVelocity: 48, origin: { y: 0.45 }, colors, scalar: 1.25, disableForReducedMotion: true });
  (function frame() {
    burst(0, 60);
    burst(1, 120);
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

export function pop(x: number, y: number, colors: string[], count = 28) {
  confetti({
    particleCount: count,
    spread: 360,
    startVelocity: 22,
    gravity: 0.9,
    ticks: 70,
    scalar: 0.9,
    shapes: ['circle'],
    origin: { x: x / window.innerWidth, y: y / window.innerHeight },
    colors,
    disableForReducedMotion: true,
  });
}
