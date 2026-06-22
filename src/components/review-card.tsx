"use client";

import { Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatDate } from "@/lib/utils";

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    text: string | null;
    createdAt: string | Date;
    author: {
      id: string;
      name: string;
      avatar: string | null;
    };
    listing?: { id: string; title: string } | null;
  };
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="p-4 bg-neutral-50 rounded-xl">
      <div className="flex items-start gap-3">
        <Link href={`/sellers/${review.author.id}`}>
          <div className="w-9 h-9 bg-neutral-200 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden shrink-0">
            {review.author.avatar ? (
              <Image
                src={review.author.avatar}
                alt={review.author.name}
                width={36}
                height={36}
                className="w-full h-full object-cover"
              />
            ) : (
              review.author.name[0].toUpperCase()
            )}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <Link
              href={`/sellers/${review.author.id}`}
              className="text-sm font-medium hover:underline truncate"
            >
              {review.author.name}
            </Link>
            <span className="text-xs text-neutral-400 shrink-0">
              {formatDate(review.createdAt)}
            </span>
          </div>

          {/* Stars */}
          <div className="flex items-center gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-3.5 h-3.5 ${
                  star <= review.rating
                    ? "fill-amber-400 text-amber-400"
                    : "text-neutral-200"
                }`}
              />
            ))}
          </div>

          {review.text && (
            <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
              {review.text}
            </p>
          )}

          {review.listing && (
            <Link
              href={`/listings/${review.listing.id}`}
              className="mt-2 inline-block text-xs text-neutral-400 hover:text-neutral-600 hover:underline"
            >
              Покупка: {review.listing.title}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
