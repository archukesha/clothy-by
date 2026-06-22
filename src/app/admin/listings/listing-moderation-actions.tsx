"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";
import { useTelegram } from "@/context/telegram";
import { useToast } from "@/components/ui/toast";

export function ListingModerationActions({ listingId }: { listingId: string }) {
  const { token } = useTelegram();
  const { toast } = useToast();
  const router = useRouter();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function patch(data: Record<string, unknown>) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
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

  if (rejecting) {
    return (
      <div className="flex w-44 shrink-0 flex-col gap-1.5">
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Причина отклонения"
          rows={2}
          className="w-full resize-none rounded-lg border border-neutral-200 px-2 py-1.5 text-xs focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black"
        />
        <div className="flex gap-1.5">
          <button
            onClick={() => setRejecting(false)}
            className="flex-1 rounded-lg bg-neutral-100 px-2 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-200"
          >
            Отмена
          </button>
          <button
            onClick={() => patch({ status: "REJECTED", rejectionReason: reason || "Не указана" })}
            disabled={submitting}
            className="flex-1 rounded-lg bg-red-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin" /> : "Отклонить"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 flex-col gap-1.5">
      <button
        onClick={() => patch({ status: "ACTIVE" })}
        disabled={submitting}
        className="flex items-center justify-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        <Check className="h-3.5 w-3.5" /> Одобрить
      </button>
      <button
        onClick={() => setRejecting(true)}
        disabled={submitting}
        className="flex items-center justify-center gap-1 rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-200 disabled:opacity-50"
      >
        <X className="h-3.5 w-3.5" /> Отклонить
      </button>
    </div>
  );
}
