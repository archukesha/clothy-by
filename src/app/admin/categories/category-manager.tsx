"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, Plus } from "lucide-react";
import { useTelegram } from "@/context/telegram";
import { useToast } from "@/components/ui/toast";

interface Category {
  id: string;
  name: string;
  _count: { listings: number };
  children: { id: string; name: string; _count: { listings: number } }[];
}

export function CategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  const { token } = useTelegram();
  const { toast, confirm } = useToast();
  const router = useRouter();
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim(), parentId: parentId || undefined }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Ошибка");

      toast("Категория добавлена");
      setName("");
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Ошибка", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    const ok = await confirm("Удалить категорию?");
    if (!ok) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Ошибка");

      toast("Категория удалена");
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
          placeholder="Название категории"
          className="rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black"
        />
        <select
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          className="rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black"
        >
          <option value="">Корневая категория</option>
          {initialCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
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

      <div className="space-y-3">
        {initialCategories.map((cat) => (
          <div key={cat.id} className="rounded-xl border border-neutral-200 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">
                {cat.name} <span className="text-xs text-neutral-400">({cat._count.listings} объявлений)</span>
              </span>
              <button
                onClick={() => handleDelete(cat.id)}
                disabled={deletingId === cat.id}
                className="text-neutral-400 hover:text-red-600 disabled:opacity-50"
              >
                {deletingId === cat.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            </div>
            {cat.children.length > 0 && (
              <div className="mt-2 space-y-1 border-t border-neutral-100 pt-2">
                {cat.children.map((child) => (
                  <div key={child.id} className="flex items-center justify-between pl-3">
                    <span className="text-sm text-neutral-600">
                      {child.name} <span className="text-xs text-neutral-400">({child._count.listings})</span>
                    </span>
                    <button
                      onClick={() => handleDelete(child.id)}
                      disabled={deletingId === child.id}
                      className="text-neutral-400 hover:text-red-600 disabled:opacity-50"
                    >
                      {deletingId === child.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
