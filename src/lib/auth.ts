import { cookies } from "next/headers";
import { verifyJwt } from "./telegram";
import { prisma } from "./prisma";

const USER_SELECT = {
  id: true,
  name: true,
  role: true,
  city: true,
  avatar: true,
  banned: true,
  telegramId: true,
} as const;

export async function getAuthUser(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const userId = await verifyJwt(token);
  if (!userId) return null;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: USER_SELECT });
  return user?.banned ? null : (user ?? null);
}

export async function getAuthUserFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get("twa_token")?.value;
  if (!token) return null;

  const userId = await verifyJwt(token);
  if (!userId) return null;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: USER_SELECT });
  return user?.banned ? null : (user ?? null);
}
