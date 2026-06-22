export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { CategoryManager } from "./category-manager";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    include: {
      children: { include: { _count: { select: { listings: true } } }, orderBy: { order: "asc" } },
      _count: { select: { listings: true } },
    },
    where: { parentId: null },
    orderBy: { order: "asc" },
  });

  return <CategoryManager initialCategories={categories} />;
}
