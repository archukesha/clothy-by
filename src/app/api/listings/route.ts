import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { sendModerationRequest } from "@/lib/bot";
import { createListingSchema } from "@/lib/listing-schema";
import { LISTINGS_PER_PAGE } from "@/lib/constants";
import { Prisma } from "@prisma/client";
import type { BrandSegment, Gender, Condition } from "@prisma/client";

const SEARCH_MATCH_CAP = 1000;

const MAX_LISTINGS_PER_DAY = 15;

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  if (user.role !== "ADMIN" && user.role !== "MODERATOR") {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await prisma.listing.count({
      where: { userId: user.id, createdAt: { gte: since } },
    });

    if (recentCount >= MAX_LISTINGS_PER_DAY) {
      return NextResponse.json(
        {
          error: `Можно создавать не более ${MAX_LISTINGS_PER_DAY} объявлений в сутки. Попробуйте позже.`,
        },
        { status: 429 }
      );
    }
  }

  try {
    const body = await request.json();
    const parsed = createListingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { images, ...data } = parsed.data;

    const listing = await prisma.listing.create({
      data: {
        ...data,
        status: "MODERATION",
        userId: user.id,
        images: {
          create: images.map((url, i) => ({ url, order: i })),
        },
      },
      include: {
        images: true,
        brand: true,
        category: true,
        user: { select: { name: true, telegramId: true } },
      },
    });

    // Fire-and-forget — не блокируем ответ
    sendModerationRequest(listing).catch(console.error);

    return NextResponse.json(listing, { status: 201 });
  } catch (err) {
    console.error("Create listing error:", err);
    return NextResponse.json(
      { error: "Ошибка при создании объявления" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get("page") || "1");
  const category = searchParams.get("category");
  const brand = searchParams.get("brand");
  const gender = searchParams.get("gender");
  const condition = searchParams.get("condition");
  const city = searchParams.get("city");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const q = searchParams.get("q");
  const sort = searchParams.get("sort") || "newest";
  const segment = searchParams.get("segment");
  const size = searchParams.get("size");
  const delivery = searchParams.get("delivery");

  const where: Record<string, unknown> = { status: "ACTIVE" };

  if (category) {
    const cat = await prisma.category.findUnique({
      where: { slug: category },
      include: { children: true },
    });
    if (cat) {
      const catIds = [cat.id, ...cat.children.map((c) => c.id)];
      where.categoryId = { in: catIds };
    }
  }

  if (brand) {
    const brandObj = await prisma.brand.findUnique({ where: { slug: brand } });
    if (brandObj) where.brandId = brandObj.id;
  }

  if (segment) {
    const segmentBrands = await prisma.brand.findMany({
      where: { segment: segment as BrandSegment },
      select: { id: true },
    });
    where.brandId = { in: segmentBrands.map((b) => b.id) };
  }

  if (gender) where.gender = gender as Gender;
  if (condition) where.condition = condition as Condition;
  if (city) where.city = city;
  if (size) where.size = size;
  if (delivery) where.delivery = { contains: delivery };

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) (where.price as Record<string, unknown>).gte = parseFloat(minPrice);
    if (maxPrice) (where.price as Record<string, unknown>).lte = parseFloat(maxPrice);
  }

  // Fuzzy, typo-tolerant search across title/description/brand/category using
  // pg_trgm. Matched ids (ranked by relevance) are intersected with the
  // regular filters above so search composes with the rest of the UI.
  let relevanceRank: Map<string, number> | null = null;

  if (q) {
    const sqlConditions: Prisma.Sql[] = [Prisma.sql`l.status = 'ACTIVE'`];

    if (where.categoryId) {
      const catFilter = where.categoryId as { in: string[] };
      sqlConditions.push(Prisma.sql`l."categoryId" IN (${Prisma.join(catFilter.in)})`);
    }
    if (typeof where.brandId === "string") {
      sqlConditions.push(Prisma.sql`l."brandId" = ${where.brandId}`);
    } else if (where.brandId) {
      const brandFilter = where.brandId as { in: string[] };
      sqlConditions.push(Prisma.sql`l."brandId" IN (${Prisma.join(brandFilter.in)})`);
    }
    if (gender) sqlConditions.push(Prisma.sql`l.gender = ${gender}::"Gender"`);
    if (condition) sqlConditions.push(Prisma.sql`l.condition = ${condition}::"Condition"`);
    if (city) sqlConditions.push(Prisma.sql`l.city = ${city}`);
    if (size) sqlConditions.push(Prisma.sql`l.size = ${size}`);
    if (delivery) sqlConditions.push(Prisma.sql`l.delivery ILIKE ${"%" + delivery + "%"}`);
    if (minPrice) sqlConditions.push(Prisma.sql`l.price >= ${parseFloat(minPrice)}`);
    if (maxPrice) sqlConditions.push(Prisma.sql`l.price <= ${parseFloat(maxPrice)}`);

    sqlConditions.push(Prisma.sql`(
      l.title ILIKE ${"%" + q + "%"}
      OR l.description ILIKE ${"%" + q + "%"}
      OR b.name ILIKE ${"%" + q + "%"}
      OR c.name ILIKE ${"%" + q + "%"}
      OR similarity(l.title, ${q}) > 0.25
      OR similarity(b.name, ${q}) > 0.3
      OR similarity(c.name, ${q}) > 0.3
    )`);

    const whereSql = Prisma.join(sqlConditions, " AND ");

    const ranked = await prisma.$queryRaw<{ id: string; score: number }[]>`
      SELECT l.id,
        GREATEST(
          similarity(l.title, ${q}),
          similarity(l.description, ${q}) * 0.7,
          similarity(b.name, ${q}),
          similarity(c.name, ${q})
        ) AS score
      FROM "Listing" l
      JOIN "Brand" b ON b.id = l."brandId"
      JOIN "Category" c ON c.id = l."categoryId"
      WHERE ${whereSql}
      ORDER BY score DESC
      LIMIT ${SEARCH_MATCH_CAP}
    `;

    relevanceRank = new Map(ranked.map((row, index) => [row.id, index]));
    where.id = { in: ranked.map((row) => row.id) };
  }

  const orderBy: Record<string, string> = {};
  switch (sort) {
    case "price_asc":
      orderBy.price = "asc";
      break;
    case "price_desc":
      orderBy.price = "desc";
      break;
    case "popular":
      orderBy.views = "desc";
      break;
    default:
      orderBy.createdAt = "desc";
  }

  // When searching with the default sort, rank by relevance instead of date —
  // fetch the matched ids for this page in relevance order, then hydrate them.
  const useRelevanceOrder = !!relevanceRank && sort === "newest";

  let listings;
  let total;

  if (useRelevanceOrder) {
    const allIds = (where.id as { in: string[] }).in;
    total = allIds.length;
    const pageIds = allIds.slice((page - 1) * LISTINGS_PER_PAGE, page * LISTINGS_PER_PAGE);

    const unordered = pageIds.length
      ? await prisma.listing.findMany({
          where: { id: { in: pageIds } },
          include: {
            images: { orderBy: { order: "asc" }, take: 1 },
            brand: { select: { name: true, segment: true } },
            category: { select: { name: true } },
            user: { select: { name: true, avatar: true } },
            _count: { select: { favorites: true } },
          },
        })
      : [];

    const positionOf = new Map(pageIds.map((id, index) => [id, index]));
    listings = unordered.sort((a, b) => (positionOf.get(a.id) ?? 0) - (positionOf.get(b.id) ?? 0));
  } else {
    [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          images: { orderBy: { order: "asc" }, take: 1 },
          brand: { select: { name: true, segment: true } },
          category: { select: { name: true } },
          user: { select: { name: true, avatar: true } },
          _count: { select: { favorites: true } },
        },
        orderBy,
        skip: (page - 1) * LISTINGS_PER_PAGE,
        take: LISTINGS_PER_PAGE,
      }),
      prisma.listing.count({ where }),
    ]);
  }

  return NextResponse.json({
    listings,
    pagination: {
      page,
      totalPages: Math.ceil(total / LISTINGS_PER_PAGE),
      total,
    },
  });
}
