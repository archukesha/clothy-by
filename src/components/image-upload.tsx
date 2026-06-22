"use client";

import { useState, useRef, useCallback } from "react";
import { ImagePlus, X, Loader2, GripVertical, Star } from "lucide-react";
import { ImageCropModal } from "@/components/image-crop-modal";

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  token?: string | null;
}

export function ImageUpload({
  images,
  onChange,
  maxImages = 8,
  token,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [cropQueue, setCropQueue] = useState<File[]>([]);
  const [cropProcessed, setCropProcessed] = useState<File[]>([]);
  const [cropTotal, setCropTotal] = useState(0);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      setError("");
      const fileArray = Array.from(files);
      const remaining = maxImages - images.length;

      if (fileArray.length > remaining) {
        setError(`Можно добавить ещё ${remaining} фото`);
        return;
      }

      for (const file of fileArray) {
        if (!file.type.startsWith("image/")) {
          setError(`${file.name} — не изображение`);
          return;
        }
        if (file.size > 10 * 1024 * 1024) {
          setError(`${file.name} — больше 10 МБ`);
          return;
        }
      }

      setUploading(true);

      try {
        const formData = new FormData();
        fileArray.forEach((file) => formData.append("files", file));

        const headers: HeadersInit = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const response = await fetch("/api/upload", {
          method: "POST",
          headers,
          body: formData,
        });

        if (!response.ok) {
          const body = await response.json();
          setError(body.error || "Ошибка загрузки");
          setUploading(false);
          return;
        }

        const { urls } = await response.json();
        onChange([...images, ...urls]);
      } catch {
        setError("Ошибка сети при загрузке");
      } finally {
        setUploading(false);
      }
    },
    [images, maxImages, onChange, token]
  );

  function startCropFlow(files: FileList | File[]) {
    setError("");
    const fileArray = Array.from(files);
    const remaining = maxImages - images.length;

    if (fileArray.length > remaining) {
      setError(`Можно добавить ещё ${remaining} фото`);
      return;
    }

    for (const file of fileArray) {
      if (!file.type.startsWith("image/")) {
        setError(`${file.name} — не изображение`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(`${file.name} — больше 10 МБ`);
        return;
      }
    }

    setCropQueue(fileArray);
    setCropProcessed([]);
    setCropTotal(fileArray.length);
  }

  function handleCropDone(result: Blob | File) {
    const file =
      result instanceof File ? result : new File([result], `photo-${Date.now()}.jpg`, { type: "image/jpeg" });
    const nextProcessed = [...cropProcessed, file];
    const nextQueue = cropQueue.slice(1);
    setCropProcessed(nextProcessed);
    setCropQueue(nextQueue);
    if (nextQueue.length === 0) {
      uploadFiles(nextProcessed);
      setCropProcessed([]);
    }
  }

  function handleCropCancelAll() {
    setCropQueue([]);
    setCropProcessed([]);
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragOver(false);

    if (dragIndex !== null) {
      return;
    }

    if (event.dataTransfer.files.length > 0) {
      startCropFlow(event.dataTransfer.files);
    }
  }

  function handleDragOver(event: React.DragEvent) {
    event.preventDefault();
    if (dragIndex === null) {
      setDragOver(true);
    }
  }

  function handleDragLeave(event: React.DragEvent) {
    event.preventDefault();
    setDragOver(false);
  }

  function removeImage(index: number) {
    onChange(images.filter((_, itemIndex) => itemIndex !== index));
  }

  function makeCover(index: number) {
    if (index === 0) return;
    const newImages = [...images];
    const [moved] = newImages.splice(index, 1);
    newImages.unshift(moved);
    onChange(newImages);
  }

  function handleItemDragStart(index: number) {
    setDragIndex(index);
  }

  function handleItemDragOver(event: React.DragEvent, index: number) {
    event.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    const newImages = [...images];
    const [moved] = newImages.splice(dragIndex, 1);
    newImages.splice(index, 0, moved);
    onChange(newImages);
    setDragIndex(index);
  }

  function handleItemDragEnd() {
    setDragIndex(null);
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-neutral-700">
        Фотографии (до {maxImages} штук)
      </label>

      {images.length > 0 ? (
        <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((url, index) => (
            <div
              key={`${url}-${index}`}
              draggable
              onDragStart={() => handleItemDragStart(index)}
              onDragOver={(event) => handleItemDragOver(event, index)}
              onDragEnd={handleItemDragEnd}
              className={`group relative aspect-square cursor-grab overflow-hidden rounded-xl bg-neutral-100 transition-all active:cursor-grabbing ${
                dragIndex === index ? "border-2 border-black opacity-50" : "border-2 border-transparent"
              }`}
            >
              <img
                src={url}
                alt={`Фото ${index + 1}`}
                className="h-full w-full object-cover"
                draggable={false}
              />

              {index === 0 ? (
                <span className="absolute bottom-1 left-1 flex items-center gap-0.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  <Star className="h-2.5 w-2.5 fill-current" />
                  <span className="hidden sm:inline">Обложка</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => makeCover(index)}
                  title="Сделать обложкой"
                  className="absolute bottom-1 left-1 flex items-center gap-0.5 rounded-md bg-black/60 px-1.5 py-1 text-white transition-colors hover:bg-black"
                >
                  <Star className="h-3 w-3" />
                  <span className="hidden text-[10px] font-medium sm:inline">Сделать обложкой</span>
                </button>
              )}

              <div className="absolute left-1 top-1 hidden rounded-md bg-black/40 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 sm:block">
                <GripVertical className="h-3 w-3" />
              </div>

              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white transition-colors hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {images.length < maxImages ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 transition-all ${
            dragOver
              ? "border-black bg-neutral-50"
              : "border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50"
          } ${uploading ? "pointer-events-none opacity-60" : ""}`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
              <p className="text-sm text-neutral-500">Загружаем...</p>
            </>
          ) : (
            <>
              <ImagePlus className="h-8 w-8 text-neutral-400" />
              <div className="text-center">
                <p className="text-sm font-medium text-neutral-700">Перетащите фото сюда</p>
                <p className="mt-1 text-xs text-neutral-400">
                  или нажмите для выбора • JPG, PNG, WebP • до 10 МБ
                </p>
              </div>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={(event) => {
              if (event.target.files?.length) {
                startCropFlow(event.target.files);
                event.target.value = "";
              }
            }}
          />
        </div>
      ) : null}

      {error ? <p className="mt-2 text-xs text-red-500">{error}</p> : null}

      {images.length > 0 ? (
        <p className="mt-2 text-xs text-neutral-400">
          Нажмите на звёздочку, чтобы сделать фото обложкой. На компьютере можно также перетаскивать фото для изменения порядка.
        </p>
      ) : null}

      {cropQueue.length > 0 && (
        <ImageCropModal
          key={cropTotal - cropQueue.length}
          file={cropQueue[0]}
          index={cropTotal - cropQueue.length}
          total={cropTotal}
          onConfirm={handleCropDone}
          onSkip={() => handleCropDone(cropQueue[0])}
          onCancelAll={handleCropCancelAll}
        />
      )}
    </div>
  );
}
