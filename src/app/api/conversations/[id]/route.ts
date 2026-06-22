import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const { id } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      user1: { select: { id: true, name: true, avatar: true } },
      user2: { select: { id: true, name: true, avatar: true } },
      listing: {
        select: {
          id: true,
          title: true,
          price: true,
          currency: true,
          quantity: true,
          userId: true,
          status: true,
          images: { take: 1, orderBy: { order: "asc" } },
        },
      },
    },
  });

  if (
    !conversation ||
    (conversation.user1Id !== user.id && conversation.user2Id !== user.id)
  ) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  return NextResponse.json(conversation);
}
