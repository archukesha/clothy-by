import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/bot";

export type ReportAction = "ban" | "remove" | "dismiss";

export async function resolveReport(reportId: string, action: ReportAction) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      reporter: { select: { telegramId: true } },
      listing: { select: { id: true, userId: true, user: { select: { telegramId: true } } } },
      targetUser: { select: { id: true, telegramId: true } },
    },
  });

  if (!report) return null;

  const offenderId = report.listing?.userId ?? report.targetUser?.id;
  const offenderTelegramId = report.listing?.user.telegramId ?? report.targetUser?.telegramId;
  const reporterTelegramId = report.reporter.telegramId;

  if (action === "ban") {
    if (offenderId) {
      await prisma.user.update({ where: { id: offenderId }, data: { banned: true } });
    }
    await prisma.report.update({ where: { id: reportId }, data: { status: "RESOLVED" } });
    if (offenderTelegramId) {
      await notifyUser(offenderTelegramId, "🚫 Ваш аккаунт *заблокирован* администрацией\\.").catch(console.error);
    }
    if (reporterTelegramId) {
      await notifyUser(
        reporterTelegramId,
        "✅ Спасибо за жалобу\\! Мы её рассмотрели — нарушитель *заблокирован*\\."
      ).catch(console.error);
    }
  } else if (action === "remove") {
    if (report.listing) {
      await prisma.listing.update({ where: { id: report.listing.id }, data: { status: "ARCHIVED" } });
    }
    await prisma.report.update({ where: { id: reportId }, data: { status: "RESOLVED" } });
    if (report.listing?.user.telegramId) {
      await notifyUser(
        report.listing.user.telegramId,
        "❌ Ваше объявление *снято с публикации* модератором по жалобе\\."
      ).catch(console.error);
    }
    if (reporterTelegramId) {
      await notifyUser(
        reporterTelegramId,
        "✅ Спасибо за жалобу\\! Мы её рассмотрели — объявление *снято с публикации*\\."
      ).catch(console.error);
    }
  } else {
    await prisma.report.update({ where: { id: reportId }, data: { status: "DISMISSED" } });
    if (reporterTelegramId) {
      await notifyUser(
        reporterTelegramId,
        "ℹ️ Мы рассмотрели вашу жалобу — нарушений не выявлено\\."
      ).catch(console.error);
    }
  }

  return report;
}

export async function resolveReview(reviewId: string, approve: boolean) {
  const exists = await prisma.review.findUnique({ where: { id: reviewId }, select: { id: true } });
  if (!exists) return null;

  const review = await prisma.review.update({
    where: { id: reviewId },
    data: { status: approve ? "APPROVED" : "REJECTED" },
    include: { author: { select: { telegramId: true } } },
  });

  if (review.author.telegramId) {
    await notifyUser(
      review.author.telegramId,
      approve ? "✅ Ваш отзыв *одобрен* и опубликован\\!" : "❌ Ваш отзыв *отклонён* модератором\\."
    ).catch(console.error);
  }

  return review;
}
