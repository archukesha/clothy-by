import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { sendReportNotification } from "@/lib/bot";
import { rateLimit } from "@/lib/rate-limit";

const VALID_REASONS = ["SPAM", "FRAUD", "PROHIBITED", "OFFENSIVE", "FAKE", "OTHER"];

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const wait = await rateLimit(user.id, "create-report", 10, 3600);
  if (wait !== null) {
    return NextResponse.json({ error: `Слишком много жалоб. Подождите ${wait} сек.` }, { status: 429 });
  }

  const body = await request.json();
  const targetType = body.targetType === "LISTING" || body.targetType === "USER" ? body.targetType : null;
  const listingId = typeof body.listingId === "string" ? body.listingId : null;
  const targetUserId = typeof body.targetUserId === "string" ? body.targetUserId : null;
  const reason = typeof body.reason === "string" ? body.reason : "";
  const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 500) : null;

  if (!targetType || !VALID_REASONS.includes(reason)) {
    return NextResponse.json({ error: "Некорректные данные жалобы" }, { status: 400 });
  }

  if (targetType === "LISTING" && !listingId) {
    return NextResponse.json({ error: "Не указано объявление" }, { status: 400 });
  }
  if (targetType === "USER" && !targetUserId) {
    return NextResponse.json({ error: "Не указан пользователь" }, { status: 400 });
  }

  let report;

  if (targetType === "LISTING") {
    const listing = await prisma.listing.findUnique({ where: { id: listingId! }, select: { userId: true } });
    if (!listing) {
      return NextResponse.json({ error: "Объявление не найдено" }, { status: 404 });
    }
    if (listing.userId === user.id) {
      return NextResponse.json({ error: "Нельзя пожаловаться на своё объявление" }, { status: 400 });
    }

    report = await prisma.report.create({
      data: { targetType, reason, comment, reporterId: user.id, listingId },
      include: {
        reporter: { select: { name: true } },
        listing: { select: { id: true, title: true, user: { select: { id: true, name: true } } } },
      },
    });
  } else {
    if (targetUserId === user.id) {
      return NextResponse.json({ error: "Нельзя пожаловаться на самого себя" }, { status: 400 });
    }
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId! }, select: { id: true } });
    if (!targetUser) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    report = await prisma.report.create({
      data: { targetType, reason, comment, reporterId: user.id, targetUserId },
      include: {
        reporter: { select: { name: true } },
        targetUser: { select: { id: true, name: true } },
      },
    });
  }

  sendReportNotification(report as Parameters<typeof sendReportNotification>[0]).catch(console.error);

  return NextResponse.json({ success: true }, { status: 201 });
}
