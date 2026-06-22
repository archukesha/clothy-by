"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { SlidersHorizontal, X, Search as SearchIcon, ChevronLeft, ChevronRight, Tag, Shirt } from "lucide-react";
import {
  CITIES,
  CONDITION_LABELS,
  GENDER_LABELS,
  CLOTHING_SIZES,
  SHOE_SIZES,
  BRAND_SEGMENT_LABELS,
  DELIVERY_OPTIONS,
} from "@/lib/constants";
import { pluralize } from "@/lib/utils";

interface Listing {
  id: string;
  title: string;
  price: number;
  originalPrice?: number | null;
  currency: string;
  condition: string;
  city: string;
  createdAt: string;
  promotedUntil?: string | null;
  images: { url: string }[];
  brand: { name: string; segment: string };
  category: { name: string };
  user: { name: string; avatar?: string | null };
  _count?: { favorites: number };
  delivery?: string;
}

export function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const page = parseInt(searchParams.get("page") || "1");
  const q = searchParams.get("q") || "";
  const [searchInput, setSearchInput] = useState(q);
  const [suggestions, setSuggestions] = useState<
    { type: "brand" | "category" | "listing"; label: string; slug: string }[]
  >([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  useEffect(() => {
    if (searchInput.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      fetch(`/api/search/suggestions?q=${encodeURIComponent(searchInput.trim())}`)
        .then((r) => r.json())
        .then((data) => {
          if (!cancelled) setSuggestions(data.suggestions || []);
        })
        .catch(() => {});
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchInput]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setSuggestionsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeFilterCount = ["city", "gender", "condition", "size", "minPrice", "maxPrice", "segment", "delivery"]
    .filter((key) => searchParams.get(key))
    .length;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params = new URLSearchParams(searchParams.toString());
    fetch(`/api/listings?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setListings(data.listings || []);
        setTotal(data.pagination?.total || 0);
        setTotalPages(data.pagination?.totalPages || 0);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  useEffect(() => {
    document.body.style.overflow = filtersOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [filtersOpen]);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set("page", "1");
    router.push(`${pathname}?${params}`);
  }

  function clearAllFilters() {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    const sort = searchParams.get("sort");
    if (sort) params.set("sort", sort);
    router.push(`${pathname}?${params}`);
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params}`);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuggestionsOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    if (searchInput.trim()) params.set("q", searchInput.trim());
    else params.delete("q");
    params.set("page", "1");
    router.push(`${pathname}?${params}`);
  }

  function selectSuggestion(suggestion: { type: "brand" | "category" | "listing"; label: string; slug: string }) {
    setSuggestionsOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("brand");
    params.delete("category");
    params.delete("activeLabel");
    params.delete("activeType");

    if (suggestion.type === "listing") {
      setSearchInput(suggestion.label);
      params.set("q", suggestion.label);
    } else {
      setSearchInput("");
      params.delete("q");
      params.set(suggestion.type, suggestion.slug);
      params.set("activeLabel", suggestion.label);
      params.set("activeType", suggestion.type);
    }

    params.set("page", "1");
    router.push(`${pathname}?${params}`);
  }

  function clearSearchInput() {
    setSearchInput("");
    setSuggestionsOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.delete("brand");
    params.delete("category");
    params.delete("activeLabel");
    params.delete("activeType");
    params.set("page", "1");
    router.push(`${pathname}?${params}`);
  }

  const conditionOptions = [{ value: "", label: "Любое" }, ...Object.entries(CONDITION_LABELS).map(([v, l]) => ({ value: v, label: l }))];
  const genderOptions = [{ value: "", label: "Все" }, ...Object.entries(GENDER_LABELS).map(([v, l]) => ({ value: v, label: l }))];
  const cityOptions = [{ value: "", label: "Все города" }, ...CITIES.map((c) => ({ value: c, label: c }))];
  const allSizes = [...new Set([...CLOTHING_SIZES, ...SHOE_SIZES])];
  const sizeOptions = [{ value: "", label: "Все размеры" }, ...allSizes.map((s) => ({ value: s, label: s }))];
  const segmentOptions = [{ value: "", label: "Все сегменты" }, ...Object.entries(BRAND_SEGMENT_LABELS).map(([v, l]) => ({ value: v, label: l }))];
  const deliveryOptions = [{ value: "", label: "Любая доставка" }, ...DELIVERY_OPTIONS.map((d) => ({ value: d.id, label: `${d.icon} ${d.name}` }))];
  const sortOptions = [
    { value: "newest", label: "Новые" },
    { value: "price_asc", label: "Дешевле" },
    { value: "price_desc", label: "Дороже" },
    { value: "popular", label: "Популярные" },
  ];

  const filterContent = (
    <div className="space-y-4">
      <Select label="Город" options={cityOptions} value={searchParams.get("city") || ""} onChange={(e) => updateFilter("city", e.target.value)} />
      <Select label="Для кого" options={genderOptions} value={searchParams.get("gender") || ""} onChange={(e) => updateFilter("gender", e.target.value)} />
      <Select label="Состояние" options={conditionOptions} value={searchParams.get("condition") || ""} onChange={(e) => updateFilter("condition", e.target.value)} />
      <Select label="Размер" options={sizeOptions} value={searchParams.get("size") || ""} onChange={(e) => updateFilter("size", e.target.value)} />
      <Select label="Сегмент" options={segmentOptions} value={searchParams.get("segment") || ""} onChange={(e) => updateFilter("segment", e.target.value)} />
      <Select label="Доставка" options={deliveryOptions} value={searchParams.get("delivery") || ""} onChange={(e) => updateFilter("delivery", e.target.value)} />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">Цена, BYN</label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="От"
            className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            defaultValue={searchParams.get("minPrice") || ""}
            onBlur={(e) => updateFilter("minPrice", e.target.value)}
          />
          <input
            type="number"
            placeholder="До"
            className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            defaultValue={searchParams.get("maxPrice") || ""}
            onBlur={(e) => updateFilter("maxPrice", e.target.value)}
          />
        </div>
      </div>

      {activeFilterCount > 0 && (
        <button onClick={clearAllFilters} className="text-sm text-red-500 transition-colors hover:text-red-700">
          Сбросить фильтры ({activeFilterCount})
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div ref={searchBoxRef} className="relative mb-4">
        <form onSubmit={handleSearchSubmit} className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onFocus={() => setSuggestionsOpen(true)}
            placeholder="Бренд, вещь, категория..."
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-3 pl-10 pr-10 text-sm focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-black"
          />
          {searchInput && (
            <button
              type="button"
              onClick={clearSearchInput}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

        {suggestionsOpen && suggestions.length > 0 && (
          <div className="absolute inset-x-0 top-full z-30 mt-1.5 animate-in fade-in overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg duration-150">
            {suggestions.map((s) => (
              <button
                key={`${s.type}-${s.slug}`}
                type="button"
                onClick={() => selectSuggestion(s)}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors hover:bg-neutral-50"
              >
                {s.type === "brand" ? (
                  <Tag className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                ) : s.type === "category" ? (
                  <Shirt className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                ) : (
                  <SearchIcon className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                )}
                <span className="truncate">{s.label}</span>
                <span className="ml-auto shrink-0 text-xs text-neutral-400">
                  {s.type === "brand" ? "бренд" : s.type === "category" ? "категория" : "товар"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {searchParams.get("activeLabel") && (
        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-sm">
            {searchParams.get("activeType") === "brand" ? "Бренд" : "Категория"}: {searchParams.get("activeLabel")}
            <button onClick={clearSearchInput} className="text-neutral-400 hover:text-neutral-600">
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        </div>
      )}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">{q ? `Результаты: "${q}"` : "Рекомендации"}</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            {pluralize(total, "объявление", "объявления", "объявлений")} найдено
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select options={sortOptions} value={searchParams.get("sort") || "newest"} onChange={(e) => updateFilter("sort", e.target.value)} className="w-32 sm:w-36" />
          <button
            onClick={() => setFiltersOpen(true)}
            className="relative flex shrink-0 items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-2 text-sm transition-colors hover:bg-neutral-50 md:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Фильтры
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-xs text-white">{activeFilterCount}</span>
            )}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        <aside className="hidden w-56 shrink-0 md:block">{filterContent}</aside>

        {filtersOpen && (
          <div className="fixed inset-0 z-[80] md:hidden">
            <div
              className="absolute inset-0 animate-in fade-in bg-black/40 duration-200"
              onClick={() => setFiltersOpen(false)}
            />
            <div className="animate-in slide-in-from-bottom absolute right-0 bottom-0 left-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white duration-200">
              <div className="sticky top-0 flex items-center justify-between border-b border-neutral-100 bg-white px-4 py-3">
                <span className="font-semibold">Фильтры</span>
                <button onClick={() => setFiltersOpen(false)} className="rounded-lg p-1.5 transition-colors hover:bg-neutral-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4">{filterContent}</div>
              <div className="sticky bottom-0 border-t border-neutral-100 bg-white p-4">
                <Button className="w-full" onClick={() => setFiltersOpen(false)}>
                  Показать {total} объявлений
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-neutral-100" />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="py-20 text-center">
              <SearchIcon className="mx-auto mb-4 h-12 w-12 text-neutral-200" />
              <h2 className="mb-1 text-lg font-semibold">Ничего не найдено</h2>
              <p className="text-sm text-neutral-500">Попробуйте изменить фильтры или поисковый запрос</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-neutral-500">{page} из {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
