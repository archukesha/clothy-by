export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { BRAND_SEGMENT_LABELS } from "@/lib/constants";

const SEGMENT_ORDER = ["LUXURY", "PREMIUM", "STREETWEAR", "SPORT", "MASS_MARKET"];

export default async function BrandsPage() {
  const brands = await prisma.brand.findMany({
    include: {
      _count: { select: { listings: { where: { status: "ACTIVE" } } } },
    },
    orderBy: { name: "asc" },
  });

  const grouped = SEGMENT_ORDER.map((segment) => ({
    segment,
    label: BRAND_SEGMENT_LABELS[segment] || segment,
    brands: brands.filter((b) => b.segment === segment),
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">Бренды</h1>
      <p className="mb-8 text-sm text-neutral-500">{brands.length} брендов на платформе</p>

      <div className="space-y-10">
        {grouped.map((group) => (
          <section key={group.segment}>
            <div className="mb-4 flex items-center gap-3">
              <h2 className="text-lg font-semibold">{group.label}</h2>
              <Badge
                variant={group.segment === "LUXURY" ? "luxury" : group.segment === "PREMIUM" ? "premium" : "default"}
              >
                {group.brands.length}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {group.brands.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/search?brand=${brand.slug}`}
                  className="group flex items-center justify-between rounded-xl border border-neutral-100 bg-white p-4 transition-all hover:border-neutral-300 hover:shadow-sm"
                >
                  <span className="truncate text-sm font-medium text-neutral-700 group-hover:text-black">{brand.name}</span>
                  {brand._count.listings > 0 && <span className="ml-2 shrink-0 text-xs text-neutral-400">{brand._count.listings}</span>}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
