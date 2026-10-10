import { useState } from 'react';
import { Sheet, Toggle, TopBar, useOverlay } from '../components/ui';
import { useT, type Lang } from '../i18n';
import { fx } from '../lib/feedback';
import { useApp } from '../store/app';

const LANGS: { id: Lang; label: string; flag: string }[] = [
  { id: 'en', label: 'English', flag: '🇬🇧' },
  { id: 'da', label: 'Dansk', flag: '🇩🇰' },
];

export function Settings() {
  const t = useT();
  const back = useApp((s) => s.back);
  const settings = useApp((s) => s.settings);
  const updateSettings = useApp((s) => s.updateSettings);
  const exportData = useApp((s) => s.exportData);
  const importData = useApp((s) => s.importData);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [backupText, setBackupText] = useState('');

  const copyBackup = async () => {
    fx.tap();
    const json = exportData();
    try {
      await navigator.clipboard.writeText(json);
      useOverlay.getState().show(`📋 ${t('settings.copied')}`);
    } catch {
      // Clipboard blocked: fall back to showing the text so it can be copied manually.
      setBackupText(json);
      setRestoreOpen(true);
    }
  };

  const restore = async () => {
    const ok = await useOverlay.getState().ask(t('settings.restoreConfirm'), t('settings.import'), true);
    if (!ok) return;
    if (importData(backupText.trim())) {
      fx.win();
      setRestoreOpen(false);
      useOverlay.getState().show(`✅ ${t('settings.restored')}`);
    } else {
      fx.error();
      useOverlay.getState().show(`⚠️ ${t('settings.invalid')}`);
    }
  };

  return (
    <>
      <TopBar onBack={back} title={t('settings.title')} />
      <div className="scroll">
        <p className="section-title" style={{ marginTop: 6 }}>{t('settings.language')}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {LANGS.map((l) => {
            const on = settings.lang === l.id;
            return (
              <button
                key={l.id}
                className="card tappable"
                onClick={() => { fx.select(); updateSettings({ lang: l.id }); }}
                style={{
                  padding: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontWeight: 900,
                  fontSize: 17,
                  borderColor: on ? 'var(--primary)' : 'var(--line)',
                  background: on ? 'var(--primary-soft)' : 'var(--surface)',
                  boxShadow: `0 4px 0 ${on ? 'var(--primary-deep)' : 'var(--line)'}`,
                }}
              >
                <span style={{ fontSize: 28 }}>{l.flag}</span>
                {l.label}
              </button>
            );
          })}
        </div>

        <div className="card" style={{ marginTop: 24 }}>
          <div className="list-row" style={{ fontWeight: 900, fontSize: 17 }}>
            <span style={{ fontSize: 24 }}>🔊</span>
            <span style={{ flex: 1 }}>{t('settings.sound')}</span>
            <Toggle on={settings.sound} onChange={(sound) => updateSettings({ sound })} />
          </div>
          <div className="list-row" style={{ fontWeight: 900, fontSize: 17 }}>
            <span style={{ fontSize: 24 }}>📳</span>
            <span style={{ flex: 1 }}>{t('settings.haptics')}</span>
            <Toggle on={settings.haptics} onChange={(haptics) => updateSettings({ haptics })} />
          </div>
        </div>

        <p className="section-title">{t('settings.backup')}</p>
        <div className="card" style={{ padding: 16 }}>
          <p className="muted" style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.45, marginBottom: 16 }}>{t('settings.backupSub')}</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn small" style={{ flex: 1 }} onClick={copyBackup}>📋 {t('settings.export')}</button>
            <button className="btn small ghost" style={{ flex: 1 }} onClick={() => { fx.tap(); setBackupText(''); setRestoreOpen(true); }}>
              ♻️ {t('settings.import')}
            </button>
          </div>
        </div>

        <p className="muted" style={{ textAlign: 'center', fontWeight: 700, fontSize: 13, marginTop: 30 }}>
          Healthy Bois 💪 · {t('settings.version', { v: __APP_VERSION__ })}
        </p>
      </div>

      <Sheet open={restoreOpen} onClose={() => setRestoreOpen(false)}>
        <h2 style={{ marginBottom: 14 }}>{t('settings.backup')}</h2>
        <textarea
          className="text-input"
          value={backupText}
          placeholder={t('settings.pasteHere')}
          onChange={(e) => setBackupText(e.target.value)}
        />
        <button className="btn block" style={{ marginTop: 16 }} disabled={!backupText.trim()} onClick={restore}>
          {t('settings.import')}
        </button>
      </Sheet>
    </>
  );
}
