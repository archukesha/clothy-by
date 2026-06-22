import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { sendChatMessageNotification } from "@/lib/bot";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const { id } = await params;
  const conversation = await prisma.conversation.findUnique({ where: { id } });

  if (!conversation || (conversation.user1Id !== user.id && conversation.user2Id !== user.id)) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  await prisma.message.updateMany({
    where: { conversationId: id, senderId: { not: user.id }, read: false },
    data: { read: true },
  });

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    include: { sender: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const wait = await rateLimit(user.id, "send-message", 30, 60);
  if (wait !== null) {
    return NextResponse.json({ error: `Слишком много сообщений. Подождите ${wait} сек.` }, { status: 429 });
  }

  const { id } = await params;
  const { text } = await request.json();

  if (!text?.trim()) {
    return NextResponse.json({ error: "Сообщение не может быть пустым" }, { status: 400 });
  }

  if (text.trim().length > 2000) {
    return NextResponse.json({ error: "Сообщение не может превышать 2000 символов" }, { status: 400 });
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      listing: { select: { title: true } },
      user1: { select: { id: true, name: true, telegramId: true } },
      user2: { select: { id: true, name: true, telegramId: true } },
    },
  });

  if (!conversation || (conversation.user1Id !== user.id && conversation.user2Id !== user.id)) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  const message = await prisma.message.create({
    data: { text: text.trim(), senderId: user.id, conversationId: id },
    include: { sender: { select: { id: true, name: true, avatar: true } } },
  });

  await prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } });

  const recipient = conversation.user1Id === user.id ? conversation.user2 : conversation.user1;

  if (recipient.telegramId) {
    try {
      const sent = await sendChatMessageNotification(recipient.telegramId, {
        senderName: message.sender.name,
        listingTitle: conversation.listing.title,
        text: message.text,
      });

      if (sent) {
        await prisma.message.update({
          where: { id: message.id },
          data: { notifyChatId: sent.chatId, notifyMessageId: sent.messageId },
        });
      }
    } catch (error) {
      console.error("Failed to send Telegram chat notification:", error);
    }
  }

  return NextResponse.json(message, { status: 201 });
}
