"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useTelegram } from "@/context/telegram";
import { useToast } from "@/components/ui/toast";

interface UserBanToggleProps {
  userId: string;
  banned: boolean;
  disabled?: boolean;
}

export function UserBanToggle({ userId, banned, disabled }: UserBanToggleProps) {
  const { token } = useTelegram();
  const { toast, confirm } = useToast();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function toggle() {
    if (!banned) {
      const ok = await confirm("Заблокировать пользователя? Он не сможет пользоваться приложением.");
      if (!ok) return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ banned: !banned }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Ошибка");
      }
      toast(banned ? "Пользователь разблокирован" : "Пользователь заблокирован");
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Ошибка", "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (disabled) return null;

  return (
    <button
      onClick={toggle}
      disabled={submitting}
      className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
        banned ? "bg-neutral-100 text-neutral-700 hover:bg-neutral-200" : "bg-red-600 text-white hover:bg-red-700"
      }`}
    >
      {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
      {banned ? "Разблокировать" : "Заблокировать"}
    </button>
  );
}
