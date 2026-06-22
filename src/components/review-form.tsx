"use client";

import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { useTelegram } from "@/context/telegram";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";

interface ReviewFormProps {
  sellerId: string;
  onSubmitted: () => void;
}

export function ReviewForm({ sellerId, onSubmitted }: ReviewFormProps) {
  const { token } = useTelegram();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const displayRating = hoveredRating || rating;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (rating === 0) {
      setError("Выберите оценку");
      return;
    }
    if (text.trim().length < 5) {
      setError("Напишите отзыв подробнее (минимум 5 символов)");
      return;
    }
    if (!token) {
      setError("Нет авторизации");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sellerId, rating, text: text.trim() }),
      });

      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.error || "Ошибка при отправке");
      }

      toast("Отзыв отправлен на проверку");
      setRating(0);
      setText("");
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-neutral-50 rounded-xl space-y-3">
      <p className="text-sm font-medium">Оставить отзыв</p>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            onClick={() => setRating(star)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={`w-6 h-6 transition-colors ${
                star <= displayRating ? "fill-amber-400 text-amber-400" : "text-neutral-300 hover:text-amber-300"
              }`}
            />
          </button>
        ))}
        {displayRating > 0 && (
          <span className="text-sm text-neutral-500 ml-2">
            {["", "Ужасно", "Плохо", "Нормально", "Хорошо", "Отлично"][displayRating]}
          </span>
        )}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Расскажите о своём опыте покупки у этого продавца..."
        maxLength={500}
        rows={3}
        className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-400">{text.length}/500</span>
        <Button type="submit" size="sm" disabled={loading || rating === 0}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Отправить отзыв
        </Button>
      </div>
    </form>
  );
}
