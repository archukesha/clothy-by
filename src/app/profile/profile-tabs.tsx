"use client";

import { useState } from "react";
import { ListingCard } from "@/components/listing-card";
import { ListingStatusBadge } from "@/components/listing-status-badge";
import { AlertCircle, Archive, CheckCircle, Clock, Eye, Heart, Package, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ProfileListing {
  id: string;
  title: string;
  price: number;
  originalPrice?: number | null;
  currency: string;
  condition: string;
  city: string;
  createdAt: string | Date;
  promotedUntil?: string | Date | null;
  status: string;
  rejectionReason?: string | null;
  images: { url: string }[];
  brand: { name: string; segment: string };
  category: { name: string };
  user: { name: string; avatar: string | null };
  _count: { favorites: number };
  delivery?: string;
  views: number;
}

interface ProfileTabsProps {
  listings: ProfileListing[];
  counts: {
    active: number;
    moderation: number;
    rejected: number;
    sold: number;
    archived: number;
  };
}

const TABS = [
  { key: "active", label: "Активные", icon: CheckCircle, statuses: ["ACTIVE"] },
  { key: "moderation", label: "На проверке", icon: Clock, statuses: ["MODERATION"] },
  { key: "rejected", label: "Отклонённые", icon: AlertCircle, statuses: ["REJECTED"] },
  { key: "sold", label: "Продано", icon: ShoppingBag, statuses: ["SOLD"] },
  { key: "archived", label: "Архив", icon: Archive, statuses: ["ARCHIVED", "DRAFT"] },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const EMPTY_MESSAGES: Record<TabKey, string> = {
  active: "У вас пока нет активных объявлений",
  moderation: "Нет объявлений на проверке",
  rejected: "Нет отклонённых объявлений",
  sold: "Нет проданных товаров",
  archived: "Архив пуст",
};

export function ProfileTabs({ listings, counts }: ProfileTabsProps) {
  const [tab, setTab] = useState<TabKey>("active");

  const currentTab = TABS.find((t) => t.key === tab)!;
  const filtered = listings.filter((l) => (currentTab.statuses as readonly string[]).includes(l.status));

  return (
    <div>
      <div className="-mx-4 mb-6 flex gap-1 overflow-x-auto border-b border-neutral-200 px-4">
        {TABS.map((t) => {
          const count = counts[t.key];
          const isActive = tab === t.key;
          const Icon = t.icon;

          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-xs font-medium transition-colors ${
                isActive ? "border-black text-black" : "border-transparent text-neutral-400 hover:text-neutral-600"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
              {count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${isActive ? "bg-black text-white" : "bg-neutral-100 text-neutral-500"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <Package className="mx-auto mb-3 h-12 w-12 text-neutral-300" />
          <p className="mb-4 text-neutral-500">{EMPTY_MESSAGES[tab]}</p>
          {tab === "active" && (
            <Link href="/listings/new">
              <Button>Создать объявление</Button>
            </Link>
          )}
        </div>
      ) : (
        <div>
          {tab === "moderation" && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">
              <Clock className="h-4 w-4 shrink-0" />
              Объявления проверяются администратором. Обычно это занимает до 24 часов.
            </div>
          )}
          {tab === "rejected" && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>
                Объявления не прошли проверку.{" "}
                <a
                  href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "Clothy_by_bot"}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline"
                >
                  Связаться с поддержкой
                </a>
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {filtered.map((listing) => (
              <div key={listing.id} className="relative">
                <ListingCard listing={listing} />
                {listing.status === "REJECTED" && listing.rejectionReason && (
                  <p className="mt-1.5 rounded-lg bg-red-50 px-2 py-1.5 text-xs text-red-700">
                    Причина: {listing.rejectionReason}
                  </p>
                )}
                {listing.status !== "ACTIVE" && (
                  <div className="absolute top-2 left-2 z-10">
                    <ListingStatusBadge status={listing.status} />
                  </div>
                )}
                <div className="mt-1.5 flex items-center gap-3 text-xs text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" /> {listing.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5" /> {listing._count.favorites}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
