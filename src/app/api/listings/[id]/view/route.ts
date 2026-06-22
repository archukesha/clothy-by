import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

const COOLDOWN_MS = 12 * 60 * 60 * 1000;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const listing = await prisma.listing.findUnique({ where: { id }, select: { userId: true } });
    if (!listing) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    const user = await getAuthUser(request);
    if (user && user.id === listing.userId) {
      return NextResponse.json({ ok: true, counted: false });
    }

    const cooldownCutoff = new Date(Date.now() - COOLDOWN_MS);

    if (user) {
      const existing = await prisma.listingView.findUnique({
        where: { userId_listingId: { userId: user.id, listingId: id } },
      });

      if (existing && existing.viewedAt > cooldownCutoff) {
        return NextResponse.json({ ok: true, counted: false });
      }

      await prisma.listingView.upsert({
        where: { userId_listingId: { userId: user.id, listingId: id } },
        update: { viewedAt: new Date() },
        create: { userId: user.id, listingId: id },
      });
    } else {
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

      const existing = await prisma.listingView.findFirst({
        where: { ip, listingId: id, userId: null, viewedAt: { gt: cooldownCutoff } },
      });

      if (existing) {
        return NextResponse.json({ ok: true, counted: false });
      }

      await prisma.listingView.create({ data: { ip, listingId: id } });
    }

    await prisma.listing.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    return NextResponse.json({ ok: true, counted: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
}
