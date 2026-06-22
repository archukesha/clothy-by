export const dynamic = "force-dynamic";

import { getAuthUserFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Package, Eye, ShoppingBag, Settings, ShieldCheck } from "lucide-react";
import { ProfileTabs } from "./profile-tabs";
import { ProfileEditor } from "./profile-editor";
import { SellerBadges } from "@/components/seller-badges";
import { getSellerBadges, ADMIN_BADGE, MODERATOR_BADGE } from "@/lib/badges";

export default async function ProfilePage() {
  const authUser = await getAuthUserFromCookies();
  if (!authUser) redirect("/");

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    include: {
      listings: {
        include: {
          images: { orderBy: { order: "asc" }, take: 1 },
          brand: { select: { name: true, segment: true } },
          category: { select: { name: true } },
          user: { select: { name: true, avatar: true } },
          _count: { select: { favorites: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: {
          listings: true,
          favorites: true,
        },
      },
    },
  });

  if (!user) redirect("/");

  const isStaff = authUser.role === "ADMIN" || authUser.role === "MODERATOR";
  const pendingModerationCount = isStaff
    ? (
        await Promise.all([
          prisma.listing.count({ where: { status: "MODERATION" } }),
          prisma.review.count({ where: { status: "MODERATION" } }),
          prisma.report.count({ where: { status: "PENDING" } }),
        ])
      ).reduce((sum, n) => sum + n, 0)
    : 0;

  const counts = {
    active: user.listings.filter((l) => l.status === "ACTIVE").length,
    moderation: user.listings.filter((l) => l.status === "MODERATION").length,
    rejected: user.listings.filter((l) => l.status === "REJECTED").length,
    sold: user.listings.filter((l) => l.status === "SOLD").length,
    archived: user.listings.filter((l) => l.status === "ARCHIVED" || l.status === "DRAFT").length,
  };

  const totalViews = user.listings.reduce((sum, l) => sum + l.views, 0);

  const [ratingAgg, verifiedSoldCount] = await Promise.all([
    prisma.review.aggregate({
      where: { sellerId: user.id, status: "APPROVED" },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.listing.count({
      where: { userId: user.id, status: "SOLD", conversations: { some: {} } },
    }),
  ]);

  const badges = getSellerBadges({
    createdAt: user.createdAt,
    soldCount: verifiedSoldCount,
    activeCount: counts.active,
    avgRating: ratingAgg._avg.rating,
    reviewCount: ratingAgg._count,
  });

  if (authUser.role === "ADMIN") badges.unshift(ADMIN_BADGE);
  else if (authUser.role === "MODERATOR") badges.unshift(MODERATOR_BADGE);

  const serializedListings = user.listings.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
    promotedUntil: null,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12">
      <div className="relative mb-16">
        <div className="h-32 overflow-hidden rounded-b-2xl bg-neutral-100">
          {user.banner ? (
            <img src={user.banner} alt={`${user.name} banner`} className="h-full w-full object-cover" />
          ) : null}
        </div>

        <ProfileEditor avatar={user.avatar} banner={user.banner ?? null} />

        <div className="absolute left-4 -bottom-10 h-20 w-20 overflow-hidden rounded-full bg-neutral-200 ring-4 ring-white shadow-sm">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-neutral-500">
              {user.name[0].toUpperCase()}
            </div>
          )}
        </div>

        <div className="absolute right-4 bottom-4">
          <Link href="/listings/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Продать
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-6 px-0">
        <div className="flex items-start justify-between gap-2">
          <h1 className="min-w-0 break-words text-xl font-bold">{user.name}</h1>
          <div className="flex shrink-0 gap-1">
            {isStaff && (
              <Link href="/admin" className="relative">
                <Button variant="ghost" size="sm" aria-label="Админка">
                  <ShieldCheck className="h-4 w-4" />
                </Button>
                {pendingModerationCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                    {pendingModerationCount > 99 ? "99+" : pendingModerationCount}
                  </span>
                )}
              </Link>
            )}
            <Link href="/profile/settings">
              <Button variant="ghost" size="sm" aria-label="Настройки профиля">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
        {badges.length > 0 && (
          <div className="mt-2">
            <SellerBadges badges={badges} />
          </div>
        )}
        {user.city && <p className="mt-0.5 break-words text-sm text-neutral-500">{user.city}</p>}
        {user.bio && <p className="mt-2 break-words text-sm leading-relaxed text-neutral-600">{user.bio}</p>}
      </div>

      <div className="mb-8 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-neutral-50 p-4">
          <div className="mb-1 flex items-center gap-2">
            <Package className="h-4 w-4 text-neutral-400" />
            <span className="text-xs text-neutral-500">Активных</span>
          </div>
          <p className="text-2xl font-bold">{counts.active}</p>
        </div>
        <div className="rounded-2xl bg-neutral-50 p-4">
          <div className="mb-1 flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-neutral-400" />
            <span className="text-xs text-neutral-500">Продано</span>
          </div>
          <p className="text-2xl font-bold">{counts.sold}</p>
        </div>
        <div className="rounded-2xl bg-neutral-50 p-4">
          <div className="mb-1 flex items-center gap-2">
            <Eye className="h-4 w-4 text-neutral-400" />
            <span className="text-xs text-neutral-500">Просмотров</span>
          </div>
          <p className="text-2xl font-bold">{totalViews}</p>
        </div>
      </div>

      <ProfileTabs listings={serializedListings} counts={counts} />

      <div className="mt-8 text-center">
        <Link href="/rules" className="text-xs text-neutral-400 hover:text-neutral-600 hover:underline">
          Правила платформы
        </Link>
      </div>
    </div>
  );
}
