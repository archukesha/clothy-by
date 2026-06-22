"use client";

import { useState, useEffect, useCallback } from "react";
import { Star } from "lucide-react";
import { useTelegram } from "@/context/telegram";
import { ReviewForm } from "@/components/review-form";
import { ReviewCard } from "@/components/review-card";

interface Review {
  id: string;
  rating: number;
  text: string;
  createdAt: string;
  author: { id: string; name: string; avatar: string | null };
  listing?: { id: string; title: string } | null;
}

interface ReviewsData {
  reviews: Review[];
  average: number;
  count: number;
  hasReviewed: boolean;
  canReview: boolean;
}

export function ReviewsSection({ sellerId }: { sellerId: string }) {
  const { user, token, isLoading } = useTelegram();
  const [data, setData] = useState<ReviewsData | null>(null);

  const load = useCallback(() => {
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`/api/reviews?sellerId=${sellerId}`, { headers })
      .then((r) => r.json())
      .then(setData);
  }, [sellerId, token]);

  useEffect(() => {
    if (isLoading) return;
    load();
  }, [isLoading, load]);

  if (!data) {
    return <div className="h-24 animate-pulse rounded-2xl bg-neutral-100" />;
  }

  const canReview = !!user && user.id !== sellerId && !data.hasReviewed && data.canReview;
  const needsPurchase = !!user && user.id !== sellerId && !data.hasReviewed && !data.canReview;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
          <span className="text-lg font-bold">{data.count > 0 ? data.average.toFixed(1) : "—"}</span>
        </div>
        <span className="text-sm text-neutral-500">{data.count} отзывов</span>
      </div>

      {canReview && <ReviewForm sellerId={sellerId} onSubmitted={load} />}
      {needsPurchase && (
        <p className="rounded-xl bg-neutral-50 p-3 text-sm text-neutral-500">
          Оставить отзыв можно после того, как вы купите что-то у этого продавца.
        </p>
      )}

      {data.reviews.length === 0 ? (
        <p className="text-sm text-neutral-500">У продавца пока нет отзывов</p>
      ) : (
        <div className="space-y-3">
          {data.reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
