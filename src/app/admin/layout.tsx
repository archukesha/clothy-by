import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  const [pendingListings, pendingReviews, pendingReports] = await Promise.all([
    prisma.listing.count({ where: { status: "MODERATION" } }),
    prisma.review.count({ where: { status: "MODERATION" } }),
    prisma.report.count({ where: { status: "PENDING" } }),
  ]);

  const TABS = [
    { href: "/admin", label: "Обзор", count: 0 },
    { href: "/admin/listings", label: "Объявления", count: pendingListings },
    { href: "/admin/reviews", label: "Отзывы", count: pendingReviews },
    { href: "/admin/reports", label: "Жалобы", count: pendingReports },
    { href: "/admin/users", label: "Пользователи", count: 0 },
    { href: "/admin/brands", label: "Бренды", count: 0 },
    { href: "/admin/categories", label: "Категории", count: 0 },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-4 text-xl font-bold">Админка</h1>
      <div className="-mx-4 mb-6 flex gap-1 overflow-x-auto border-b border-neutral-200 px-4">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-3 py-3 text-sm font-medium text-neutral-500 transition-colors hover:text-black"
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                {tab.count > 99 ? "99+" : tab.count}
              </span>
            )}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
