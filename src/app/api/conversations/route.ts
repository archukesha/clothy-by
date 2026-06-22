import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const { listingId, sellerId } = await request.json();

  if (user.id === sellerId) {
    return NextResponse.json({ error: "Нельзя написать самому себе" }, { status: 400 });
  }

  const [user1Id, user2Id] =
    user.id < sellerId ? [user.id, sellerId] : [sellerId, user.id];

  let conversation = await prisma.conversation.findUnique({
    where: { user1Id_user2Id_listingId: { user1Id, user2Id, listingId } },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { user1Id, user2Id, listingId },
    });
  }

  return NextResponse.json(conversation);
}

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ user1Id: user.id }, { user2Id: user.id }] },
    include: {
      user1: { select: { id: true, name: true, avatar: true } },
      user2: { select: { id: true, name: true, avatar: true } },
      listing: {
        select: {
          id: true,
          title: true,
          price: true,
          currency: true,
          status: true,
          images: { take: 1, orderBy: { order: "asc" } },
        },
      },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  const result = await Promise.all(
    conversations.map(async (conv) => {
      const unreadCount = await prisma.message.count({
        where: { conversationId: conv.id, senderId: { not: user.id }, read: false },
      });
      return { ...conv, unreadCount };
    })
  );

  return NextResponse.json(result);
}
