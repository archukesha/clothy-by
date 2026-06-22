"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Trash2, X, Loader2 } from "lucide-react";
import { useTelegram } from "@/context/telegram";
import { useToast } from "@/components/ui/toast";

interface ReportModerationActionsProps {
  reportId: string;
  targetType: "LISTING" | "USER";
}

export function ReportModerationActions({ reportId, targetType }: ReportModerationActionsProps) {
  const { token } = useTelegram();
  const { toast, confirm } = useToast();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function resolve(action: "ban" | "remove" | "dismiss") {
    if (action === "ban") {
      const ok = await confirm("Заблокировать автора? Он не сможет пользоваться приложением.");
      if (!ok) return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Ошибка");
      }
      toast("Готово");
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Ошибка", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex shrink-0 flex-col gap-1.5">
      <button
        onClick={() => resolve("ban")}
        disabled={submitting}
        className="flex items-center justify-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        <Ban className="h-3.5 w-3.5" /> Заблокировать
      </button>
      {targetType === "LISTING" && (
        <button
          onClick={() => resolve("remove")}
          disabled={submitting}
          className="flex items-center justify-center gap-1 rounded-lg bg-neutral-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-900 disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" /> Снять
        </button>
      )}
      <button
        onClick={() => resolve("dismiss")}
        disabled={submitting}
        className="flex items-center justify-center gap-1 rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-200 disabled:opacity-50"
      >
        {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />} Отклонить
      </button>
    </div>
  );
}
