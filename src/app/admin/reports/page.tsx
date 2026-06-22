export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import { ReportModerationActions } from "./report-moderation-actions";
import { AdminPagination } from "@/components/admin-pagination";

const PAGE_SIZE = 20;

const REASON_LABELS: Record<string, string> = {
  SPAM: "Спам / реклама",
  FRAUD: "Мошенничество",
  PROHIBITED: "Запрещённый товар",
  OFFENSIVE: "Оскорбительное поведение",
  FAKE: "Подделка / не соответствует описанию",
  OTHER: "Другое",
};

interface AdminReportsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function AdminReportsPage({ searchParams }: AdminReportsPageProps) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);

  const [total, reports] = await Promise.all([
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.report.findMany({
      where: { status: "PENDING" },
      include: {
        reporter: { select: { id: true, name: true } },
        listing: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            images: { take: 1, orderBy: { order: "asc" } },
            user: { select: { id: true, name: true } },
          },
        },
        targetUser: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (reports.length === 0) {
    return <p className="py-12 text-center text-neutral-500">Нет открытых жалоб</p>;
  }

  return (
    <div>
      <div className="space-y-3">
        {reports.map((report) => {
          const offenderId = report.listing?.user.id ?? report.targetUser?.id;
          const offenderName = report.listing?.user.name ?? report.targetUser?.name ?? "—";

          return (
            <div key={report.id} className="flex gap-3 rounded-2xl border border-neutral-200 p-3">
              {report.listing?.images[0] && (
                <Link href={`/listings/${report.listing.id}`} target="_blank" className="shrink-0">
                  <img
                    src={report.listing.images[0].url}
                    alt=""
                    className="h-20 w-20 rounded-xl object-cover"
                  />
                </Link>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{REASON_LABELS[report.reason] || report.reason}</p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  От {report.reporter.name} · {formatDate(report.createdAt)}
                </p>

                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {report.listing ? (
                    <Link
                      href={`/listings/${report.listing.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-200"
                    >
                      <ExternalLink className="h-3 w-3" /> Объявление «{report.listing.title}»
                    </Link>
                  ) : null}
                  {offenderId ? (
                    <Link
                      href={`/sellers/${offenderId}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-200"
                    >
                      <ExternalLink className="h-3 w-3" /> Профиль: {offenderName}
                    </Link>
                  ) : null}
                </div>

                {report.listing && (
                  <p className="mt-2 line-clamp-2 text-xs text-neutral-500">{report.listing.description}</p>
                )}
                {report.comment && (
                  <p className="mt-2 text-sm text-neutral-700">
                    <span className="text-neutral-400">Комментарий автора жалобы: </span>
                    {report.comment}
                  </p>
                )}
              </div>
              <ReportModerationActions reportId={report.id} targetType={report.targetType} />
            </div>
          );
        })}
      </div>
      <AdminPagination basePath="/admin/reports" page={page} totalPages={totalPages} />
    </div>
  );
}
