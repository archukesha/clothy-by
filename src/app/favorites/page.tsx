export const dynamic = "force-dynamic";

import { getAuthUserFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ListingCard } from "@/components/listing-card";
import { Heart } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function FavoritesPage() {
  const user = await getAuthUserFromCookies();
  if (!user) redirect("/");

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    include: {
      listing: {
        include: {
          images: { orderBy: { order: "asc" }, take: 1 },
          brand: { select: { name: true, segment: true } },
          category: { select: { name: true } },
          user: { select: { name: true, avatar: true } },
          _count: { select: { favorites: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const activeListings = favorites
    .filter((f) => f.listing.status === "ACTIVE")
    .map((f) => ({
      ...f.listing,
      createdAt: f.listing.createdAt.toISOString(),
      promotedUntil: null,
    }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-6 flex items-center gap-2 text-xl font-bold">
        <Heart className="h-5 w-5" />
        Избранное
        {activeListings.length > 0 && (
          <span className="text-base font-normal text-neutral-400">{activeListings.length}</span>
        )}
      </h1>

      {activeListings.length === 0 ? (
        <div className="py-16 text-center">
          <Heart className="mx-auto mb-4 h-12 w-12 text-neutral-200" />
          <p className="mb-4 text-neutral-500">Здесь пока пусто</p>
          <Link href="/search">
            <Button>Смотреть объявления</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {activeListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} isFavorite />
          ))}
        </div>
      )}
    </div>
  );
}
