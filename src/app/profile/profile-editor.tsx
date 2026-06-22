"use client";

import { useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useTelegram } from "@/context/telegram";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";

interface ProfileEditorProps {
  avatar: string | null;
  banner: string | null;
}

export function ProfileEditor({ avatar, banner }: ProfileEditorProps) {
  const { token, setUser, user } = useTelegram();
  const { toast } = useToast();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [bannerLoading, setBannerLoading] = useState(false);

  async function uploadSingle(file: File): Promise<string> {
    if (!token) {
      throw new Error("Нет авторизации");
    }

    const formData = new FormData();
    formData.append("files", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const body = await response.json().catch(() => null);
    if (!response.ok || !body?.urls?.[0]) {
      throw new Error(body?.error || "Ошибка загрузки");
    }

    return body.urls[0] as string;
  }

  async function saveProfile(data: { avatar?: string | null; banner?: string | null }) {
    if (!token) {
      throw new Error("Нет авторизации");
    }

    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(body?.error || "Не удалось сохранить профиль");
    }

    if (user) {
      setUser({
        ...user,
        avatar: body.avatar ?? null,
      });
    }

    return body;
  }

  async function handleAvatarChange(file?: File | null) {
    if (!file) return;
    setAvatarLoading(true);
    try {
      const url = await uploadSingle(file);
      await saveProfile({ avatar: url });
      toast("Фото профиля обновлено");
      window.location.reload();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Ошибка обновления", "error");
    } finally {
      setAvatarLoading(false);
    }
  }

  async function handleBannerChange(file?: File | null) {
    if (!file) return;
    setBannerLoading(true);
    try {
      const url = await uploadSingle(file);
      await saveProfile({ banner: url });
      toast("Баннер обновлён");
      window.location.reload();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Ошибка обновления", "error");
    } finally {
      setBannerLoading(false);
    }
  }

  async function handleRemove(type: "avatar" | "banner") {
    try {
      await saveProfile({ [type]: null });
      toast(type === "avatar" ? "Фото профиля удалено" : "Баннер удалён");
      window.location.reload();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Ошибка удаления", "error");
    }
  }

  return (
    <>
      <div className="absolute right-3 top-3 z-10 flex gap-2">
        <button
          type="button"
          onClick={() => bannerInputRef.current?.click()}
          disabled={bannerLoading}
          aria-label="Загрузить баннер"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white shadow-sm backdrop-blur-sm transition hover:bg-black/70 disabled:opacity-60"
        >
          {bannerLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        </button>
        {banner ? (
          <button
            type="button"
            onClick={() => handleRemove("banner")}
            aria-label="Удалить баннер"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white shadow-sm backdrop-blur-sm transition hover:bg-black/70"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="absolute left-4 -bottom-10 h-20 w-20">
        <button
          type="button"
          onClick={() => avatarInputRef.current?.click()}
          disabled={avatarLoading}
          aria-label="Загрузить фото профиля"
          className="absolute -bottom-1 -right-1 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black text-white shadow-sm ring-2 ring-white transition hover:bg-neutral-800 disabled:opacity-60"
        >
          {avatarLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        </button>
        {avatar ? (
          <button
            type="button"
            onClick={() => handleRemove("avatar")}
            aria-label="Удалить фото профиля"
            className="absolute -bottom-1 right-9 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-neutral-700 shadow-sm ring-2 ring-white transition hover:bg-neutral-100"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <input
        ref={avatarInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(event) => handleAvatarChange(event.target.files?.[0])}
      />
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(event) => handleBannerChange(event.target.files?.[0])}
      />
    </>
  );
}
