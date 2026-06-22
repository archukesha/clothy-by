"use client";

import { useState } from "react";
import Link from "next/link";
import { Flag, X, Loader2 } from "lucide-react";
import { useTelegram } from "@/context/telegram";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";

const REASONS = [
  { value: "SPAM", label: "Спам / реклама" },
  { value: "FRAUD", label: "Мошенничество" },
  { value: "PROHIBITED", label: "Запрещённый товар" },
  { value: "OFFENSIVE", label: "Оскорбительное поведение" },
  { value: "FAKE", label: "Подделка / не соответствует описанию" },
  { value: "OTHER", label: "Другое" },
];

interface ReportButtonProps {
  targetType: "LISTING" | "USER";
  listingId?: string;
  targetUserId?: string;
}

export function ReportButton({ targetType, listingId, targetUserId }: ReportButtonProps) {
  const { user, token } = useTelegram();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!user || (targetType === "USER" && user.id === targetUserId)) return null;

  async function submit() {
    if (!reason) {
      toast("Выберите причину", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetType, listingId, targetUserId, reason, comment: comment.trim() || undefined }),
      });

      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.error || "Не удалось отправить жалобу");
      }

      toast("Жалоба отправлена на рассмотрение");
      setOpen(false);
      setReason(null);
      setComment("");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Ошибка", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} title="Пожаловаться">
        <Flag className="h-4 w-4" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 animate-in fade-in bg-black/40 duration-150"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-sm animate-in zoom-in-95 fade-in rounded-2xl bg-white p-5 shadow-xl duration-150">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Пожаловаться</h3>
              <button onClick={() => setOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-3 space-y-1.5">
              {REASONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setReason(r.value)}
                  className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                    reason === r.value ? "border-black bg-neutral-50 font-medium" : "border-neutral-200 hover:bg-neutral-50"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Комментарий (необязательно)"
              rows={2}
              maxLength={500}
              className="w-full resize-none rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black"
            />

            <Link href="/rules" target="_blank" className="mt-2 inline-block text-xs text-neutral-400 hover:underline">
              Что считается нарушением правил?
            </Link>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200"
              >
                Отмена
              </button>
              <button
                onClick={submit}
                disabled={submitting}
                className="flex items-center gap-1.5 rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Отправить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
