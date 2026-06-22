import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { resolveReview } from "@/lib/moderation";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const { id } = await params;
  const { approve } = await request.json();

  const review = await resolveReview(id, !!approve);
  if (!review) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  return NextResponse.json(review);
}
