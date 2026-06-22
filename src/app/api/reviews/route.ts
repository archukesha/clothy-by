import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { sendReviewModerationRequest } from "@/lib/bot";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sellerId = searchParams.get("sellerId");

  if (!sellerId) {
    return NextResponse.json({ error: "sellerId обязателен" }, { status: 400 });
  }

  const reviews = await prisma.review.findMany({
    where: { sellerId, status: "APPROVED" },
    include: {
      author: { select: { id: true, name: true, avatar: true } },
      listing: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const count = reviews.length;
  const average = count > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;

  const user = await getAuthUser(request);
  const myReview = user
    ? await prisma.review.findUnique({ where: { authorId_sellerId: { authorId: user.id, sellerId } } })
    : null;

  const canReview = user
    ? !!(await prisma.conversation.findFirst({
        where: {
          listing: { userId: sellerId, status: "SOLD" },
          OR: [{ user1Id: user.id }, { user2Id: user.id }],
        },
        select: { id: true },
      }))
    : false;

  return NextResponse.json({ reviews, average, count, hasReviewed: !!myReview, canReview });
}

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const wait = await rateLimit(user.id, "create-review", 10, 3600);
  if (wait !== null) {
    return NextResponse.json({ error: `Слишком много отзывов. Подождите ${wait} сек.` }, { status: 429 });
  }

  const body = await request.json();
  const sellerId = typeof body.sellerId === "string" ? body.sellerId : "";
  const rating = Number(body.rating);
  const text = typeof body.text === "string" ? body.text.trim() : "";

  if (!sellerId) {
    return NextResponse.json({ error: "Продавец не указан" }, { status: 400 });
  }
  if (sellerId === user.id) {
    return NextResponse.json({ error: "Нельзя оставить отзыв самому себе" }, { status: 400 });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Оценка должна быть от 1 до 5" }, { status: 400 });
  }
  if (text.length < 5 || text.length > 500) {
    return NextResponse.json({ error: "Текст отзыва должен быть от 5 до 500 символов" }, { status: 400 });
  }

  const seller = await prisma.user.findUnique({ where: { id: sellerId }, select: { id: true, name: true } });
  if (!seller) {
    return NextResponse.json({ error: "Продавец не найден" }, { status: 404 });
  }

  const soldConversation = await prisma.conversation.findFirst({
    where: {
      listing: { userId: sellerId, status: "SOLD" },
      OR: [{ user1Id: user.id }, { user2Id: user.id }],
    },
    select: { listingId: true },
    orderBy: { updatedAt: "desc" },
  });

  if (!soldConversation) {
    return NextResponse.json(
      { error: "Оставить отзыв можно только после покупки у этого продавца" },
      { status: 403 }
    );
  }

  const listingId = soldConversation.listingId;

  try {
    const review = await prisma.review.create({
      data: { sellerId, authorId: user.id, rating, text, listingId },
      include: { author: { select: { name: true } }, seller: { select: { name: true } } },
    });

    sendReviewModerationRequest(review).catch(console.error);

    return NextResponse.json(review, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Вы уже оставляли отзыв этому продавцу" }, { status: 409 });
    }
    console.error("Create review error:", error);
    return NextResponse.json({ error: "Не удалось отправить отзыв" }, { status: 500 });
  }
}
