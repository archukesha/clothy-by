import { redirect } from "next/navigation";
import { getAuthUserFromCookies } from "@/lib/auth";

export async function requireAdmin() {
  const user = await getAuthUserFromCookies();
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    redirect("/");
  }
  return user;
}

export function isAdminUser(role: string | undefined | null) {
  return role === "ADMIN" || role === "MODERATOR";
}
