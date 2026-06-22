export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Package, Star, Flag, Users } from "lucide-react";

export default async function AdminDashboard() {
  const [pendingListings, pendingReviews, pendingReports, bannedUsers, totalUsers, totalListings] =
    await Promise.all([
      prisma.listing.count({ where: { status: "MODERATION" } }),
      prisma.review.count({ where: { status: "MODERATION" } }),
      prisma.report.count({ where: { status: "PENDING" } }),
      prisma.user.count({ where: { banned: true } }),
      prisma.user.count(),
      prisma.listing.count(),
    ]);

  const cards = [
    { href: "/admin/listings", label: "Объявления на проверке", value: pendingListings, icon: Package, highlight: pendingListings > 0 },
    { href: "/admin/reviews", label: "Отзывы на проверке", value: pendingReviews, icon: Star, highlight: pendingReviews > 0 },
    { href: "/admin/reports", label: "Открытые жалобы", value: pendingReports, icon: Flag, highlight: pendingReports > 0 },
    { href: "/admin/users", label: "Заблокировано пользователей", value: bannedUsers, icon: Users, highlight: false },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`rounded-2xl border p-4 transition-colors ${
              card.highlight ? "border-amber-200 bg-amber-50 hover:bg-amber-100" : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100"
            }`}
          >
            <div className="mb-1 flex items-center gap-2">
              <card.icon className="h-4 w-4 text-neutral-400" />
              <span className="text-xs text-neutral-500">{card.label}</span>
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
          </Link>
        ))}
      </div>

      <div className="text-sm text-neutral-500">
        Всего пользователей: {totalUsers} · Всего объявлений: {totalListings}
      </div>
    </div>
  );
}
