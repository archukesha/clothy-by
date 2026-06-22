import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { resolveReport, type ReportAction } from "@/lib/moderation";

const VALID_ACTIONS: ReportAction[] = ["ban", "remove", "dismiss"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const { id } = await params;
  const { action } = await request.json();

  if (!VALID_ACTIONS.includes(action)) {
    return NextResponse.json({ error: "Некорректное действие" }, { status: 400 });
  }

  const report = await resolveReport(id, action);
  if (!report) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  return NextResponse.json(report);
}
