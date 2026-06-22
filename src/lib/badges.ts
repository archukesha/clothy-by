export interface SellerBadge {
  icon: string;
  label: string;
  className: string;
}

export const ADMIN_BADGE: SellerBadge = {
  icon: "🛡️",
  label: "Администратор",
  className: "bg-gradient-to-r from-neutral-900 to-neutral-700 text-white",
};

export const MODERATOR_BADGE: SellerBadge = {
  icon: "🛡️",
  label: "Модератор",
  className: "bg-neutral-800 text-white",
};

export interface SellerStatsInput {
  createdAt: Date;
  soldCount: number;
  activeCount: number;
  avgRating: number | null;
  reviewCount: number;
}

export function getSellerBadges(stats: SellerStatsInput): SellerBadge[] {
  const badges: SellerBadge[] = [];

  const accountAgeDays = (Date.now() - stats.createdAt.getTime()) / (1000 * 60 * 60 * 24);

  if (stats.avgRating !== null && stats.avgRating >= 4.7 && stats.reviewCount >= 5) {
    badges.push({ icon: "⭐", label: "Любимец покупателей", className: "bg-amber-100 text-amber-800" });
  }

  if (stats.soldCount >= 30) {
    badges.push({ icon: "🏆", label: "Топ продавец", className: "bg-purple-100 text-purple-800" });
  } else if (stats.soldCount >= 10) {
    badges.push({ icon: "📦", label: "Опытный продавец", className: "bg-blue-100 text-blue-800" });
  }

  if (stats.activeCount >= 5) {
    badges.push({ icon: "🔥", label: "Активный продавец", className: "bg-orange-100 text-orange-800" });
  }

  if (accountAgeDays < 14) {
    badges.push({ icon: "🌱", label: "Новичок", className: "bg-green-100 text-green-800" });
  }

  return badges;
}
