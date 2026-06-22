import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ count: 0 });
  }

  const count = await prisma.message.count({
    where: {
      read: false,
      senderId: { not: user.id },
      conversation: {
        OR: [{ user1Id: user.id }, { user2Id: user.id }],
      },
    },
  });

  return NextResponse.json({ count });
}
