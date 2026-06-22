import { NextRequest, NextResponse } from "next/server";
import { validateInitData, signJwt } from "@/lib/telegram";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const wait = await rateLimit(ip, "auth", 20, 600);
  if (wait !== null) {
    return NextResponse.json({ error: `Слишком много попыток. Подождите ${wait} сек.` }, { status: 429 });
  }

  const { initData } = await request.json();

  const tgUser = validateInitData(initData);
  if (!tgUser) {
    return NextResponse.json({ error: "Invalid initData" }, { status: 401 });
  }

  const telegramId = String(tgUser.id);
  const name = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ");

  let user = await prisma.user.findUnique({ where: { telegramId } });

  if (!user) {
    user = await prisma.user.create({
      data: { telegramId, name, avatar: tgUser.photo_url ?? null },
    });
  } else if (
    user.name !== name ||
    (tgUser.photo_url && user.avatar !== tgUser.photo_url)
  ) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { name, avatar: tgUser.photo_url ?? user.avatar },
    });
  }

  if (user.banned) {
    return NextResponse.json({ error: "Banned" }, { status: 403 });
  }

  const token = await signJwt(user.id);

  const response = NextResponse.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      telegramId: user.telegramId,
    },
  });

  response.cookies.set("twa_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return response;
}
