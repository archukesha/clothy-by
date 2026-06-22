export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Star } from "lucide-react";
import { ReviewModerationActions } from "./review-moderation-actions";
import { AdminPagination } from "@/components/admin-pagination";

const PAGE_SIZE = 20;

interface AdminReviewsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function AdminReviewsPage({ searchParams }: AdminReviewsPageProps) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);

  const [total, reviews] = await Promise.all([
    prisma.review.count({ where: { status: "MODERATION" } }),
    prisma.review.findMany({
      where: { status: "MODERATION" },
      include: {
        author: { select: { name: true } },
        seller: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (reviews.length === 0) {
    return <p className="py-12 text-center text-neutral-500">Нет отзывов на проверке</p>;
  }

  return (
    <div>
      <div className="space-y-3">
        {reviews.map((review) => (
          <div key={review.id} className="flex gap-3 rounded-2xl border border-neutral-200 p-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3.5 w-3.5 ${star <= review.rating ? "fill-amber-400 text-amber-400" : "text-neutral-200"}`}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                {review.author.name} → {review.seller.name} · {formatDate(review.createdAt)}
              </p>
              <p className="mt-2 text-sm text-neutral-700">{review.text}</p>
            </div>
            <ReviewModerationActions reviewId={review.id} />
          </div>
        ))}
      </div>
      <AdminPagination basePath="/admin/reviews" page={page} totalPages={totalPages} />
    </div>
  );
}
