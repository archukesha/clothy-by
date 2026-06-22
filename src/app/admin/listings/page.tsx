export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDate } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import { ListingModerationActions } from "./listing-moderation-actions";
import { AdminPagination } from "@/components/admin-pagination";

const PAGE_SIZE = 20;

interface AdminListingsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function AdminListingsPage({ searchParams }: AdminListingsPageProps) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);

  const [total, listings] = await Promise.all([
    prisma.listing.count({ where: { status: "MODERATION" } }),
    prisma.listing.findMany({
      where: { status: "MODERATION" },
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
        brand: { select: { name: true } },
        category: { select: { name: true } },
        user: { select: { id: true, name: true, telegramId: true } },
      },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (listings.length === 0) {
    return <p className="py-12 text-center text-neutral-500">Нет объявлений на проверке</p>;
  }

  return (
    <div>
      <div className="space-y-3">
        {listings.map((listing) => (
          <div key={listing.id} className="flex gap-3 rounded-2xl border border-neutral-200 p-3">
            <Link href={`/listings/${listing.id}`} target="_blank" className="shrink-0">
              {listing.images[0] ? (
                <img
                  src={listing.images[0].url}
                  alt=""
                  className="h-20 w-20 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-neutral-100 text-[10px] text-neutral-400">
                  нет фото
                </div>
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={`/listings/${listing.id}`}
                target="_blank"
                className="inline-flex items-center gap-1 text-sm font-semibold hover:underline"
              >
                {listing.brand.name} — {listing.title}
                <ExternalLink className="h-3 w-3 shrink-0 text-neutral-400" />
              </Link>
              <p className="text-xs text-neutral-500">
                {formatPrice(listing.price, listing.currency)} · {listing.category.name} · {listing.city}
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                {listing.user.name} · {formatDate(listing.createdAt)}
              </p>
              <p className="mt-2 line-clamp-2 text-xs text-neutral-600">{listing.description}</p>
            </div>
            <ListingModerationActions listingId={listing.id} />
          </div>
        ))}
      </div>
      <AdminPagination basePath="/admin/listings" page={page} totalPages={totalPages} />
    </div>
  );
}
