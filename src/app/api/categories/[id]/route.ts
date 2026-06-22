import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const { id } = await params;

  const [listingsCount, childrenCount] = await Promise.all([
    prisma.listing.count({ where: { categoryId: id } }),
    prisma.category.count({ where: { parentId: id } }),
  ]);

  if (listingsCount > 0) {
    return NextResponse.json(
      { error: `Нельзя удалить: с этой категорией связано ${listingsCount} объявлений` },
      { status: 409 }
    );
  }
  if (childrenCount > 0) {
    return NextResponse.json(
      { error: `Нельзя удалить: есть ${childrenCount} подкатегорий` },
      { status: 409 }
    );
  }

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
