import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const SESSION_TTL_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const wait = await rateLimit(ip, "login-session", 20, 600);
  if (wait !== null) {
    return NextResponse.json({ error: `Слишком много попыток. Подождите ${wait} сек.` }, { status: 429 });
  }

  const session = await prisma.loginSession.create({
    data: { expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
  });

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "Clothy_by_bot";

  return NextResponse.json({
    sessionId: session.id,
    deepLink: `https://t.me/${botUsername}?start=login_${session.id}`,
    expiresAt: session.expiresAt,
  });
}
