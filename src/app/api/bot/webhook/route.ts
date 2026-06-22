import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  answerCallbackQuery,
  editMessageCaption,
  editMessageText,
  notifyUser,
  sendChatMessageNotification,
  sendPlainMessage,
} from "@/lib/bot";
import { resolveReport, resolveReview } from "@/lib/moderation";

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expectedSecret) {
    const provided = request.headers.get("x-telegram-bot-api-secret-token");
    if (provided !== expectedSecret) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const body = await request.json();

  if (body.message) {
    await handleIncomingMessage(body.message);
    return NextResponse.json({ ok: true });
  }

  if (!body.callback_query) {
    return NextResponse.json({ ok: true });
  }

  const { id: callbackId, from, data, message } = body.callback_query;

  if (String(from.id) !== process.env.TELEGRAM_ADMIN_ID) {
    await answerCallbackQuery(callbackId, "Нет доступа");
    return NextResponse.json({ ok: true });
  }

  const [action, entityId] = (data as string).split(":");

  if (action === "approve_review" || action === "reject_review") {
    await handleReviewModeration(action, entityId, callbackId, message);
    return NextResponse.json({ ok: true });
  }

  if (action === "report_ban" || action === "report_remove" || action === "report_dismiss") {
    await handleReportAction(action, entityId, callbackId, message);
    return NextResponse.json({ ok: true });
  }

  const listingId = entityId;

  if (!listingId || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ ok: true });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { user: { select: { telegramId: true, name: true } } },
  });

  if (!listing) {
    await answerCallbackQuery(callbackId, "Объявление не найдено");
    return NextResponse.json({ ok: true });
  }

  const chatId = String(from.id);
  const msgId = message.message_id;
  const originalText = message.caption ?? message.text ?? "";

  if (action === "approve") {
    await prisma.listing.update({ where: { id: listingId }, data: { status: "ACTIVE" } });
    await answerCallbackQuery(callbackId, "✅ Одобрено");

    const updated = `${originalText}\n\n✅ ОДОБРЕНО`;
    if (message.caption !== undefined) {
      await editMessageCaption(chatId, msgId, updated);
    } else {
      await editMessageText(chatId, msgId, updated);
    }

    if (listing.user.telegramId) {
      await notifyUser(
        listing.user.telegramId,
        `✅ Ваше объявление *одобрено* и опубликовано\\!`
      );
    }
  } else {
    await prisma.listing.update({ where: { id: listingId }, data: { status: "REJECTED" } });
    await answerCallbackQuery(callbackId, "❌ Отклонено");

    const updated = `${originalText}\n\n❌ ОТКЛОНЕНО`;
    if (message.caption !== undefined) {
      await editMessageCaption(chatId, msgId, updated);
    } else {
      await editMessageText(chatId, msgId, updated);
    }

    if (listing.user.telegramId) {
      await notifyUser(
        listing.user.telegramId,
        `❌ Ваше объявление *отклонено*\\. Свяжитесь с поддержкой для уточнения причины\\.`
      );
    }
  }

  return NextResponse.json({ ok: true });
}

interface CallbackMessage {
  message_id: number;
  caption?: string;
  text?: string;
}

async function handleReviewModeration(
  action: "approve_review" | "reject_review",
  reviewId: string,
  callbackId: string,
  message: CallbackMessage
) {
  const review = await resolveReview(reviewId, action === "approve_review");
  if (!review) {
    await answerCallbackQuery(callbackId, "Отзыв не найден");
    return;
  }

  const originalText = message.text ?? "";
  const chatId = process.env.TELEGRAM_ADMIN_ID!;
  const approved = action === "approve_review";

  await answerCallbackQuery(callbackId, approved ? "✅ Одобрено" : "❌ Отклонено");
  await editMessageText(
    chatId,
    message.message_id,
    `${originalText}\n\n${approved ? "✅ ОДОБРЕНО" : "❌ ОТКЛОНЕНО"}`
  );
}

async function handleReportAction(
  action: "report_ban" | "report_remove" | "report_dismiss",
  reportId: string,
  callbackId: string,
  message: CallbackMessage
) {
  const reportAction = action === "report_ban" ? "ban" : action === "report_remove" ? "remove" : "dismiss";
  const report = await resolveReport(reportId, reportAction);

  if (!report) {
    await answerCallbackQuery(callbackId, "Жалоба не найдена");
    return;
  }

  const originalText = message.text ?? "";
  const chatId = process.env.TELEGRAM_ADMIN_ID!;
  const labels = {
    ban: { toast: "🚫 Пользователь заблокирован", suffix: "🚫 АВТОР ЗАБЛОКИРОВАН" },
    remove: { toast: "🗑 Объявление снято", suffix: "🗑 ОБЪЯВЛЕНИЕ СНЯТО" },
    dismiss: { toast: "Жалоба отклонена", suffix: "✖️ ЖАЛОБА ОТКЛОНЕНА" },
  } as const;

  await answerCallbackQuery(callbackId, labels[reportAction].toast);
  await editMessageText(chatId, message.message_id, `${originalText}\n\n${labels[reportAction].suffix}`);
}

interface IncomingTelegramMessage {
  message_id: number;
  text?: string;
  from: { id: number; first_name?: string; last_name?: string; username?: string };
  chat: { id: number };
  reply_to_message?: { message_id: number };
}

async function handleLoginStart(message: IncomingTelegramMessage, sessionId: string) {
  const chatId = String(message.chat.id);

  const session = await prisma.loginSession.findUnique({ where: { id: sessionId } });
  if (!session || session.expiresAt < new Date()) {
    await sendPlainMessage(chatId, "Ссылка для входа устарела. Откройте приложение и попробуйте снова.").catch(console.error);
    return;
  }

  const telegramId = String(message.from.id);
  const name = [message.from.first_name, message.from.last_name].filter(Boolean).join(" ") || "Пользователь";

  let user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) {
    user = await prisma.user.create({ data: { telegramId, name } });
  }

  if (user.banned) {
    await sendPlainMessage(chatId, "Ваш аккаунт заблокирован.").catch(console.error);
    return;
  }

  await prisma.loginSession.update({ where: { id: sessionId }, data: { userId: user.id } });
  await sendPlainMessage(chatId, "✅ Вход подтверждён! Вернитесь в приложение Clothy.by.").catch(console.error);
}

async function handleIncomingMessage(message: IncomingTelegramMessage) {
  const text = message.text?.trim();
  if (!text) return;

  const chatId = String(message.chat.id);

  if (text.startsWith("/start")) {
    const param = text.slice("/start".length).trim();
    if (param.startsWith("login_")) {
      await handleLoginStart(message, param.slice("login_".length)).catch(console.error);
    } else {
      await sendPlainMessage(chatId, "Откройте Clothy.by через кнопку в меню бота 👇").catch(console.error);
    }
    return;
  }

  const replyToId = message.reply_to_message?.message_id;

  if (!replyToId) {
    await sendPlainMessage(
      chatId,
      "Чтобы отправить сообщение в чат, ответьте (Reply) на уведомление о новом сообщении.",
      message.message_id
    );
    return;
  }

  const originalMessage = await prisma.message.findFirst({
    where: { notifyChatId: chatId, notifyMessageId: replyToId },
    include: {
      conversation: {
        include: {
          listing: { select: { title: true } },
          user1: { select: { id: true, name: true, telegramId: true } },
          user2: { select: { id: true, name: true, telegramId: true } },
        },
      },
    },
  });

  if (!originalMessage) {
    await sendPlainMessage(
      chatId,
      "Не удалось найти этот чат — возможно, сообщение слишком старое. Откройте приложение, чтобы ответить.",
      message.message_id
    );
    return;
  }

  const { conversation } = originalMessage;
  const replier = [conversation.user1, conversation.user2].find(
    (u) => u.telegramId === String(message.from.id)
  );

  if (!replier) {
    await sendPlainMessage(chatId, "Не удалось определить отправителя.", message.message_id);
    return;
  }

  const recipient = conversation.user1.id === replier.id ? conversation.user2 : conversation.user1;

  const newMessage = await prisma.message.create({
    data: { text, senderId: replier.id, conversationId: conversation.id },
    include: { sender: { select: { id: true, name: true, avatar: true } } },
  });

  await prisma.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });
  await sendPlainMessage(chatId, "✅ Отправлено в чат", message.message_id);

  if (recipient.telegramId) {
    try {
      const sent = await sendChatMessageNotification(recipient.telegramId, {
        senderName: newMessage.sender.name,
        listingTitle: conversation.listing.title,
        text: newMessage.text,
      });

      if (sent) {
        await prisma.message.update({
          where: { id: newMessage.id },
          data: { notifyChatId: sent.chatId, notifyMessageId: sent.messageId },
        });
      }
    } catch (error) {
      console.error("Failed to send Telegram chat notification:", error);
    }
  }
}
