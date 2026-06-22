export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { BrandManager } from "./brand-manager";

export default async function AdminBrandsPage() {
  const brands = await prisma.brand.findMany({
    include: { _count: { select: { listings: true } } },
    orderBy: { name: "asc" },
  });

  return <BrandManager initialBrands={brands} />;
}
