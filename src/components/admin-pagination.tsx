import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AdminPaginationProps {
  basePath: string;
  page: number;
  totalPages: number;
  extraParams?: Record<string, string | undefined>;
}

function buildHref(basePath: string, page: number, extraParams?: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(extraParams || {})) {
    if (value) params.set(key, value);
  }
  params.set("page", String(page));
  return `${basePath}?${params.toString()}`;
}

export function AdminPagination({ basePath, page, totalPages, extraParams }: AdminPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      {page > 1 ? (
        <Link
          href={buildHref(basePath, page - 1, extraParams)}
          className="flex items-center gap-1 rounded-xl border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-50"
        >
          <ChevronLeft className="h-4 w-4" /> Назад
        </Link>
      ) : (
        <span className="flex items-center gap-1 rounded-xl border border-neutral-100 px-3 py-1.5 text-sm text-neutral-300">
          <ChevronLeft className="h-4 w-4" /> Назад
        </span>
      )}

      <span className="text-sm text-neutral-500">
        {page} из {totalPages}
      </span>

      {page < totalPages ? (
        <Link
          href={buildHref(basePath, page + 1, extraParams)}
          className="flex items-center gap-1 rounded-xl border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-50"
        >
          Вперёд <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className="flex items-center gap-1 rounded-xl border border-neutral-100 px-3 py-1.5 text-sm text-neutral-300">
          Вперёд <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </div>
  );
}
