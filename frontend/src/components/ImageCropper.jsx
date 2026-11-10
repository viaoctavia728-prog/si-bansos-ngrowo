import { useCallback, useEffect, useRef, useState } from 'react';

const VIEWPORT = 280;

export default function ImageCropper({ file, onCancel, onConfirm }) {
  const canvasRef = useRef(null);
  const [img, setImg] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragState = useRef(null);

  useEffect(() => {
    if (!file) return undefined;
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      setImg(image);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const getRenderRect = useCallback(() => {
    if (!img) return null;
    const baseScale = Math.max(VIEWPORT / img.width, VIEWPORT / img.height);
    const scale = baseScale * zoom;
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (VIEWPORT - w) / 2 + offset.x;
    const y = (VIEWPORT - h) / 2 + offset.y;
    return { x, y, w, h, scale };
  }, [img, zoom, offset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, VIEWPORT, VIEWPORT);
    const rect = getRenderRect();
    if (!rect) return;
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, VIEWPORT, VIEWPORT);
    ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h);
  }, [img, getRenderRect]);

  const clampOffset = useCallback((nextOffset, nextZoom) => {
    if (!img) return nextOffset;
    const baseScale = Math.max(VIEWPORT / img.width, VIEWPORT / img.height);
    const scale = baseScale * nextZoom;
    const w = img.width * scale;
    const h = img.height * scale;
    const maxX = Math.max(0, (w - VIEWPORT) / 2);
    const maxY = Math.max(0, (h - VIEWPORT) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, nextOffset.x)),
      y: Math.min(maxY, Math.max(-maxY, nextOffset.y)),
    };
  }, [img]);

  const handlePointerDown = (clientX, clientY) => {
    dragState.current = { startX: clientX, startY: clientY, originX: offset.x, originY: offset.y };
  };
  const handlePointerMove = (clientX, clientY) => {
    if (!dragState.current) return;
    const dx = clientX - dragState.current.startX;
    const dy = clientY - dragState.current.startY;
    setOffset(clampOffset({ x: dragState.current.originX + dx, y: dragState.current.originY + dy }, zoom));
  };
  const handlePointerUp = () => { dragState.current = null; };

  const handleZoom = (value) => {
    const next = Math.min(3, Math.max(1, value));
    setZoom(next);
    setOffset((prev) => clampOffset(prev, next));
  };

  const confirmCrop = () => {
    if (!img) return;
    const rect = getRenderRect();
    const OUTPUT = 512;
    const out = document.createElement('canvas');
    out.width = OUTPUT;
    out.height = OUTPUT;
    const ctx = out.getContext('2d');
    const ratio = OUTPUT / VIEWPORT;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, OUTPUT, OUTPUT);
    ctx.drawImage(img, rect.x * ratio, rect.y * ratio, rect.w * ratio, rect.h * ratio);
    out.toBlob((blob) => {
      if (!blob) return;
      const cropped = new File([blob], 'profil.webp', { type: 'image/webp' });
      onConfirm(cropped);
    }, 'image/webp', 0.92);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sesuaikan foto profil"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-[fadeIn_.2s_ease-out]"
    >
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-[#111b21] shadow-2xl animate-[popIn_.28s_cubic-bezier(.16,1,.3,1)]">
        <div className="flex items-center justify-between px-4 py-3.5 text-white">
          <button type="button" onClick={onCancel} className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 hover:bg-white/10" aria-label="Batal">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
          <div className="text-center leading-tight">
            <p className="text-sm font-bold">Sesuaikan Foto</p>
            <p className="text-[10px] text-white/60">Geser & perbesar foto</p>
          </div>
          <button type="button" onClick={confirmCrop} className="flex h-9 w-9 items-center justify-center rounded-full text-emerald-400 hover:bg-white/10" aria-label="Simpan foto">
            <span className="material-symbols-outlined text-[22px]">check</span>
          </button>
        </div>

        <div className="flex justify-center px-4">
          <div
            className="relative touch-none overflow-hidden rounded-full ring-2 ring-white/20"
            style={{ width: VIEWPORT, height: VIEWPORT }}
            onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
            onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={(e) => handlePointerDown(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchMove={(e) => { e.preventDefault(); handlePointerMove(e.touches[0].clientX, e.touches[0].clientY); }}
            onTouchEnd={handlePointerUp}
          >
            <canvas ref={canvasRef} width={VIEWPORT} height={VIEWPORT} className="block cursor-grab active:cursor-grabbing" />
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 py-5">
          <span className="material-symbols-outlined text-[20px] text-white/60">zoom_out</span>
          <input
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={(e) => handleZoom(parseFloat(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-emerald-500"
            aria-label="Perbesar foto"
          />
          <span className="material-symbols-outlined text-[20px] text-white/60">zoom_in</span>
        </div>
      </div>
    </div>
  );
}
