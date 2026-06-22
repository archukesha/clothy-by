import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { sendModerationRequest, notifyUser, notifyReviewOpportunity, escapeMarkdown } from "@/lib/bot";
import { updateListingSchema } from "@/lib/listing-schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      images: { orderBy: { order: "asc" } },
      brand: true,
      category: { include: { parent: true } },
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
          city: true,
          telegramId: true,
        },
      },
      _count: { select: { favorites: true } },
    },
  });

  if (!listing) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  return NextResponse.json(listing);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id } });

  if (!listing) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  if (listing.userId !== user.id && user.role !== "ADMIN" && user.role !== "MODERATOR") {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  await prisma.listing.update({ where: { id }, data: { status: "ARCHIVED" } });
  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id } });

  if (!listing) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  if (listing.userId !== user.id && user.role !== "ADMIN" && user.role !== "MODERATOR") {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { images, ...data } = body;
    const isOwner = listing.userId === user.id;
    const statusUpdateKeys = new Set(["status", "rejectionReason"]);
    const isStatusOnlyUpdate =
      typeof body.status === "string" &&
      !images &&
      Object.keys(body).every((key) => statusUpdateKeys.has(key));

    if (!isStatusOnlyUpdate) {
      const parsed = updateListingSchema.safeParse(data);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
      }
    }

    const normalizedData = {
      ...data,
      categoryId: typeof data.categoryId === "string" && data.categoryId ? data.categoryId : listing.categoryId,
      brandId: typeof data.brandId === "string" && data.brandId ? data.brandId : listing.brandId,
      color: typeof data.color === "string" ? data.color : listing.color,
    };

    if (images && Array.isArray(images)) {
      await prisma.listingImage.deleteMany({ where: { listingId: id } });
      await prisma.listingImage.createMany({
        data: images.map((url: string, i: number) => ({ url, order: i, listingId: id })),
      });
    }

    const shouldRemoderate =
      isOwner &&
      !isStatusOnlyUpdate &&
      ["ACTIVE", "MODERATION", "REJECTED"].includes(listing.status);

    // Restoring a sold/archived listing back to sale must always go through
    // moderation again — never jump straight back to ACTIVE.
    const isRestoreToSale =
      isOwner &&
      isStatusOnlyUpdate &&
      body.status === "ACTIVE" &&
      ["SOLD", "ARCHIVED"].includes(listing.status);

    const isStaffModerationDecision =
      !isOwner &&
      isStatusOnlyUpdate &&
      listing.status === "MODERATION" &&
      ["ACTIVE", "REJECTED"].includes(body.status);

    const isMarkingSold =
      isOwner && isStatusOnlyUpdate && body.status === "SOLD" && listing.status === "ACTIVE";

    const updated = await prisma.listing.update({
      where: { id },
      data: {
        ...normalizedData,
        ...(shouldRemoderate || isRestoreToSale
          ? {
              status: "MODERATION",
              rejectionReason: null,
            }
          : {}),
      },
      include: {
        images: { orderBy: { order: "asc" } },
        brand: true,
        category: true,
        user: { select: { name: true, telegramId: true } },
      },
    });

    if (shouldRemoderate || isRestoreToSale) {
      sendModerationRequest(updated).catch(console.error);
    }

    if (isStaffModerationDecision && updated.user.telegramId) {
      const message =
        body.status === "ACTIVE"
          ? "✅ Ваше объявление *одобрено* и опубликовано\\!"
          : `❌ Ваше объявление *отклонено*\\.${
              body.rejectionReason ? `\nПричина: ${escapeMarkdown(body.rejectionReason)}` : ""
            }`;
      notifyUser(updated.user.telegramId, message).catch(console.error);
    }

    if (isMarkingSold) {
      const conversations = await prisma.conversation.findMany({
        where: { listingId: id },
        select: {
          user1Id: true,
          user2Id: true,
          user1: { select: { telegramId: true } },
          user2: { select: { telegramId: true } },
        },
      });

      const buyerTelegramIds = new Set<string>();
      for (const conv of conversations) {
        const buyerTelegramId = conv.user1Id === user.id ? conv.user2.telegramId : conv.user1.telegramId;
        if (buyerTelegramId) buyerTelegramIds.add(buyerTelegramId);
      }

      for (const telegramId of buyerTelegramIds) {
        notifyReviewOpportunity(telegramId, {
          sellerId: user.id,
          sellerName: updated.user.name,
          listingTitle: updated.title,
        }).catch(console.error);
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update listing error:", error);
    return NextResponse.json(
      { error: "Не удалось сохранить изменения. Попробуйте ещё раз." },
      { status: 500 }
    );
  }
}
