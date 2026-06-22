"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Check, X, ZoomIn } from "lucide-react";

const FRAME_W = 300;
const FRAME_H = 400;
const OUTPUT_SCALE = 2.5;

interface ImageCropModalProps {
  file: File;
  index: number;
  total: number;
  onConfirm: (blob: Blob) => void;
  onSkip: () => void;
  onCancelAll: () => void;
}

export function ImageCropModal({ file, index, total, onConfirm, onSkip, onCancelAll }: ImageCropModalProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState("");
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    setZoom(1);
    setPos({ x: 0, y: 0 });
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleImgLoad() {
    const img = imgRef.current;
    if (!img) return;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    setNatural({ w, h });

    const scale0 = Math.max(FRAME_W / w, FRAME_H / h);
    setPos({
      x: (FRAME_W - w * scale0) / 2,
      y: (FRAME_H - h * scale0) / 2,
    });
  }

  const baseScale = natural.w > 0 ? Math.max(FRAME_W / natural.w, FRAME_H / natural.h) : 1;
  const scale = baseScale * zoom;
  const dispW = natural.w * scale;
  const dispH = natural.h * scale;

  const clamp = useCallback(
    (x: number, y: number) => {
      const minX = Math.min(0, FRAME_W - dispW);
      const minY = Math.min(0, FRAME_H - dispH);
      return { x: Math.min(0, Math.max(minX, x)), y: Math.min(0, Math.max(minY, y)) };
    },
    [dispW, dispH]
  );

  function handleZoomChange(newZoom: number) {
    // Keep the point currently shown at the frame's center fixed while scaling,
    // so the slider feels like "zoom toward center" instead of growing from the
    // image's top-left corner (which looked like stretching).
    const oldScale = baseScale * zoom;
    const newScale = baseScale * newZoom;
    const cx = FRAME_W / 2;
    const cy = FRAME_H / 2;
    const imgX = (cx - pos.x) / oldScale;
    const imgY = (cy - pos.y) / oldScale;

    const newDispW = natural.w * newScale;
    const newDispH = natural.h * newScale;
    const minX = Math.min(0, FRAME_W - newDispW);
    const minY = Math.min(0, FRAME_H - newDispH);

    setZoom(newZoom);
    setPos({
      x: Math.min(0, Math.max(minX, cx - imgX * newScale)),
      y: Math.min(0, Math.max(minY, cy - imgY * newScale)),
    });
  }

  function handlePointerDown(e: React.PointerEvent) {
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPos(clamp(dragRef.current.origX + dx, dragRef.current.origY + dy));
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  function handleConfirm() {
    const img = imgRef.current;
    if (!img || natural.w === 0) return;

    const canvas = document.createElement("canvas");
    canvas.width = FRAME_W * OUTPUT_SCALE;
    canvas.height = FRAME_H * OUTPUT_SCALE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(
      img,
      pos.x * OUTPUT_SCALE,
      pos.y * OUTPUT_SCALE,
      dispW * OUTPUT_SCALE,
      dispH * OUTPUT_SCALE
    );

    canvas.toBlob(
      (blob) => {
        if (blob) onConfirm(blob);
      },
      "image/jpeg",
      0.92
    );
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            Кадрирование фото {total > 1 ? `(${index + 1} из ${total})` : ""}
          </h3>
          <button onClick={onCancelAll} className="text-neutral-400 hover:text-neutral-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          ref={frameRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative mx-auto touch-none overflow-hidden rounded-xl bg-neutral-100"
          style={{ width: FRAME_W, height: FRAME_H, cursor: "grab" }}
        >
          {src && (
            <img
              ref={imgRef}
              src={src}
              alt=""
              onLoad={handleImgLoad}
              draggable={false}
              className="absolute max-w-none select-none"
              style={{
                left: pos.x,
                top: pos.y,
                width: dispW || "auto",
                height: dispH || "auto",
              }}
            />
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <ZoomIn className="h-4 w-4 shrink-0 text-neutral-400" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
            className="w-full accent-black"
          />
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onSkip}
            className="flex-1 rounded-xl bg-neutral-100 px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200"
          >
            Без обрезки
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
          >
            <Check className="h-4 w-4" />
            Готово
          </button>
        </div>
      </div>
    </div>
  );
}
