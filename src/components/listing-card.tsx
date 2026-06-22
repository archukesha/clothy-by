"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Heart, MapPin } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { DeliveryBadges } from "@/components/delivery-badges";
import { CONDITION_LABELS } from "@/lib/constants";
import { useTelegram } from "@/context/telegram";

interface ListingCardProps {
  listing: {
    id: string;
    title: string;
    price: number;
    originalPrice?: number | null;
    currency: string;
    condition: string;
    city: string;
    createdAt: string | Date;
    promotedUntil?: string | Date | null;
    images: { url: string }[];
    brand: { name: string; segment: string };
    category: { name: string };
    user: { name: string; avatar?: string | null };
    _count?: { favorites: number };
    delivery?: string;
  };
  isFavorite?: boolean;
}

export function ListingCard({ listing, isFavorite: initialFav = false }: ListingCardProps) {
  const router = useRouter();
  const { token } = useTelegram();
  const [isFav, setIsFav] = useState(initialFav);
  const [animating, setAnimating] = useState(false);

  const discount =
    listing.originalPrice && listing.originalPrice > listing.price
      ? Math.round((1 - listing.price / listing.originalPrice) * 100)
      : null;

  const segmentVariant =
    listing.brand.segment === "LUXURY"
      ? "luxury"
      : listing.brand.segment === "PREMIUM"
        ? "premium"
        : "default";

  async function handleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    try {
      const res = await fetch(`/api/listings/${listing.id}/favorite`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.status === 401) {
        router.push("/favorites");
        return;
      }

      if (res.ok) {
        setIsFav(!isFav);
        setAnimating(true);
        setTimeout(() => setAnimating(false), 300);
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className="group relative animate-in fade-in overflow-hidden rounded-2xl bg-white transition-all duration-200">
      <Link href={`/listings/${listing.id}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-100">
          {listing.images[0] ? (
            <Image
              src={listing.images[0].url}
              alt={listing.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-neutral-300">
              нет фото
            </div>
          )}

          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {discount && <Badge variant="danger">-{discount}%</Badge>}
          </div>
        </div>
      </Link>

      <button
        onClick={handleFavorite}
        className="absolute top-2 right-2 rounded-full bg-white/90 p-2 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:shadow active:scale-90"
        aria-label={isFav ? "Убрать из избранного" : "Добавить в избранное"}
      >
        <Heart
          className={`h-4 w-4 transition-all ${
            isFav ? "fill-red-500 text-red-500" : "text-neutral-400 hover:text-red-400"
          } ${animating ? "scale-125" : "scale-100"}`}
        />
      </button>

      <div className="pt-3 pb-1">
        <div className="mb-1 flex min-w-0 items-baseline gap-2">
          <span className="min-w-0 truncate text-base font-bold text-neutral-900">
            {formatPrice(listing.price, listing.currency)}
          </span>
          {listing.originalPrice && listing.originalPrice > listing.price && (
            <span className="shrink-0 truncate text-xs text-neutral-400 line-through">
              {formatPrice(listing.originalPrice, listing.currency)}
            </span>
          )}
        </div>

        <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
          {listing.brand.name}
          {segmentVariant === "luxury" && (
            <span className="ml-1.5 normal-case tracking-normal text-purple-600">· Люкс</span>
          )}
        </p>

        <Link href={`/listings/${listing.id}`}>
          <h3 className="mb-1.5 line-clamp-1 text-sm leading-snug text-neutral-900 underline-offset-2 hover:underline">
            {listing.title}
          </h3>
        </Link>

        <div className="flex items-center gap-1 text-[11px] text-neutral-400">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{listing.city}</span>
        </div>
        <p className="mt-0.5 text-[11px] text-neutral-400">
          {CONDITION_LABELS[listing.condition] || listing.condition}
        </p>

        {listing.delivery &&
          (() => {
            try {
              const d = JSON.parse(listing.delivery);
              return d.length > 0 ? (
                <div className="mt-1.5">
                  <DeliveryBadges delivery={d} />
                </div>
              ) : null;
            } catch {
              return null;
            }
          })()}
      </div>
    </div>
  );
}
