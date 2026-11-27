import { useEffect, useRef, useState } from 'react';

const FONT_SCALE_OPTIONS = [-1, 0, 1];

export default function AccessibilityControls() {
  const [isOpen, setIsOpen] = useState(false);
  const [fontScale, setFontScale] = useState(() => {
    const savedScale = Number(window.localStorage.getItem('accessibility-text-scale'));
    return FONT_SCALE_OPTIONS.includes(savedScale) ? savedScale : 0;
  });
  const [highContrast, setHighContrast] = useState(
    () => window.localStorage.getItem('accessibility-high-contrast') === 'true',
  );
  const [batikTheme, setBatikTheme] = useState(
    () => window.localStorage.getItem('batik-theme') || 'light',
  );
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.textScale = fontScale < 0 ? 'smaller' : fontScale > 0 ? 'larger' : 'normal';
    root.dataset.highContrast = String(highContrast);
    root.dataset.batikTheme = batikTheme;
    window.localStorage.setItem('accessibility-text-scale', String(fontScale));
    window.localStorage.setItem('accessibility-high-contrast', String(highContrast));
    window.localStorage.setItem('batik-theme', batikTheme);
  }, [fontScale, highContrast, batikTheme]);

  useEffect(() => {
    if (!isOpen) return undefined;

    panelRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const scaleLabel = fontScale < 0 ? 'Kecil' : fontScale > 0 ? 'Besar' : 'Normal';

  return (
    <>
      {isOpen && (
        <section
          ref={panelRef}
          id="accessibility-controls"
          role="dialog"
          aria-labelledby="accessibility-title"
          tabIndex={-1}
          className="accessibility-panel fixed bottom-36 right-4 z-[90] w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl outline-none lg:bottom-24"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="accessibility-title" className="text-base font-extrabold text-slate-900">Aksesibilitas</h2>
              <p className="mt-1 text-xs text-slate-600">Sesuaikan tampilan agar lebih nyaman dibaca.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                triggerRef.current?.focus();
              }}
              aria-label="Tutup pengaturan aksesibilitas"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="mt-4 border-t border-slate-200 pt-4">
            <p className="mb-2 text-sm font-bold text-slate-800">Ukuran teks</p>
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setFontScale((current) => Math.max(-1, current - 1))}
                disabled={fontScale === -1}
                aria-label="Perkecil ukuran teks"
                className="flex h-11 min-w-12 items-center justify-center rounded-lg border border-slate-300 px-3 text-base font-bold text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                A−
              </button>
              <span className="text-sm font-semibold text-slate-700" aria-live="polite">
                {scaleLabel}
              </span>
              <button
                type="button"
                onClick={() => setFontScale((current) => Math.min(1, current + 1))}
                disabled={fontScale === 1}
                aria-label="Perbesar ukuran teks"
                className="flex h-11 min-w-12 items-center justify-center rounded-lg border border-slate-300 px-3 text-lg font-bold text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45"
              >
                A+
              </button>
            </div>
          </div>

          <div className="mt-4 border-t border-slate-200 pt-4">
            <p className="mb-2 text-sm font-bold text-slate-800">Warna motif batik</p>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Pilih warna motif batik">
              {[
                { value: 'light', label: 'Terang', icon: 'light_mode' },
                { value: 'dark', label: 'Gelap', icon: 'dark_mode' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setBatikTheme(option.value)}
                  aria-pressed={batikTheme === option.value}
                  className={`flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                    batikTheme === option.value
                      ? 'border-primary bg-primary-soft text-primary'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setHighContrast((enabled) => !enabled)}
              aria-pressed={highContrast}
              className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-slate-300 px-3 py-2 text-left text-sm font-semibold text-slate-800 hover:bg-slate-100"
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined" aria-hidden="true">contrast</span>
                Mode kontras tinggi
              </span>
              <span className="text-xs font-bold">{highContrast ? 'Aktif' : 'Mati'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setFontScale(0);
              setHighContrast(false);
              setBatikTheme('light');
            }}
            className="mt-4 min-h-10 w-full rounded-lg text-sm font-semibold text-primary underline underline-offset-2 hover:text-primary-dark"
          >
            Atur ulang tampilan
          </button>
        </section>
      )}

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label="Buka pengaturan aksesibilitas"
        aria-expanded={isOpen}
        aria-controls={isOpen ? 'accessibility-controls' : undefined}
        title="Aksesibilitas"
        className="accessibility-trigger fixed bottom-20 right-4 z-[90] flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-primary text-white shadow-lg transition hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:bottom-5"
      >
        <span className="material-symbols-outlined text-[24px]" aria-hidden="true">accessibility_new</span>
      </button>
    </>
  );
}
