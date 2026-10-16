import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { fx } from '../lib/feedback';
import { usePhoto } from '../lib/photos';
import { bouncy, spring } from './ui';

/** A winner photo in a tilted white polaroid frame. Tap to view full screen. */
export function Polaroid({ path, width = 220, rotate = -4, delay = 0 }: { path: string; width?: number; rotate?: number; delay?: number }) {
  const url = usePhoto(path);
  const [open, setOpen] = useState(false);
  const pad = Math.max(5, width * 0.045);
  return (
    <>
      <motion.button
        initial={{ scale: 0.3, rotate: rotate - 25, y: -60, opacity: 0 }}
        animate={{ scale: 1, rotate, y: 0, opacity: 1 }}
        transition={{ ...bouncy, delay }}
        whileTap={{ scale: 0.95 }}
        onClick={(e) => {
          e.stopPropagation();
          if (!url) return;
          fx.tap();
          setOpen(true);
        }}
        style={{
          width,
          flex: 'none',
          padding: `${pad}px ${pad}px ${pad * 3.2}px`,
          background: '#fff',
          borderRadius: Math.max(4, width * 0.03),
          boxShadow: '0 10px 24px rgba(0,0,0,.18), 0 3px 0 rgba(0,0,0,.08)',
        }}
      >
        <div style={{ width: '100%', aspectRatio: '3 / 4', borderRadius: 2, background: '#eee', overflow: 'hidden' }}>
          {url && <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
        </div>
      </motion.button>
      {createPortal(
        <AnimatePresence>
          {open && url && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(20,16,32,.88)', display: 'grid', placeItems: 'center', padding: 20 }}
            >
              <motion.img
                src={url}
                alt=""
                initial={{ scale: 0.6, rotate }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={spring}
                style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,.4)' }}
              />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
