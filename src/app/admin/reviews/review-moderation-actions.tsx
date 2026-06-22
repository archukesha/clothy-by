"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";
import { useTelegram } from "@/context/telegram";
import { useToast } from "@/components/ui/toast";

export function ReviewModerationActions({ reviewId }: { reviewId: string }) {
  const { token } = useTelegram();
  const { toast } = useToast();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function resolve(approve: boolean) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ approve }),
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
        onClick={() => resolve(true)}
        disabled={submitting}
        className="flex items-center justify-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        <Check className="h-3.5 w-3.5" /> Одобрить
      </button>
      <button
        onClick={() => resolve(false)}
        disabled={submitting}
        className="flex items-center justify-center gap-1 rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-200 disabled:opacity-50"
      >
        {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />} Отклонить
      </button>
    </div>
  );
}
