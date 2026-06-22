import https from "node:https";

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = botToken ? `https://api.telegram.org/bot${botToken}` : "";
const CONDITION_LABELS: Record<string, string> = {
  NEW_WITH_TAGS: "Новое с бирками",
  NEW_WITHOUT_TAGS: "Новое без бирок",
  USED_EXCELLENT: "Б/у — отличное",
  USED_GOOD: "Б/у — хорошее",
  USED_FAIR: "Б/у — среднее",
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  BYN: "BYN",
  USD: "$",
  EUR: "€",
  RUB: "₽",
};

interface TelegramResponse {
  ok: boolean;
  description?: string;
  error_code?: number;
  result?: unknown;
}

async function call(method: string, body: object): Promise<TelegramResponse> {
  if (!TELEGRAM_API) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  }

  const payload = JSON.stringify(body);

  const data = await new Promise<TelegramResponse>((resolve, reject) => {
    const request = https.request(
      `${TELEGRAM_API}/${method}`,
      {
        method: "POST",
        family: 4,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (response) => {
        let raw = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          raw += chunk;
        });
        response.on("end", () => {
          try {
            resolve(JSON.parse(raw) as TelegramResponse);
          } catch (error) {
            reject(error);
          }
        });
      }
    );

    request.on("error", reject);
    request.setTimeout(15000, () => {
      request.destroy(new Error(`Telegram API ${method} timeout`));
    });
    request.write(payload);
    request.end();
  });

  if (!data.ok) {
    throw new Error(`Telegram API ${method} failed: ${data.error_code ?? 500} ${data.description ?? "unknown error"}`);
  }

  return data;
}

export interface ModerationListing {
  id: string;
  title: string;
  price: number;
  currency: string;
  condition: string;
  city: string;
  description: string;
  images: { url: string }[];
  brand: { name: string };
  category: { name: string };
  user: { name: string; telegramId: string | null };
}

function toAbsoluteUrl(url: string): string {
  if (url.startsWith("http")) return url;
  const base = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
  return `${base}${url}`;
}

export async function sendModerationRequest(listing: ModerationListing) {
  const adminId = process.env.TELEGRAM_ADMIN_ID;
  if (!adminId) {
    console.warn("TELEGRAM_ADMIN_ID is not configured");
    return;
  }

  const symbol = CURRENCY_SYMBOLS[listing.currency] || listing.currency;
  const condition = CONDITION_LABELS[listing.condition] || listing.condition;
  const description =
    listing.description.length > 300
      ? `${listing.description.slice(0, 300)}...`
      : listing.description;

  const botUsername = process.env.TELEGRAM_BOT_USERNAME || "Clothy_by_bot";
  const listingUrl = `https://t.me/${botUsername}?startapp=listing_${listing.id}`;
  const plainText = [
    "Новое объявление на модерации",
    `${listing.brand.name} — ${listing.title}`,
    `${listing.price} ${symbol}`,
    condition,
    listing.category.name,
    listing.city,
    `Продавец: ${listing.user.name}${listing.user.telegramId ? ` (id: ${listing.user.telegramId})` : ""}`,
    "",
    description,
    "",
    `Открыть: ${listingUrl}`,
  ].join("\n");

  const text =
    `🆕 *Объявление на модерации*\n\n` +
    `*${escapeMarkdown(listing.brand.name)} — ${escapeMarkdown(listing.title)}*\n` +
    `💰 ${listing.price} ${escapeMarkdown(symbol)}\n` +
    `📦 ${escapeMarkdown(condition)}\n` +
    `🗂 ${escapeMarkdown(listing.category.name)}\n` +
    `📍 ${escapeMarkdown(listing.city)}\n` +
    `👤 ${escapeMarkdown(listing.user.name)}` +
    (listing.user.telegramId ? ` \\(id: ${listing.user.telegramId}\\)` : "") +
    `\n\n${escapeMarkdown(description)}\n\n` +
    `[Открыть объявление](${listingUrl})`;

  const replyMarkup = {
    inline_keyboard: [[
      { text: "✅ Одобрить", callback_data: `approve:${listing.id}` },
      { text: "❌ Отклонить", callback_data: `reject:${listing.id}` },
    ]],
  };

  try {
    if (listing.images.length > 0) {
      await call("sendPhoto", {
        chat_id: adminId,
        photo: toAbsoluteUrl(listing.images[0].url),
        caption: text,
        parse_mode: "MarkdownV2",
        reply_markup: replyMarkup,
      });
    } else {
      await call("sendMessage", {
        chat_id: adminId,
        text,
        parse_mode: "MarkdownV2",
        reply_markup: replyMarkup,
      });
    }
  } catch (error) {
    console.error("sendModerationRequest failed:", error);
    await call("sendMessage", {
      chat_id: adminId,
      text: plainText,
      reply_markup: replyMarkup,
    });
  }
}

export interface ModerationReview {
  id: string;
  rating: number;
  text: string;
  author: { name: string };
  seller: { name: string };
}

export async function sendReviewModerationRequest(review: ModerationReview) {
  const adminId = process.env.TELEGRAM_ADMIN_ID;
  if (!adminId) {
    console.warn("TELEGRAM_ADMIN_ID is not configured");
    return;
  }

  const stars = "⭐".repeat(review.rating) + "☆".repeat(5 - review.rating);

  const text =
    `🆕 *Новый отзыв на модерации*\n\n` +
    `${stars}\n` +
    `👤 От: ${escapeMarkdown(review.author.name)}\n` +
    `🏷 О продавце: ${escapeMarkdown(review.seller.name)}\n\n` +
    `${escapeMarkdown(review.text)}`;

  const replyMarkup = {
    inline_keyboard: [[
      { text: "✅ Одобрить", callback_data: `approve_review:${review.id}` },
      { text: "❌ Отклонить", callback_data: `reject_review:${review.id}` },
    ]],
  };

  try {
    await call("sendMessage", { chat_id: adminId, text, parse_mode: "MarkdownV2", reply_markup: replyMarkup });
  } catch (error) {
    console.error("sendReviewModerationRequest failed:", error);
    const plainText = [
      "Новый отзыв на модерации",
      stars,
      `От: ${review.author.name}`,
      `О продавце: ${review.seller.name}`,
      "",
      review.text,
    ].join("\n");
    await call("sendMessage", { chat_id: adminId, text: plainText, reply_markup: replyMarkup });
  }
}

export interface ModerationReport {
  id: string;
  targetType: "LISTING" | "USER";
  reason: string;
  comment: string | null;
  reporter: { name: string };
  listing?: { id: string; title: string; user: { id: string; name: string } } | null;
  targetUser?: { id: string; name: string } | null;
}

export async function sendReportNotification(report: ModerationReport) {
  const adminId = process.env.TELEGRAM_ADMIN_ID;
  if (!adminId) {
    console.warn("TELEGRAM_ADMIN_ID is not configured");
    return;
  }

  const offender = report.targetType === "LISTING" ? report.listing!.user : report.targetUser!;
  const subject =
    report.targetType === "LISTING"
      ? `объявление «${report.listing!.title}»`
      : `пользователя ${offender.name}`;

  const text =
    `🚩 *Новая жалоба*\n\n` +
    `От: ${escapeMarkdown(report.reporter.name)}\n` +
    `На: ${escapeMarkdown(subject)}\n` +
    `Автор: ${escapeMarkdown(offender.name)}\n` +
    `Причина: ${escapeMarkdown(report.reason)}\n` +
    (report.comment ? `\nКомментарий: ${escapeMarkdown(report.comment)}` : "");

  const actionButtons = [
    { text: "🚫 Заблокировать автора", callback_data: `report_ban:${report.id}` },
  ];
  if (report.targetType === "LISTING") {
    actionButtons.push({ text: "🗑 Снять объявление", callback_data: `report_remove:${report.id}` });
  }

  const replyMarkup = {
    inline_keyboard: [
      actionButtons,
      [{ text: "✖️ Отклонить жалобу", callback_data: `report_dismiss:${report.id}` }],
    ],
  };

  try {
    await call("sendMessage", { chat_id: adminId, text, parse_mode: "MarkdownV2", reply_markup: replyMarkup });
  } catch (error) {
    console.error("sendReportNotification failed:", error);
    const plainText = [
      "Новая жалоба",
      `От: ${report.reporter.name}`,
      `На: ${subject}`,
      `Автор: ${offender.name}`,
      `Причина: ${report.reason}`,
      report.comment ? `Комментарий: ${report.comment}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    await call("sendMessage", { chat_id: adminId, text: plainText, reply_markup: replyMarkup });
  }
}

export async function notifyUser(telegramId: string, text: string) {
  await call("sendMessage", {
    chat_id: telegramId,
    text,
    parse_mode: "MarkdownV2",
  });
}

export async function notifyReviewOpportunity(
  telegramId: string,
  params: { sellerId: string; sellerName: string; listingTitle: string }
) {
  const botUsername = process.env.TELEGRAM_BOT_USERNAME || "Clothy_by_bot";
  const sellerUrl = `https://t.me/${botUsername}?startapp=seller_${params.sellerId}`;

  const text =
    `✅ Продавец отметил объявление «${escapeMarkdown(params.listingTitle)}» как проданное\\.\n\n` +
    `Если вы купили этот товар — оставьте отзыв о продавце ${escapeMarkdown(params.sellerName)}:\n` +
    `[Оставить отзыв](${sellerUrl})`;

  await call("sendMessage", {
    chat_id: telegramId,
    text,
    parse_mode: "MarkdownV2",
  });
}

export async function sendChatMessageNotification(
  telegramId: string,
  params: { senderName: string; listingTitle: string; text: string }
): Promise<{ chatId: string; messageId: number } | null> {
  const text = [
    `💬 Новое сообщение от ${params.senderName}`,
    `Объявление: «${params.listingTitle}»`,
    "",
    params.text,
    "",
    "↩️ Ответьте на это сообщение (Reply), чтобы написать в чат прямо отсюда",
  ].join("\n");

  const data = await call("sendMessage", { chat_id: telegramId, text });
  const result = data.result as { message_id: number; chat: { id: number } } | undefined;
  return result ? { chatId: String(result.chat.id), messageId: result.message_id } : null;
}

export async function sendPlainMessage(
  chatId: string,
  text: string,
  replyToMessageId?: number
) {
  await call("sendMessage", {
    chat_id: chatId,
    text,
    ...(replyToMessageId ? { reply_to_message_id: replyToMessageId } : {}),
  });
}

export async function answerCallbackQuery(id: string, text: string) {
  await call("answerCallbackQuery", { callback_query_id: id, text });
}

export async function editMessageCaption(chatId: string, messageId: number, caption: string) {
  await call("editMessageCaption", { chat_id: chatId, message_id: messageId, caption });
}

export async function editMessageText(chatId: string, messageId: number, text: string) {
  await call("editMessageText", { chat_id: chatId, message_id: messageId, text });
}

export function escapeMarkdown(text: string) {
  return text.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, "\\$1");
}
