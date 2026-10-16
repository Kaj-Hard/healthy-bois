import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { AvatarStack, Sheet, bouncy, spring, useOverlay } from '../components/ui';
import { getGame } from '../games/registry';
import { useT } from '../i18n';
import { fx } from '../lib/feedback';
import { savePhoto } from '../lib/photos';
import { useApp, usePlayersById } from '../store/app';

const W = 1080;
const H = 1440;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Sticker {
  title: string;
  subtitle: string;
  color: string;
  deep: string;
}

/** Crops the source to 3:4 and burns the winner sticker into the bottom of the photo. */
async function compose(source: CanvasImageSource, sw: number, sh: number, mirror: boolean, sticker: Sticker): Promise<string> {
  await document.fonts?.load('900 64px "Nunito Variable"').catch(() => undefined);
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const scale = Math.max(W / sw, H / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  ctx.save();
  if (mirror) {
    ctx.translate(W, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(source, (W - dw) / 2, (H - dh) / 2, dw, dh);
  ctx.restore();

  const grad = ctx.createLinearGradient(0, H - 420, 0, H);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, H - 420, W, 420);

  const font = '"Nunito Variable", Nunito, sans-serif';
  let size = 76;
  ctx.font = `900 ${size}px ${font}`;
  while (ctx.measureText(sticker.title).width > W - 200 && size > 40) {
    size -= 4;
    ctx.font = `900 ${size}px ${font}`;
  }
  const padX = 40;
  const pillW = ctx.measureText(sticker.title).width + padX * 2;
  const pillH = size + 44;
  const x = 60;
  const y = H - 110 - pillH - 30;
  const pill = (dy: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y + dy, pillW, pillH, 36);
    else ctx.rect(x, y + dy, pillW, pillH);
    ctx.fill();
  };
  ctx.save();
  ctx.translate(x + pillW / 2, y + pillH / 2);
  ctx.rotate(-0.04);
  ctx.translate(-(x + pillW / 2), -(y + pillH / 2));
  pill(12, sticker.deep);
  pill(0, sticker.color);
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle';
  ctx.fillText(sticker.title, x + padX, y + pillH / 2 + 2);
  ctx.restore();

  ctx.font = `800 40px ${font}`;
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(sticker.subtitle, x + 8, H - 70);

  ctx.font = `900 34px ${font}`;
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText('HEALTHY BOIS 💪', W - 50, 80);

  return canvas.toDataURL('image/jpeg', 0.85);
}

export function Photo({ matchId }: { matchId: string }) {
  const t = useT();
  const lang = useApp((s) => s.settings.lang);
  const match = useApp((s) => s.matches.find((m) => m.id === matchId));
  const replace = useApp((s) => s.replace);
  const setMatchPhoto = useApp((s) => s.setMatchPhoto);
  const playersById = usePlayersById();

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const [status, setStatus] = useState<'starting' | 'live' | 'error'>('starting');
  const [shot, setShot] = useState<string>();
  const [timer, setTimer] = useState(false);
  const [countdown, setCountdown] = useState<number>();
  const [flash, setFlash] = useState(0);
  const [skipOpen, setSkipOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Live camera while there's no shot to review.
  useEffect(() => {
    if (shot) return;
    let cancelled = false;
    let stream: MediaStream | undefined;
    setStatus('starting');
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1440 } },
          audio: false,
        });
        if (cancelled) return;
        const v = videoRef.current!;
        v.srcObject = stream;
        await v.play();
        if (!cancelled) setStatus('live');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((tr) => tr.stop());
    };
  }, [facing, shot]);

  if (!match?.winnerSideId) return null;
  const game = getGame(match.gameId);
  const v = game.theme.vars;
  const winners = match.sides.find((s) => s.id === match.winnerSideId)!.playerIds.map((id) => playersById.get(id));
  const names = winners.map((p) => p?.name).join(' & ');
  const sticker: Sticker = {
    title: `🏆 ${names}`,
    subtitle: `${t(game.name)} · ${new Date(match.finishedAt ?? Date.now()).toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' })}`,
    color: v['--primary'],
    deep: v['--primary-deep'],
  };

  const finish = () => replace({ name: 'winner', matchId });

  const snap = async () => {
    const video = videoRef.current;
    if (status !== 'live' || countdown !== undefined || !video) return;
    if (timer) {
      for (const n of [3, 2, 1]) {
        setCountdown(n);
        fx.tap();
        await sleep(850);
      }
      setCountdown(undefined);
    }
    fx.shutter();
    setFlash((f) => f + 1);
    setShot(await compose(video, video.videoWidth, video.videoHeight, facing === 'user', sticker));
  };

  const fromFile = (file: File | undefined) => {
    if (!file) return;
    const img = new Image();
    img.onload = async () => {
      fx.shutter();
      setShot(await compose(img, img.naturalWidth, img.naturalHeight, false, sticker));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  };

  const keep = async () => {
    if (!shot || saving) return;
    setSaving(true);
    try {
      setMatchPhoto(matchId, await savePhoto(matchId, shot));
      fx.select();
    } catch {
      fx.error();
      useOverlay.getState().show('⚠️ Photo could not be saved');
    }
    finish();
  };

  const retake = () => {
    fx.undo();
    setShot(undefined);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 'calc(var(--safe-top) + 14px) 16px calc(var(--safe-bottom) + 10px)', minHeight: 0 }}>
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <motion.h1
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={bouncy}
          className="page-title"
          style={{ fontSize: 30, color: 'var(--primary-deep)' }}
        >
          <motion.span style={{ display: 'inline-block' }} animate={{ rotate: [0, -14, 10, 0] }} transition={{ repeat: Infinity, duration: 2.2, repeatDelay: 1 }}>
            📸
          </motion.span>{' '}
          {t('photo.title')}
        </motion.h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6 }}>
          <AvatarStack players={winners} size={26} />
          <span style={{ fontWeight: 800, color: 'var(--ink-soft)', fontSize: 14 }}>{t('photo.subtitle')}</span>
        </div>
      </div>

      {/* viewfinder */}
      <div style={{ flex: 1, minHeight: 0, containerType: 'size', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          initial={{ scale: 0.85, opacity: 0, rotate: -3 }}
          animate={{ scale: 1, opacity: 1, rotate: shot ? -2 : 0 }}
          transition={spring}
          style={{
            position: 'relative',
            // Largest 3:4 box that fits the space left between header and controls.
            width: 'min(100cqw, 75cqh, 400px)',
            aspectRatio: '3 / 4',
            borderRadius: 28,
            overflow: 'hidden',
            background: '#1d1a26',
            border: `5px solid ${shot ? '#fff' : v['--primary']}`,
            boxShadow: `0 8px 0 ${shot ? 'rgba(0,0,0,.12)' : v['--primary-deep']}`,
          }}
        >
          <video
            ref={videoRef}
            playsInline
            muted
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: facing === 'user' ? 'scaleX(-1)' : undefined,
              display: shot ? 'none' : 'block',
            }}
          />
          {shot && <img src={shot} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}

          {!shot && status === 'live' && (
            <>
              {/* preview of the sticker that gets burned into the photo */}
              <div style={{ position: 'absolute', left: 14, right: 14, bottom: 14, pointerEvents: 'none' }}>
                <span
                  className="name"
                  style={{
                    display: 'inline-block',
                    maxWidth: '100%',
                    padding: '6px 14px',
                    borderRadius: 14,
                    background: v['--primary'],
                    color: '#fff',
                    fontSize: 18,
                    boxShadow: `0 4px 0 ${v['--primary-deep']}`,
                    transform: 'rotate(-2deg)',
                  }}
                >
                  {sticker.title}
                </span>
              </div>
              {[0, 1, 2, 3].map((c) => (
                <motion.span
                  key={c}
                  animate={{ opacity: [0.9, 0.4, 0.9] }}
                  transition={{ repeat: Infinity, duration: 1.6 }}
                  style={{
                    position: 'absolute',
                    width: 34,
                    height: 34,
                    [c < 2 ? 'top' : 'bottom']: c < 2 ? 14 : 64,
                    [c % 2 ? 'right' : 'left']: 14,
                    borderColor: '#fff',
                    borderStyle: 'solid',
                    borderWidth: 0,
                    [c < 2 ? 'borderTopWidth' : 'borderBottomWidth']: 5,
                    [c % 2 ? 'borderRightWidth' : 'borderLeftWidth']: 5,
                    borderRadius: 6,
                  }}
                />
              ))}
            </>
          )}

          {!shot && status === 'starting' && (
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
              <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.9 }} style={{ fontSize: 56 }}>
                📷
              </motion.span>
            </div>
          )}

          {!shot && status === 'error' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 20, textAlign: 'center', color: '#fff' }}>
              <span style={{ fontSize: 56 }}>📷</span>
              <p style={{ fontWeight: 800 }}>{t('photo.noCamera')}</p>
              <button className="btn accent" onClick={() => { fx.tap(); fileRef.current?.click(); }}>
                {t('photo.openCamera')}
              </button>
            </div>
          )}

          <AnimatePresence>
            {countdown !== undefined && (
              <motion.span
                key={countdown}
                initial={{ scale: 2.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.4, opacity: 0 }}
                transition={bouncy}
                style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 150, fontWeight: 900, color: '#fff', textShadow: `0 8px 0 ${v['--primary-deep']}` }}
              >
                {countdown}
              </motion.span>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {flash > 0 && (
              <motion.div
                key={flash}
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                style={{ position: 'absolute', inset: 0, background: '#fff', pointerEvents: 'none' }}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => fromFile(e.target.files?.[0])} />

      {/* controls */}
      <div style={{ minHeight: 120, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12, marginTop: 14 }}>
        <AnimatePresence mode="wait" initial={false}>
          {shot ? (
            <motion.div key="review" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={bouncy} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button className="btn block" onClick={keep} disabled={saving}>
                {saving ? t('photo.saving') : `🔥 ${t('photo.keep')}`}
              </button>
              <button className="btn block ghost" onClick={retake} disabled={saving}>
                ↺ {t('photo.retake')}
              </button>
            </motion.div>
          ) : (
            <motion.div key="live" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={bouncy} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-evenly' }}>
              <button className="icon-btn" style={{ width: 56, height: 56, fontSize: 26 }} aria-label={t('photo.flip')} onClick={() => { fx.tap(); setFacing((f) => (f === 'user' ? 'environment' : 'user')); }}>
                🔄
              </button>
              <div style={{ position: 'relative', width: 96, height: 96, display: 'grid', placeItems: 'center' }}>
                {/* pulsing halo: this is THE thing to press */}
                <motion.span
                  animate={{ scale: [1, 1.35], opacity: [0.55, 0] }}
                  transition={{ repeat: Infinity, duration: 1.3, ease: 'easeOut' }}
                  style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: v['--accent'] }}
                />
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={snap}
                  disabled={status !== 'live' || countdown !== undefined}
                  aria-label={t('photo.title')}
                  style={{
                    position: 'relative',
                    width: 88,
                    height: 88,
                    borderRadius: '50%',
                    background: '#fff',
                    border: `7px solid ${v['--accent']}`,
                    boxShadow: `0 6px 0 ${v['--accent-deep']}`,
                    fontSize: 34,
                    opacity: status === 'live' ? 1 : 0.5,
                  }}
                >
                  📸
                </motion.button>
              </div>
              <button
                className="icon-btn"
                aria-label={t('photo.timer')}
                aria-pressed={timer}
                onClick={() => { fx.tap(); setTimer((x) => !x); }}
                style={{
                  width: 56,
                  height: 56,
                  fontSize: 15,
                  fontWeight: 900,
                  flexDirection: 'column',
                  gap: 0,
                  background: timer ? 'var(--primary-soft)' : undefined,
                  borderColor: timer ? 'var(--primary)' : undefined,
                  color: timer ? 'var(--primary-deep)' : 'var(--ink-soft)',
                }}
              >
                <span style={{ fontSize: 22, lineHeight: 1 }}>⏱</span>3s
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        {!shot && (
          <button onClick={() => { fx.tap(); setSkipOpen(true); }} style={{ fontWeight: 800, color: 'var(--ink-soft)', fontSize: 14, padding: 6, opacity: 0.8 }}>
            {t('photo.skip')}
          </button>
        )}
      </div>

      <Sheet open={skipOpen} onClose={() => setSkipOpen(false)}>
        <div style={{ textAlign: 'center' }}>
          <motion.div animate={{ rotate: [0, -10, 10, -6, 0] }} transition={{ repeat: Infinity, duration: 1.8 }} style={{ fontSize: 64, marginBottom: 6 }}>
            🥺
          </motion.div>
          <h2>{t('photo.skipTitle')}</h2>
          <p className="muted" style={{ fontWeight: 700, margin: '8px 0 22px', lineHeight: 1.45 }}>{t('photo.skipBody')}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <button className="btn block" onClick={() => { fx.select(); setSkipOpen(false); }}>
            {t('photo.takeIt')}
          </button>
          <button className="btn block ghost" onClick={() => { fx.tap(); setSkipOpen(false); finish(); }}>
            {t('photo.skipAnyway')}
          </button>
        </div>
      </Sheet>
    </div>
  );
}
