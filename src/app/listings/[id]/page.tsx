export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromCookies } from "@/lib/auth";
import { notFound } from "next/navigation";
import { formatPrice, formatDate } from "@/lib/utils";
import { CONDITION_LABELS, GENDER_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { MapPin, Eye, Clock, Heart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ListingActions } from "./listing-actions";
import { ImageGallery } from "@/components/image-gallery";
import { ListingCard } from "@/components/listing-card";
import { DeliveryBadges } from "@/components/delivery-badges";
import { ViewCounter } from "./view-counter";
import { SellerBadges } from "@/components/seller-badges";
import { getSellerBadges } from "@/lib/badges";

interface ListingPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { images: { orderBy: { order: "asc" }, take: 1 }, brand: true },
  });

  if (!listing) return { title: "Объявление не найдено" };

  return {
    title: `${listing.brand.name} — ${listing.title}`,
    description: listing.description.slice(0, 160),
  };
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      images: { orderBy: { order: "asc" } },
      brand: true,
      category: { include: { parent: true } },
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
          banner: true,
          bio: true,
          city: true,
          createdAt: true,
          _count: { select: { listings: true } },
        },
      },
      _count: { select: { favorites: true } },
    },
  });

  const authUser = await getAuthUserFromCookies();
  const isOwner = authUser?.id === listing?.userId;
  const isStaff = authUser?.role === "ADMIN" || authUser?.role === "MODERATOR";

  if (!listing) notFound();
  if (!isOwner && !isStaff && listing.status !== "ACTIVE" && listing.status !== "SOLD") notFound();

  let isFavorite = false;
  if (authUser) {
    const fav = await prisma.favorite.findUnique({
      where: { userId_listingId: { userId: authUser.id, listingId: id } },
    });
    isFavorite = !!fav;
  }

  const segmentVariant =
    listing.brand.segment === "LUXURY"
      ? "luxury"
      : listing.brand.segment === "PREMIUM"
        ? "premium"
        : "default";

  const discount =
    listing.originalPrice && listing.originalPrice > listing.price
      ? Math.round((1 - listing.price / listing.originalPrice) * 100)
      : null;

  let deliveryMethods: string[] = [];
  try {
    const parsed = JSON.parse(listing.delivery || "[]");
    if (Array.isArray(parsed)) deliveryMethods = parsed;
  } catch {}

  const [sellerRatingAgg, sellerSoldCount, sellerActiveCount] = await Promise.all([
    prisma.review.aggregate({
      where: { sellerId: listing.user.id, status: "APPROVED" },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.listing.count({ where: { userId: listing.user.id, status: "SOLD", conversations: { some: {} } } }),
    prisma.listing.count({ where: { userId: listing.user.id, status: "ACTIVE" } }),
  ]);

  const sellerBadges = getSellerBadges({
    createdAt: listing.user.createdAt,
    soldCount: sellerSoldCount,
    activeCount: sellerActiveCount,
    avgRating: sellerRatingAgg._avg.rating,
    reviewCount: sellerRatingAgg._count,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-4">
      <nav className="mb-4 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-black">Главная</Link>
        <span>/</span>
        {listing.category.parent && (
          <>
            <Link href={`/category/${listing.category.parent.slug}`} className="hover:text-black">
              {listing.category.parent.name}
            </Link>
            <span>/</span>
          </>
        )}
        <Link href={`/category/${listing.category.slug}`} className="hover:text-black">
          {listing.category.name}
        </Link>
      </nav>

      <div className="grid items-start gap-6 lg:grid-cols-2 lg:gap-10">
        <ImageGallery images={listing.images} title={listing.title} status={listing.status} />

        <div className="space-y-5 lg:sticky lg:top-4">
          <div className="flex min-w-0 flex-wrap items-baseline gap-3">
            <span className="min-w-0 break-all text-3xl font-bold">{formatPrice(listing.price, listing.currency)}</span>
            {listing.originalPrice && listing.originalPrice > listing.price && (
              <>
                <span className="min-w-0 break-all text-lg text-neutral-400 line-through">{formatPrice(listing.originalPrice, listing.currency)}</span>
                <Badge variant="danger">-{discount}%</Badge>
              </>
            )}
          </div>

          <div>
            <h1 className="break-words text-xl font-bold leading-snug">{listing.title}</h1>
            <Badge variant={segmentVariant} className="mt-2">{listing.brand.name}</Badge>
          </div>

          <ListingActions
            listingId={listing.id}
            isOwner={isOwner}
            isFavorite={isFavorite}
            isLoggedIn={!!authUser}
            sellerId={listing.userId}
            status={listing.status}
            promotedUntil={null}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-neutral-50 p-3">
              <p className="text-xs text-neutral-400">Состояние</p>
              <p className="text-sm font-medium">{CONDITION_LABELS[listing.condition]}</p>
            </div>
            <div className="rounded-xl bg-neutral-50 p-3">
              <p className="text-xs text-neutral-400">Для кого</p>
              <p className="text-sm font-medium">{GENDER_LABELS[listing.gender]}</p>
            </div>
            {listing.size && (
              <div className="rounded-xl bg-neutral-50 p-3">
                <p className="text-xs text-neutral-400">Размер</p>
                <p className="text-sm font-medium">{listing.size}</p>
              </div>
            )}
            {listing.color && (
              <div className="rounded-xl bg-neutral-50 p-3">
                <p className="text-xs text-neutral-400">Цвет</p>
                <p className="text-sm font-medium">{listing.color}</p>
              </div>
            )}
            {listing.quantity > 1 && (
              <div className="rounded-xl bg-neutral-50 p-3">
                <p className="text-xs text-neutral-400">В наличии</p>
                <p className="text-sm font-medium">{listing.quantity} шт</p>
              </div>
            )}
          </div>

          {deliveryMethods.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold">Доставка</h2>
              <DeliveryBadges delivery={deliveryMethods} size="md" />
            </div>
          )}

          <div>
            <h2 className="mb-2 text-sm font-semibold">Описание</h2>
            <p className="whitespace-pre-line break-words text-sm leading-relaxed text-neutral-600">{listing.description}</p>
          </div>

          <div className="flex flex-wrap gap-4 border-t border-neutral-100 pt-2 text-xs text-neutral-400">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {listing.city}</span>
            <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {listing.views} просмотров</span>
            <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {listing._count.favorites} в избранном</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDate(listing.createdAt)}</span>
          </div>

          {!isOwner && <ViewCounter listingId={listing.id} />}

          <Link href={`/sellers/${listing.user.id}`} className="block rounded-2xl bg-neutral-50 p-4 transition-colors hover:bg-neutral-100">
            <h2 className="mb-3 text-sm font-semibold">Продавец</h2>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-neutral-200 text-sm font-bold">
                {listing.user.avatar ? (
                  <Image src={listing.user.avatar} alt={listing.user.name} width={40} height={40} className="rounded-full object-cover" />
                ) : (
                  listing.user.name[0].toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <p className="break-words text-sm font-medium">{listing.user.name}</p>
                <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-neutral-400">
                  <span className="shrink-0">{listing.user._count.listings} объявлений</span>
                  {listing.user.city && <span className="min-w-0 truncate">{listing.user.city}</span>}
                </div>
              </div>
            </div>
            {sellerBadges.length > 0 && (
              <div className="mt-3">
                <SellerBadges badges={sellerBadges} />
              </div>
            )}
          </Link>
        </div>
      </div>

      <SimilarListings listingId={listing.id} brandId={listing.brandId} categoryId={listing.categoryId} />
    </div>
  );
}

async function SimilarListings({ listingId, brandId, categoryId }: { listingId: string; brandId: string; categoryId: string }) {
  const similar = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      id: { not: listingId },
      OR: [{ brandId }, { categoryId }],
    },
    include: {
      images: { orderBy: { order: "asc" }, take: 1 },
      brand: { select: { name: true, segment: true } },
      category: { select: { name: true } },
      user: { select: { name: true, avatar: true } },
      _count: { select: { favorites: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  if (similar.length === 0) return null;

  return (
    <div className="mt-10 border-t border-neutral-100 pt-8">
      <h2 className="mb-4 text-lg font-semibold">Похожие</h2>
      <div className="grid grid-cols-2 gap-4">
        {similar.map((item) => (
          <ListingCard
            key={item.id}
            listing={{
              ...item,
              createdAt: item.createdAt.toISOString(),
              promotedUntil: null,
            }}
          />
        ))}
      </div>
    </div>
  );
}
