export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { UserBanToggle } from "./user-ban-toggle";
import { AdminPagination } from "@/components/admin-pagination";

const PAGE_SIZE = 30;

interface AdminUsersPageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const { q, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
  const where = q ? { name: { contains: q, mode: "insensitive" as const } } : undefined;

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        telegramId: true,
        role: true,
        banned: true,
        createdAt: true,
        _count: { select: { listings: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <form className="flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Поиск по имени..."
          className="w-full max-w-xs rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black"
        />
        <button type="submit" className="rounded-xl bg-neutral-100 px-4 py-2 text-sm font-medium hover:bg-neutral-200">
          Найти
        </button>
      </form>

      <div className="space-y-2">
        {users.map((user) => (
          <div key={user.id} className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 p-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-medium">
                {user.name}
                {user.role !== "USER" && (
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-500">{user.role}</span>
                )}
                {user.banned && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] text-red-700">Заблокирован</span>
                )}
              </p>
              <p className="text-xs text-neutral-400">
                {user._count.listings} объявлений · с {formatDate(user.createdAt)}
                {user.telegramId ? ` · id ${user.telegramId}` : ""}
              </p>
            </div>
            <UserBanToggle userId={user.id} banned={user.banned} disabled={user.role === "ADMIN"} />
          </div>
        ))}
      </div>

      <AdminPagination basePath="/admin/users" page={page} totalPages={totalPages} extraParams={{ q }} />
    </div>
  );
}
