"use client";

import { useState, useEffect } from "react";
import { useTelegram } from "@/context/telegram";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { formatDate, formatPrice } from "@/lib/utils";

interface Conversation {
  id: string;
  user1: { id: string; name: string; avatar?: string | null };
  user2: { id: string; name: string; avatar?: string | null };
  listing: {
    id: string;
    title: string;
    price: number;
    currency: string;
    status: string;
    images: { url: string }[];
  };
  messages: { text: string; createdAt: string }[];
  unreadCount: number;
  updatedAt: string;
}

const LISTING_STATUS_LABELS: Record<string, string> = {
  SOLD: "Продано",
  ARCHIVED: "В архиве",
  MODERATION: "На проверке",
  REJECTED: "Отклонено",
};

export default function MessagesPage() {
  const { user, token, isLoading } = useTelegram();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading || !user || !token) return;

    function loadConversations() {
      fetch("/api/conversations", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then(setConversations)
        .finally(() => setLoading(false));
    }

    loadConversations();
    const interval = setInterval(loadConversations, 15000);
    return () => clearInterval(interval);
  }, [user, token, isLoading]);

  if (isLoading || loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-6 text-xl font-bold">Сообщения</h1>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-neutral-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-6 text-xl font-bold">Сообщения</h1>

      {conversations.length === 0 ? (
        <div className="py-20 text-center">
          <MessageCircle className="mx-auto mb-4 h-12 w-12 text-neutral-200" />
          <h2 className="mb-1 text-lg font-semibold">Нет сообщений</h2>
          <p className="text-sm text-neutral-500">Напишите продавцу, чтобы начать диалог</p>
        </div>
      ) : (
        <div className="space-y-1">
          {conversations.map((conv) => {
            const otherUser = conv.user1.id === user?.id ? conv.user2 : conv.user1;
            const lastMsg = conv.messages[0];

            return (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-neutral-50"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-200 text-sm font-bold">
                  {otherUser.avatar ? (
                    <img src={otherUser.avatar} alt={otherUser.name} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    otherUser.name[0].toUpperCase()
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{otherUser.name}</span>
                    <span className="text-xs text-neutral-400">{formatDate(conv.updatedAt)}</span>
                  </div>
                  <p className="truncate text-xs text-neutral-500">
                    {conv.listing.title} — {formatPrice(conv.listing.price, conv.listing.currency)}
                    {conv.listing.status !== "ACTIVE" && (
                      <span className="ml-1.5 text-neutral-400">
                        ({LISTING_STATUS_LABELS[conv.listing.status] || "неактивно"})
                      </span>
                    )}
                  </p>
                  {lastMsg && <p className="mt-0.5 truncate text-sm text-neutral-600">{lastMsg.text}</p>}
                </div>

                {conv.unreadCount > 0 && (
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black text-xs text-white">
                    {conv.unreadCount}
                  </div>
                )}

                {conv.listing.images[0] && (
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                    <img src={conv.listing.images[0].url} alt="" className="h-full w-full object-cover" />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
