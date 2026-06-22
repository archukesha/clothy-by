import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Suggestion {
  type: "brand" | "category" | "listing";
  label: string;
  slug: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();

  if (q.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const [brands, categories, listings] = await Promise.all([
    prisma.$queryRaw<{ name: string; slug: string }[]>`
      SELECT name, slug FROM "Brand"
      WHERE name ILIKE ${"%" + q + "%"} OR similarity(name, ${q}) > 0.3
      ORDER BY similarity(name, ${q}) DESC
      LIMIT 5
    `,
    prisma.$queryRaw<{ name: string; slug: string }[]>`
      SELECT name, slug FROM "Category"
      WHERE name ILIKE ${"%" + q + "%"} OR similarity(name, ${q}) > 0.3
      ORDER BY similarity(name, ${q}) DESC
      LIMIT 5
    `,
    prisma.$queryRaw<{ title: string }[]>`
      SELECT title FROM "Listing"
      WHERE status = 'ACTIVE'
        AND (title ILIKE ${"%" + q + "%"} OR similarity(title, ${q}) > 0.25)
      ORDER BY similarity(title, ${q}) DESC
      LIMIT 5
    `,
  ]);

  const seenTitles = new Set<string>();
  const uniqueListings = listings.filter((l) => {
    if (seenTitles.has(l.title)) return false;
    seenTitles.add(l.title);
    return true;
  });

  const suggestions: Suggestion[] = [
    ...uniqueListings.map((l) => ({ type: "listing" as const, label: l.title, slug: l.title })),
    ...brands.map((b) => ({ type: "brand" as const, label: b.name, slug: b.slug })),
    ...categories.map((c) => ({ type: "category" as const, label: c.name, slug: c.slug })),
  ];

  return NextResponse.json({ suggestions });
}
