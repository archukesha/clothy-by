export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ListingCard } from "@/components/listing-card";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });

  if (!category) return { title: "Категория не найдена" };

  return {
    title: category.name,
    description: `${category.name} — брендовые вещи на Clothy.by. Покупай и продавай в Беларуси.`,
    openGraph: {
      title: `${category.name} | Clothy.by`,
      description: `${category.name} — брендовые вещи на Clothy.by.`,
    },
  };
}

const ITEMS_PER_PAGE = 20;

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1"));

  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      parent: true,
      children: {
        orderBy: { order: "asc" },
        include: {
          _count: { select: { listings: { where: { status: "ACTIVE" } } } },
        },
      },
    },
  });

  if (!category) notFound();

  const categoryIds = [category.id, ...category.children.map((c) => c.id)];

  const where = {
    status: "ACTIVE" as const,
    categoryId: { in: categoryIds },
  };

  const [listings, totalCount] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
        brand: { select: { name: true, segment: true } },
        category: { select: { name: true } },
        user: { select: { name: true, avatar: true } },
        _count: { select: { favorites: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }),
    prisma.listing.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const isParent = category.children.length > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-6 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="transition-colors hover:text-black">
          Главная
        </Link>
        <span>/</span>
        {category.parent && (
          <>
            <Link href={`/category/${category.parent.slug}`} className="transition-colors hover:text-black">
              {category.parent.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-black">{category.name}</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">{category.name}</h1>
        <p className="mt-1 text-sm text-neutral-500">{totalCount} объявлений</p>
      </div>

      {isParent && (
        <div className="mb-6 flex flex-wrap gap-2">
          {category.children.map((child) => (
            <Link key={child.id} href={`/category/${child.slug}`}>
              <Badge variant="default" className="cursor-pointer px-3 py-1.5 transition-colors hover:bg-neutral-200">
                {child.name}
                <span className="ml-1.5 text-neutral-400">{child._count.listings}</span>
              </Badge>
            </Link>
          ))}
        </div>
      )}

      {listings.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={{
                  ...listing,
                  createdAt: listing.createdAt.toISOString(),
                  promotedUntil: null,
                }}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              {page > 1 && (
                <Link
                  href={`/category/${slug}?page=${page - 1}`}
                  className="rounded-xl border border-neutral-200 px-4 py-2 text-sm transition-colors hover:bg-neutral-50"
                >
                  Назад
                </Link>
              )}
              <span className="text-sm text-neutral-500">
                {page} из {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/category/${slug}?page=${page + 1}`}
                  className="rounded-xl border border-neutral-200 px-4 py-2 text-sm transition-colors hover:bg-neutral-50"
                >
                  Далее
                </Link>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl bg-neutral-50 py-16 text-center">
          <Package className="mx-auto mb-3 h-12 w-12 text-neutral-300" />
          <p className="text-lg text-neutral-500">В этой категории пока нет объявлений</p>
          <p className="mt-1 text-sm text-neutral-400">
            Будьте первым —{" "}
            <Link href="/listings/new" className="text-black underline hover:no-underline">
              разместите объявление
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
