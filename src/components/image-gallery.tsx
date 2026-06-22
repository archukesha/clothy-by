"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

interface GalleryImage {
  id: string;
  url: string;
  order: number;
}

const STATUS_OVERLAY_LABELS: Record<string, string> = {
  SOLD: "ПРОДАНО",
  ARCHIVED: "В АРХИВЕ",
};

const SWIPE_THRESHOLD = 40;

interface ImageGalleryProps {
  images: GalleryImage[];
  title: string;
  status?: string;
}

export function ImageGallery({ images, title, status }: ImageGalleryProps) {
  const overlayLabel = status ? STATUS_OVERLAY_LABELS[status] : undefined;
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const lastTapRef = useRef(0);

  const goTo = useCallback(
    (index: number) => {
      if (index < 0) setActiveIndex(images.length - 1);
      else if (index >= images.length) setActiveIndex(0);
      else setActiveIndex(index);
    },
    [images.length]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") goTo(activeIndex - 1);
      else if (e.key === "ArrowRight") goTo(activeIndex + 1);
      else if (e.key === "Escape") setLightboxOpen(false);
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxOpen, activeIndex, goTo]);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxOpen]);

  useEffect(() => {
    setZoomed(false);
  }, [activeIndex, lightboxOpen]);

  function handleTouchStart(e: React.TouchEvent) {
    const touch = e.touches[0];
    touchRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd(e: React.TouchEvent, allowZoomToggle = false) {
    const start = touchRef.current;
    touchRef.current = null;
    if (!start) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;

    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) goTo(activeIndex + 1);
      else goTo(activeIndex - 1);
      return;
    }

    if (allowZoomToggle && Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        setZoomed((z) => !z);
      }
      lastTapRef.current = now;
    }
  }

  if (images.length === 0) {
    return (
      <div className="relative aspect-[4/5] bg-neutral-100 rounded-2xl overflow-hidden flex items-center justify-center">
        <span className="text-neutral-300 text-6xl">👕</span>
      </div>
    );
  }

  return (
    <>
      <div>
        {/* Main image */}
        <div
          className="relative aspect-[3/4] bg-neutral-100 rounded-2xl overflow-hidden mb-3 cursor-zoom-in group"
          onClick={() => setLightboxOpen(true)}
          onTouchStart={handleTouchStart}
          onTouchEnd={(e) => handleTouchEnd(e)}
        >
          <Image
            src={images[activeIndex].url}
            alt={`${title} — фото ${activeIndex + 1}`}
            fill
            className="object-contain bg-neutral-50 transition-transform duration-300"
            priority={activeIndex === 0}
            sizes="(max-width: 1024px) 100vw, 50vw"
          />

          {/* Zoom icon */}
          <div className="absolute bottom-3 right-3 p-2 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn className="w-4 h-4" />
          </div>

          {/* Arrow controls */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(activeIndex - 1);
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(activeIndex + 1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-xs font-medium">
              {activeIndex + 1} / {images.length}
            </div>
          )}

          {/* Status overlay */}
          {overlayLabel && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">{overlayLabel}</span>
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="grid grid-cols-6 gap-2">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setActiveIndex(i)}
                className={`relative aspect-square bg-neutral-100 rounded-lg overflow-hidden transition-all ${
                  i === activeIndex
                    ? "ring-2 ring-black ring-offset-1"
                    : "hover:opacity-80"
                }`}
              >
                <Image
                  src={img.url}
                  alt={`Фото ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Counter */}
          {images.length > 1 && (
            <div className="absolute top-4 left-4 text-white/70 text-sm z-10">
              {activeIndex + 1} / {images.length}
            </div>
          )}

          {/* Image */}
          <div
            className="relative w-full h-full max-w-5xl max-h-[90vh] mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={(e) => handleTouchEnd(e, true)}
          >
            <Image
              src={images[activeIndex].url}
              alt={`${title} — фото ${activeIndex + 1}`}
              fill
              className={`object-contain transition-transform duration-300 ${zoomed ? "scale-[2]" : "scale-100"}`}
              sizes="100vw"
              priority
            />
          </div>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(activeIndex - 1);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(activeIndex + 1);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIndex(i);
                  }}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                    i === activeIndex
                      ? "border-white"
                      : "border-transparent opacity-50 hover:opacity-80"
                  }`}
                >
                  <Image
                    src={img.url}
                    alt={`Фото ${i + 1}`}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
