import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    include: {
      children: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const parentId = typeof body.parentId === "string" && body.parentId ? body.parentId : null;
  const icon = typeof body.icon === "string" ? body.icon.trim() || null : null;

  if (!name) {
    return NextResponse.json({ error: "Укажите название категории" }, { status: 400 });
  }

  try {
    const category = await prisma.category.create({
      data: { name, slug: slugify(name), parentId, icon },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Категория с таким названием уже существует" }, { status: 409 });
    }
    console.error("Create category error:", error);
    return NextResponse.json({ error: "Не удалось создать категорию" }, { status: 500 });
  }
}
