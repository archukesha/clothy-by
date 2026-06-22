import type { SellerBadge } from "@/lib/badges";

export function SellerBadges({ badges }: { badges: SellerBadge[] }) {
  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((badge) => (
        <span
          key={badge.label}
          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${badge.className}`}
        >
          <span>{badge.icon}</span>
          {badge.label}
        </span>
      ))}
    </div>
  );
}
