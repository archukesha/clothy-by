export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/listing-card";
import { MapPin, Package, Eye, ArrowLeft, Star } from "lucide-react";
import { ReviewsSection } from "./reviews-section";
import { ReportButton } from "@/components/report-button";
import { getAuthUserFromCookies } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";
import { ListingStatusBadge } from "@/components/listing-status-badge";
import { SellerBadges } from "@/components/seller-badges";
import { getSellerBadges, ADMIN_BADGE, MODERATOR_BADGE } from "@/lib/badges";

interface SellerPageProps {
  params: Promise<{ id: string }>;
}

export default async function SellerPage({ params }: SellerPageProps) {
  const { id } = await params;

  const authUser = await getAuthUserFromCookies();
  const isStaff = isAdminUser(authUser?.role);

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      listings: {
        where: isStaff ? undefined : { status: "ACTIVE" },
        include: {
          images: { orderBy: { order: "asc" }, take: 1 },
          brand: { select: { name: true, segment: true } },
          category: { select: { name: true } },
          user: { select: { name: true, avatar: true } },
          _count: { select: { favorites: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) notFound();

  const [ratingAgg, soldCount, activeCount] = await Promise.all([
    prisma.review.aggregate({
      where: { sellerId: id, status: "APPROVED" },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.listing.count({ where: { userId: id, status: "SOLD", conversations: { some: {} } } }),
    prisma.listing.count({ where: { userId: id, status: "ACTIVE" } }),
  ]);

  const badges = getSellerBadges({
    createdAt: user.createdAt,
    soldCount,
    activeCount,
    avgRating: ratingAgg._avg.rating,
    reviewCount: ratingAgg._count,
  });

  if (user.role === "ADMIN") badges.unshift(ADMIN_BADGE);
  else if (user.role === "MODERATOR") badges.unshift(MODERATOR_BADGE);

  const totalViews = user.listings.reduce((sum, listing) => sum + listing.views, 0);

  const listings = user.listings.map((listing) => ({
    ...listing,
    createdAt: listing.createdAt.toISOString(),
    promotedUntil: null,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12">
      <div className="flex items-center justify-between py-4">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-black">
          <ArrowLeft className="h-4 w-4" />
          Назад
        </Link>
        <ReportButton targetType="USER" targetUserId={user.id} />
      </div>

      <div className="relative mb-16">
        <div className="h-32 overflow-hidden rounded-b-2xl bg-neutral-100">
          {user.banner ? (
            <img src={user.banner} alt={`${user.name} banner`} className="h-full w-full object-cover" />
          ) : null}
        </div>

        <div className="absolute left-4 -bottom-10 h-20 w-20 overflow-hidden rounded-full bg-neutral-200 ring-4 ring-white shadow-sm">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-neutral-500">
              {user.name[0].toUpperCase()}
            </div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <h1 className="break-words text-2xl font-bold">{user.name}</h1>
        {badges.length > 0 && (
          <div className="mt-2">
            <SellerBadges badges={badges} />
          </div>
        )}
        {user.city ? (
          <p className="mt-1 flex items-center gap-1 break-words text-sm text-neutral-500">
            <MapPin className="h-4 w-4 shrink-0" />
            {user.city}
          </p>
        ) : null}
        {user.bio ? <p className="mt-3 max-w-2xl break-words text-sm leading-relaxed text-neutral-600">{user.bio}</p> : null}
      </div>

      <div className="mb-8 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-neutral-50 p-4">
          <div className="mb-1 flex items-center gap-2">
            <Package className="h-4 w-4 text-neutral-400" />
            <span className="text-xs text-neutral-500">{isStaff ? "Объявлений" : "Активных"}</span>
          </div>
          <p className="text-2xl font-bold">{user.listings.length}</p>
        </div>
        <div className="rounded-2xl bg-neutral-50 p-4">
          <div className="mb-1 flex items-center gap-2">
            <Eye className="h-4 w-4 text-neutral-400" />
            <span className="text-xs text-neutral-500">Просмотров</span>
          </div>
          <p className="text-2xl font-bold">{totalViews}</p>
        </div>
        <div className="rounded-2xl bg-neutral-50 p-4">
          <div className="mb-1 flex items-center gap-2">
            <Star className="h-4 w-4 text-neutral-400" />
            <span className="text-xs text-neutral-500">Рейтинг</span>
          </div>
          <p className="text-2xl font-bold">
            {ratingAgg._count > 0 ? ratingAgg._avg.rating!.toFixed(1) : "—"}
          </p>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Объявления продавца</h2>
      </div>

      {listings.length === 0 ? (
        <div className="rounded-2xl bg-neutral-50 px-6 py-16 text-center">
          <p className="mb-4 text-neutral-500">У продавца пока нет активных объявлений</p>
          <Link href="/search">
            <Button>Смотреть все объявления</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {listings.map((listing) => (
            <div key={listing.id} className="relative">
              <ListingCard listing={listing} />
              {isStaff && listing.status !== "ACTIVE" && (
                <div className="absolute top-2 left-2 z-10">
                  <ListingStatusBadge status={listing.status} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 border-t border-neutral-100 pt-8">
        <h2 className="mb-4 text-lg font-semibold">Отзывы</h2>
        <ReviewsSection sellerId={user.id} />
      </div>
    </div>
  );
}
