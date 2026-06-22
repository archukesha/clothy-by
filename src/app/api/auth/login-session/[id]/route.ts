import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signJwt } from "@/lib/telegram";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await prisma.loginSession.findUnique({ where: { id } });
  if (!session) {
    return NextResponse.json({ status: "not_found" }, { status: 404 });
  }

  if (session.expiresAt < new Date()) {
    return NextResponse.json({ status: "expired" });
  }

  if (!session.userId) {
    return NextResponse.json({ status: "pending" });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, avatar: true, telegramId: true, banned: true },
  });

  if (!user || user.banned) {
    return NextResponse.json({ status: "expired" });
  }

  const token = await signJwt(user.id);

  await prisma.loginSession.delete({ where: { id } }).catch(() => {});

  return NextResponse.json({
    status: "confirmed",
    token,
    user: { id: user.id, name: user.name, avatar: user.avatar, telegramId: user.telegramId },
  });
}
