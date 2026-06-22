import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import type { BrandSegment } from "@prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const segment = searchParams.get("segment");
  const search = searchParams.get("q");

  const brands = await prisma.brand.findMany({
    where: {
      ...(segment ? { segment: segment as BrandSegment } : {}),
      ...(search ? { name: { contains: search } } : {}),
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(brands);
}

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const segment = typeof body.segment === "string" ? body.segment : "MASS_MARKET";

  if (!name) {
    return NextResponse.json({ error: "Укажите название бренда" }, { status: 400 });
  }

  try {
    const brand = await prisma.brand.create({
      data: { name, slug: slugify(name), segment: segment as BrandSegment },
    });
    return NextResponse.json(brand, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Бренд с таким названием уже существует" }, { status: 409 });
    }
    console.error("Create brand error:", error);
    return NextResponse.json({ error: "Не удалось создать бренд" }, { status: 500 });
  }
}
