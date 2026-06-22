export const dynamic = "force-dynamic";

import { getAuthUserFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const authUser = await getAuthUserFromCookies();
  if (!authUser) redirect("/");

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { name: true, bio: true, city: true },
  });

  if (!user) redirect("/");

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-6 text-xl font-bold">Настройки профиля</h1>
      <SettingsForm name={user.name} bio={user.bio ?? ""} city={user.city ?? ""} />
    </div>
  );
}
