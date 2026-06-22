"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, Plus } from "lucide-react";
import { useTelegram } from "@/context/telegram";
import { useToast } from "@/components/ui/toast";
import { BRAND_SEGMENT_LABELS } from "@/lib/constants";

interface Brand {
  id: string;
  name: string;
  segment: string;
  _count: { listings: number };
}

export function BrandManager({ initialBrands }: { initialBrands: Brand[] }) {
  const { token } = useTelegram();
  const { toast, confirm } = useToast();
  const router = useRouter();
  const [name, setName] = useState("");
  const [segment, setSegment] = useState("MASS_MARKET");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim(), segment }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Ошибка");

      toast("Бренд добавлен");
      setName("");
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Ошибка", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    const ok = await confirm("Удалить бренд?");
    if (!ok) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/brands/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Ошибка");

      toast("Бренд удалён");
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Ошибка", "error");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreate} className="flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Название бренда"
          className="rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black"
        />
        <select
          value={segment}
          onChange={(e) => setSegment(e.target.value)}
          className="rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black"
        >
          {Object.entries(BRAND_SEGMENT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-1.5 rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Добавить
        </button>
      </form>

      <div className="space-y-1.5">
        {initialBrands.map((brand) => (
          <div key={brand.id} className="flex items-center justify-between rounded-xl border border-neutral-200 px-3 py-2">
            <div>
              <span className="text-sm font-medium">{brand.name}</span>
              <span className="ml-2 text-xs text-neutral-400">
                {BRAND_SEGMENT_LABELS[brand.segment] || brand.segment} · {brand._count.listings} объявлений
              </span>
            </div>
            <button
              onClick={() => handleDelete(brand.id)}
              disabled={deletingId === brand.id}
              className="text-neutral-400 hover:text-red-600 disabled:opacity-50"
            >
              {deletingId === brand.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
