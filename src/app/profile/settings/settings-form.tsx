"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useTelegram } from "@/context/telegram";
import { useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Autocomplete } from "@/components/autocomplete";
import { CITIES } from "@/lib/constants";

const cityOptions = CITIES.map((city) => ({ value: city, label: city }));

interface SettingsFormProps {
  name: string;
  bio: string;
  city: string;
}

export function SettingsForm({ name, bio, city }: SettingsFormProps) {
  const { token, setUser, user } = useTelegram();
  const { toast } = useToast();
  const router = useRouter();

  const [values, setValues] = useState({ name, bio, city });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const trimmedName = values.name.trim();
    if (trimmedName.length < 2) {
      setError("Имя должно быть не короче 2 символов");
      return;
    }

    if (!token) {
      toast("Нет авторизации", "error");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: trimmedName,
          bio: values.bio.trim() || null,
          city: values.city.trim() || null,
        }),
      });

      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.error || "Не удалось сохранить профиль");
      }

      if (user) {
        setUser({ ...user, name: body.name });
      }

      toast("Профиль обновлён");
      router.push("/profile");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Ошибка обновления", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Имя"
        value={values.name}
        onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
        maxLength={50}
        error={error ?? undefined}
        required
      />

      <Autocomplete
        name="city"
        label="Город"
        options={cityOptions}
        placeholder="Выберите город"
        defaultValue={values.city}
        selectOnly
        onChange={(value) => setValues((v) => ({ ...v, city: value }))}
      />

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-neutral-700">О себе</label>
        <textarea
          value={values.bio}
          onChange={(e) => setValues((v) => ({ ...v, bio: e.target.value }))}
          maxLength={300}
          rows={4}
          className="w-full resize-none rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
        />
        <p className="text-right text-xs text-neutral-400">{values.bio.length}/300</p>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Сохранить
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/profile")}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
