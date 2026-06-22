"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useTelegram } from "@/context/telegram";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/image-upload";
import { CategorySelect } from "@/components/category-select";
import { DeliverySelect } from "@/components/delivery-select";
import { Autocomplete } from "@/components/autocomplete";
import { useToast } from "@/components/ui/toast";
import {
  BRAND_SEGMENT_LABELS,
  CITIES,
  CLOTHING_SIZES,
  COLOR_OPTIONS,
  CONDITION_LABELS,
  CURRENCY_SYMBOLS,
  GENDER_LABELS,
  SHOE_SIZES,
} from "@/lib/constants";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  children?: CategoryOption[];
}

interface BrandOption {
  id: string;
  name: string;
  segment: string;
}

interface ListingFormValues {
  id?: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  currency: string;
  condition: string;
  gender: string;
  size?: string | null;
  color?: string | null;
  city: string;
  categoryId: string;
  brandId: string;
  quantity: number;
  images: string[];
  delivery: string[];
}

interface ListingFormProps {
  mode: "create" | "edit";
  initialValues?: Partial<ListingFormValues>;
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-4 border-b border-neutral-100 py-6 md:grid-cols-3 md:gap-8">
      <div className="md:col-span-1">
        <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
        {description ? (
          <p className="mt-1 text-xs leading-relaxed text-neutral-500">{description}</p>
        ) : null}
      </div>
      <div className="space-y-4 md:col-span-2">{children}</div>
    </section>
  );
}

export function ListingForm({ mode, initialValues }: ListingFormProps) {
  const router = useRouter();
  const { token, isLoading } = useTelegram();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(initialValues?.categoryId ?? "");
  const [imageUrls, setImageUrls] = useState<string[]>(initialValues?.images ?? []);
  const [delivery, setDelivery] = useState<string[]>(initialValues?.delivery ?? []);
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [brandId, setBrandId] = useState(initialValues?.brandId ?? "");
  const [color, setColor] = useState(initialValues?.color ?? "");
  const [currency, setCurrency] = useState(initialValues?.currency ?? "BYN");

  useEffect(() => {
    fetch("/api/categories").then((response) => response.json()).then(setCategories);
    fetch("/api/brands").then((response) => response.json()).then(setBrands);
  }, []);

  const flatCats = categories.flatMap((category) =>
    [category, ...(category.children?.map((child) => ({ ...child, parent: category })) || [])]
  ) as Array<CategoryOption & { parent?: CategoryOption }>;

  const chosenCat = flatCats.find((category) => category.id === selectedCategory);
  const chosenParent = chosenCat?.parent;

  const isShoeCategory =
    chosenCat?.slug === "sneakers" ||
    chosenCat?.slug === "boots" ||
    chosenCat?.slug === "dress-shoes" ||
    chosenCat?.slug === "sandals" ||
    chosenCat?.slug === "sport-shoes" ||
    categories.find((category) => category.slug === "shoes")?.id === selectedCategory;

  const sizeOptions = useMemo(
    () =>
      (isShoeCategory ? SHOE_SIZES : CLOTHING_SIZES).map((size) => ({
        value: size,
        label: size,
      })),
    [isShoeCategory]
  );

  const brandOptions = useMemo(
    () =>
      brands.map((brand) => ({
        value: brand.id,
        label: brand.name,
        hint: BRAND_SEGMENT_LABELS[brand.segment] || undefined,
      })),
    [brands]
  );

  const colorOptions = useMemo(
    () =>
      COLOR_OPTIONS.map((item) => ({
        value: item.value,
        label: item.value,
        swatch: item.hex,
      })),
    []
  );

  if (!isLoading && !token) {
    router.push("/");
    return null;
  }

  const conditionOptions = Object.entries(CONDITION_LABELS).map(([value, label]) => ({ value, label }));
  const genderOptions = Object.entries(GENDER_LABELS).map(([value, label]) => ({ value, label }));
  const cityOptions = CITIES.map((city) => ({ value: city, label: city }));

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    if (imageUrls.length === 0) {
      setError("Добавьте хотя бы одно фото");
      setLoading(false);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const safeCategoryId =
      selectedCategory ||
      (formData.get("categoryId") as string) ||
      initialValues?.categoryId ||
      "";
    const safeBrandId =
      (formData.get("brandId") as string) ||
      brandId ||
      initialValues?.brandId ||
      "";
    const safeColor =
      (formData.get("color") as string) ||
      color ||
      initialValues?.color ||
      "";
    const data = {
      title: formData.get("title"),
      description: formData.get("description"),
      price: parseFloat(formData.get("price") as string),
      originalPrice: formData.get("originalPrice")
        ? parseFloat(formData.get("originalPrice") as string)
        : null,
      currency,
      condition: formData.get("condition"),
      gender: formData.get("gender"),
      size: formData.get("size"),
      color: safeColor,
      city: formData.get("city"),
      categoryId: safeCategoryId,
      brandId: safeBrandId,
      quantity: parseInt((formData.get("quantity") as string) || "1", 10) || 1,
      images: imageUrls,
      delivery: JSON.stringify(delivery),
    };

    if (!safeCategoryId) {
      setError("Выберите категорию");
      setLoading(false);
      return;
    }

    if (!safeBrandId) {
      setError("Выберите бренд");
      setLoading(false);
      return;
    }

    const url = mode === "create" ? "/api/listings" : `/api/listings/${initialValues?.id}`;
    const method = mode === "create" ? "POST" : "PATCH";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        setError(body?.error || "Что-то пошло не так. Попробуйте ещё раз.");
        setLoading(false);
        return;
      }

      toast(
        mode === "create"
          ? "Объявление отправлено на модерацию"
          : "Изменения сохранены и отправлены на модерацию"
      );
      router.push(`/listings/${body.id}`);
      router.refresh();
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз.");
      setLoading(false);
    }
  }

  const cancelHref = mode === "create" ? "/profile" : `/listings/${initialValues?.id}`;

  function handleCancel() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tg = (window as any).Telegram?.WebApp;
    const message = "Вы уверены, что хотите выйти? Все несохранённые изменения будут удалены.";

    if (tg?.showConfirm) {
      tg.showConfirm(message, (confirmed: boolean) => {
        if (confirmed) router.push(cancelHref);
      });
    } else if (window.confirm(message)) {
      router.push(cancelHref);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <button
        type="button"
        onClick={handleCancel}
        className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 transition-colors hover:text-black"
      >
        <ArrowLeft className="h-4 w-4" />
        {mode === "create" ? "Мои объявления" : "Назад к объявлению"}
      </button>

      <nav className="mb-2 flex flex-wrap items-center gap-1 text-xs text-neutral-400">
        <span>Clothy.by</span>
        <ChevronRight className="h-3 w-3" />
        <span>{mode === "create" ? "Новое объявление" : "Редактирование"}</span>
        {chosenParent ? (
          <>
            <ChevronRight className="h-3 w-3" />
            <span>{chosenParent.name}</span>
          </>
        ) : null}
        {chosenCat ? (
          <>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-neutral-900">{chosenCat.name}</span>
          </>
        ) : null}
      </nav>

      <h1 className="mb-8 text-3xl font-bold">
        {mode === "create" ? "Новое объявление" : "Редактировать объявление"}
      </h1>

      <form onSubmit={handleSubmit}>
        <Section
          title="Категория"
          description="Выберите категорию, чтобы покупателю было проще найти ваше объявление."
        >
          <CategorySelect categories={categories} value={selectedCategory} onChange={setSelectedCategory} required />
        </Section>

        <Section
          title="Название"
          description="Укажите бренд, модель и ключевые детали вещи."
        >
          <Input
            id="title"
            name="title"
            placeholder='Например, "Nike Air Force 1 Low White"'
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            maxLength={120}
          />
          <p className="text-xs text-neutral-400">{title.length}/120 символов</p>
        </Section>

        <Section
          title="Фотографии"
          description="До 8 фото. Первое фото станет обложкой объявления."
        >
          <ImageUpload images={imageUrls} onChange={setImageUrls} token={token} />
        </Section>

        <Section
          title="Состояние"
          description="Пожалуйста, указывайте состояние честно."
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              Состояние вещи <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {conditionOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-neutral-200 p-3 transition-all hover:border-neutral-400 has-[:checked]:border-black has-[:checked]:bg-neutral-50"
                >
                  <input
                    type="radio"
                    name="condition"
                    value={option.value}
                    defaultChecked={(initialValues?.condition ?? "USED_EXCELLENT") === option.value}
                    className="mt-0.5 accent-black"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </Section>

        <Section
          title="Характеристики"
          description="Это поможет покупателям быстрее найти объявление через фильтры."
        >
          <Autocomplete
            name="brandId"
            label="Бренд"
            options={brandOptions}
            placeholder="Nike, Adidas, Zara..."
            help="Если бренда нет в списке, временно выберите ближайший подходящий."
            required
            defaultValue={initialValues?.brandId ?? ""}
            onChange={setBrandId}
          />

          <Autocomplete
            name="color"
            label="Цвет"
            options={colorOptions}
            placeholder="Выберите цвет"
            help="Можно выбрать из списка или ввести свой вариант."
            defaultValue={initialValues?.color ?? ""}
            allowCustom
            onChange={setColor}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                Для кого <span className="text-red-500">*</span>
              </label>
              <select
                name="gender"
                defaultValue={initialValues?.gender ?? "UNISEX"}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black"
              >
                {genderOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <Autocomplete
              name="size"
              label="Размер"
              options={sizeOptions}
              placeholder={isShoeCategory ? "Например, 42" : "Например, M"}
              allowCustom
              defaultValue={initialValues?.size ?? ""}
              help={isShoeCategory ? "Размер обуви (EU)" : "Размер одежды"}
            />
          </div>
        </Section>

        <Section
          title="Описание"
          description="Опишите состояние, материал и важные детали для покупателя."
        >
          <textarea
            id="description"
            name="description"
            rows={5}
            defaultValue={initialValues?.description ?? ""}
            placeholder="Например: носили один сезон, без пятен и дефектов."
            required
            maxLength={2000}
            className="w-full resize-y rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black"
          />
          <p className="text-xs text-neutral-400">
            Не указывайте телефон и email в описании — для этого есть встроенный чат.
          </p>
        </Section>

        <Section
          title="Цена"
          description="Цена из магазина — необязательное поле."
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                Ваша цена <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="price"
                  name="price"
                  type="number"
                  defaultValue={initialValues?.price ?? ""}
                  placeholder="0"
                  required
                  min={0}
                  max={100000}
                  step={0.01}
                  className="w-full rounded-xl border border-neutral-200 py-2.5 pl-4 pr-12 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
                  {CURRENCY_SYMBOLS[currency]}
                </span>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                Цена в магазине
              </label>
              <div className="relative">
                <input
                  id="originalPrice"
                  name="originalPrice"
                  type="number"
                  defaultValue={initialValues?.originalPrice ?? ""}
                  placeholder="Необязательно"
                  min={0}
                  max={100000}
                  step={0.01}
                  className="w-full rounded-xl border border-neutral-200 py-2.5 pl-4 pr-12 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
                  {CURRENCY_SYMBOLS[currency]}
                </span>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Количество</label>
              <input
                name="quantity"
                type="number"
                defaultValue={initialValues?.quantity ?? 1}
                min={1}
                max={999}
                className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">Валюта</label>
            <div className="flex gap-2">
              {Object.entries(CURRENCY_SYMBOLS).map(([value, symbol]) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setCurrency(value)}
                  className={`rounded-lg border px-4 py-1.5 text-sm font-medium transition-all ${
                    currency === value
                      ? "border-black bg-black text-white"
                      : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
                  }`}
                >
                  {value} <span className="ml-0.5 opacity-60">{symbol}</span>
                </button>
              ))}
            </div>
          </div>
        </Section>

        <Section
          title="Где и как"
          description="Укажите город и способы передачи вещи."
        >
          <Autocomplete
            name="city"
            label="Город"
            options={cityOptions}
            placeholder="Выберите город"
            defaultValue={initialValues?.city ?? ""}
            selectOnly
            required
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">Доставка</label>
            <DeliverySelect selected={delivery} onChange={setDelivery} />
            <p className="mt-1.5 text-xs text-neutral-400">
              Можно выбрать несколько способов или оставить только личную встречу.
            </p>
          </div>
        </Section>

        <div className="sticky bottom-0 -mx-4 mt-6 border-t border-neutral-200 bg-white/95 px-4 py-4 backdrop-blur-sm">
          {error ? (
            <div className="mx-auto mb-3 max-w-4xl rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>
          ) : null}
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
            <p className="hidden text-xs text-neutral-400 sm:block">
              {mode === "create"
                ? "После публикации объявление уйдёт на модерацию."
                : "После изменений объявление снова уйдёт на модерацию."}
            </p>
            <div className="ml-auto flex gap-2">
              <Button type="button" variant="ghost" onClick={handleCancel}>
                Отмена
              </Button>
              <Button type="submit" disabled={loading}>
                {loading
                  ? mode === "create" ? "Отправляем..." : "Сохраняем..."
                  : mode === "create" ? "Опубликовать" : "Сохранить"}
              </Button>
            </div>
          </div>
        </div>

        <input type="hidden" value={brandId} readOnly hidden />
        <input type="hidden" value={color} readOnly hidden />
      </form>
    </div>
  );
}
