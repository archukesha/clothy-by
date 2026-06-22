"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useTelegram } from "@/context/telegram";
import { Heart, MessageCircle, Trash2, CheckCircle, RotateCcw, Share2, Pencil } from "lucide-react";
import { ReportButton } from "@/components/report-button";

interface ListingActionsProps {
  listingId: string;
  isOwner: boolean;
  isFavorite: boolean;
  isLoggedIn: boolean;
  sellerId: string;
  status: string;
  promotedUntil?: string | null;
}

export function ListingActions({
  listingId,
  isOwner,
  isFavorite: initialFav,
  isLoggedIn,
  sellerId,
  status,
}: ListingActionsProps) {
  const router = useRouter();
  const { toast, confirm } = useToast();
  const { token } = useTelegram();
  const [isFav, setIsFav] = useState(initialFav);
  const [loading, setLoading] = useState(false);

  function authHeaders(): HeadersInit {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function toggleFavorite() {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/favorite`, {
        method: "POST",
        headers: authHeaders(),
      });
      if (res.ok) {
        setIsFav(!isFav);
        toast(isFav ? "Удалено из избранного" : "Добавлено в избранное");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleContact() {
    if (!isLoggedIn) return;
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...((authHeaders() as Record<string, string>) || {}) },
      body: JSON.stringify({ listingId, sellerId }),
    });
    if (res.ok) {
      const conv = await res.json();
      router.push(`/messages/${conv.id}`);
    } else {
      toast("Ошибка при открытии чата", "error");
    }
  }

  async function handleDelete() {
    const ok = await confirm("Удалить объявление? Это действие нельзя отменить.");
    if (!ok) return;

    const res = await fetch(`/api/listings/${listingId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (res.ok) {
      toast("Объявление удалено");
      router.push("/profile");
    } else {
      toast("Ошибка при удалении", "error");
    }
  }

  async function handleStatusChange(newStatus: string) {
    const msg =
      newStatus === "SOLD" ? "Отметить как продано?" : "Вернуть в продажу? Объявление снова отправится на проверку.";
    const ok = await confirm(msg);
    if (!ok) return;

    const res = await fetch(`/api/listings/${listingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...((authHeaders() as Record<string, string>) || {}) },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      toast(newStatus === "SOLD" ? "Отмечено как продано" : "Отправлено на проверку");
      router.refresh();
    } else {
      toast("Ошибка", "error");
    }
  }

  async function handleShare() {
    const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || "Clothy_by_bot";
    const url = `https://t.me/${botUsername}?startapp=listing_${listingId}`;
    if (navigator.share) {
      try {
        await navigator.share({ url });
      } catch {
        // cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast("Ссылка скопирована");
    }
  }

  if (isOwner) {
    const isSold = status === "SOLD" || status === "ARCHIVED";
    const isActive = status === "ACTIVE";

    return (
      <div className="space-y-2">
        {isSold ? (
          <Button variant="outline" className="w-full" onClick={() => handleStatusChange("ACTIVE")}>
            <RotateCcw className="w-4 h-4" /> Вернуть в продажу
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push(`/listings/${listingId}/edit`)}
            >
              <Pencil className="w-4 h-4" /> Редактировать
            </Button>
            {isActive && (
              <Button
                variant="primary"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleStatusChange("SOLD")}
              >
                <CheckCircle className="w-4 h-4" /> Продано
              </Button>
            )}
            <Button variant="ghost" onClick={handleShare} title="Поделиться">
              <Share2 className="w-4 h-4" />
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button className="w-full" size="lg" onClick={handleContact} disabled={!isLoggedIn}>
        <MessageCircle className="w-4 h-4" /> Написать продавцу
      </Button>
      <div className="flex gap-2">
        <Button
          variant={isFav ? "primary" : "outline"}
          className="flex-1"
          onClick={toggleFavorite}
          disabled={loading || !isLoggedIn}
        >
          <Heart className={`w-4 h-4 ${isFav ? "fill-white" : ""}`} />
          {isFav ? "В избранном" : "В избранное"}
        </Button>
        <Button variant="ghost" onClick={handleShare} title="Поделиться">
          <Share2 className="w-4 h-4" />
        </Button>
        <ReportButton targetType="LISTING" listingId={listingId} />
      </div>
    </div>
  );
}
