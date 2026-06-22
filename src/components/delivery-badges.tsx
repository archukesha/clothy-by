"use client";

import { DELIVERY_OPTIONS } from "@/lib/constants";

interface DeliveryBadgesProps {
  delivery: string[];
  size?: "sm" | "md";
}

export function DeliveryBadges({ delivery, size = "sm" }: DeliveryBadgesProps) {
  if (!delivery || delivery.length === 0) return null;

  const opts = DELIVERY_OPTIONS.filter((o) => delivery.includes(o.id));
  if (opts.length === 0) return null;

  if (size === "sm") {
    return (
      <div className="flex items-center gap-1">
        {opts.map((opt) => (
          <span
            key={opt.id}
            title={opt.name}
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium ${opt.bgLight} ${opt.textColor}`}
          >
            <span>{opt.icon}</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {opts.map((opt) => (
        <span
          key={opt.id}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${opt.bgLight} ${opt.textColor}`}
        >
          <span>{opt.icon}</span>
          {opt.name}
        </span>
      ))}
    </div>
  );
}
