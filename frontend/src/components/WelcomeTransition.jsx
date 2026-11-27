import { useEffect, useState } from 'react';

export default function WelcomeTransition({ userName, rt, rw, onFinish }) {
  const [isVisible, setIsVisible] = useState(true);
  const [animateBatik, setAnimateBatik] = useState(false);

  useEffect(() => {
    const startAnimation = window.setTimeout(() => setAnimateBatik(true), 180);
    const finishAnimation = window.setTimeout(() => setIsVisible(false), 4800);
    const finishTransition = window.setTimeout(onFinish, 5600);

    return () => {
      window.clearTimeout(startAnimation);
      window.clearTimeout(finishAnimation);
      window.clearTimeout(finishTransition);
    };
  }, [onFinish]);

  return (
    <div
      className={`welcome-transition fixed inset-0 z-[100] flex items-center justify-center overflow-hidden text-white transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
      } ${animateBatik ? 'welcome-transition--active' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={`Selamat datang, ${userName}`}
    >
      <div className="welcome-batik welcome-batik--top" />
      <div className="welcome-batik welcome-batik--bottom" />

      <div
        className={`welcome-content relative z-10 max-w-xl px-6 text-center ${
          animateBatik ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <p className="welcome-kicker mb-4 text-[11px] font-bold uppercase">Portal Resmi Kelurahan Ngrowo</p>

        <div className="welcome-badge mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
          <span aria-hidden="true">✓</span>
          <span>Warga Terverifikasi · RT {rt || '001'} / RW {rw || '001'}</span>
        </div>

        <h1 className="welcome-title mb-4 text-4xl font-bold tracking-tight md:text-6xl">
          Halo, <span className="welcome-name">{userName}</span>
        </h1>
        <p className="welcome-description mb-7 text-sm leading-relaxed md:text-base">
          Selamat datang di portal layanan bantuan sosial Kelurahan Ngrowo.
          Menyiapkan ringkasan bantuan dan pengaduan Anda...
        </p>

        <div className="welcome-progress-track mx-auto h-1 w-48 overflow-hidden rounded-full">
          <div className="welcome-progress h-full rounded-full" />
        </div>
      </div>
    </div>
  );
}
