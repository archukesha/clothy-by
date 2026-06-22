"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTelegram } from "@/context/telegram";
import { useParams } from "next/navigation";
import { Send, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { formatDate, formatPrice } from "@/lib/utils";

interface Message {
  id: string;
  text: string;
  createdAt: string;
  sender: { id: string; name: string; avatar?: string | null };
}

interface ConversationInfo {
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
}

const LISTING_STATUS_LABELS: Record<string, string> = {
  SOLD: "Продано",
  ARCHIVED: "В архиве",
  MODERATION: "На проверке",
  REJECTED: "Отклонено",
};

export default function ChatPage() {
  const { user, token, isLoading } = useTelegram();
  const params = useParams();
  const conversationId = params.id as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [convInfo, setConvInfo] = useState<ConversationInfo | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setMessages(await res.json());
    } finally {
      setLoading(false);
    }
  }, [conversationId, token]);

  useEffect(() => {
    if (isLoading || !user || !token) return;

    fetch(`/api/conversations/${conversationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setConvInfo);

    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [user, token, isLoading, conversationId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || sending || !token) return;

    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: newMessage }),
      });

      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        setNewMessage("");
      }
    } finally {
      setSending(false);
    }
  }

  const otherUser = convInfo ? (convInfo.user1.id === user?.id ? convInfo.user2 : convInfo.user1) : null;

  if (isLoading || loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`h-10 animate-pulse rounded-xl bg-neutral-100 ${i % 2 === 0 ? "w-2/3" : "ml-auto w-1/2"}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      <div className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3">
        <Link href="/messages" className="shrink-0 rounded-lg p-2 transition-colors hover:bg-neutral-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>

        {otherUser ? (
          <Link href={`/sellers/${otherUser.id}`} className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-200 text-sm font-bold">
              {otherUser.avatar ? (
                <img src={otherUser.avatar} alt={otherUser.name} className="h-full w-full object-cover" />
              ) : (
                otherUser.name[0].toUpperCase()
              )}
            </div>
            <span className="truncate text-sm font-semibold">{otherUser.name}</span>
          </Link>
        ) : (
          <h1 className="font-semibold">Чат</h1>
        )}
      </div>

      {convInfo?.listing && (
        <Link
          href={`/listings/${convInfo.listing.id}`}
          className="flex shrink-0 items-center gap-3 border-b border-neutral-100 bg-neutral-50 px-4 py-2.5 transition-colors hover:bg-neutral-100"
        >
          {convInfo.listing.images[0] && (
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-neutral-200">
              <img src={convInfo.listing.images[0].url} alt="" className="h-full w-full object-cover" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-neutral-400">Объявление</p>
            <p className="truncate text-sm font-medium text-neutral-900">{convInfo.listing.title}</p>
          </div>
          {convInfo.listing.status !== "ACTIVE" ? (
            <span className="shrink-0 rounded-full bg-neutral-200 px-2 py-1 text-[11px] font-medium text-neutral-600">
              {LISTING_STATUS_LABELS[convInfo.listing.status] || "Неактивно"}
            </span>
          ) : (
            <p className="shrink-0 text-sm font-semibold">{formatPrice(convInfo.listing.price, convInfo.listing.currency)}</p>
          )}
        </Link>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((msg) => {
          const isOwn = msg.sender.id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] min-w-0 rounded-2xl px-4 py-2.5 ${isOwn ? "rounded-br-md bg-black text-white" : "rounded-bl-md bg-neutral-100 text-neutral-900"}`}>
                {!isOwn && <p className="mb-0.5 text-xs font-medium opacity-70">{msg.sender.name}</p>}
                <p className="whitespace-pre-line break-words text-sm">{msg.text}</p>
                <p className={`mt-1 text-[10px] ${isOwn ? "text-white/50" : "text-neutral-400"}`}>{formatDate(msg.createdAt)}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-neutral-100 px-4 py-3">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Напишите сообщение..."
          maxLength={2000}
          className="flex-1 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-black text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
