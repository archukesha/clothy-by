const STATUS_CONFIG: Record<string, { className: string; label: string }> = {
  MODERATION: { className: "bg-amber-100 text-amber-800", label: "На проверке" },
  REJECTED: { className: "bg-red-100 text-red-800", label: "Отклонено" },
  SOLD: { className: "bg-green-100 text-green-800", label: "Продано" },
  ARCHIVED: { className: "bg-neutral-100 text-neutral-600", label: "В архиве" },
  DRAFT: { className: "bg-neutral-100 text-neutral-600", label: "Черновик" },
};

export function ListingStatusBadge({ status }: { status: string }) {
  const current = STATUS_CONFIG[status] || { className: "bg-neutral-100 text-neutral-600", label: status };
  return <span className={`rounded-full px-2 py-1 text-[10px] font-medium ${current.className}`}>{current.label}</span>;
}
