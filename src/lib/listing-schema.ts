import { z } from "zod";
import { CITIES } from "@/lib/constants";

export const MAX_PRICE = 100_000;

export const createListingSchema = z.object({
  title: z
    .string()
    .min(3, "Название должно содержать минимум 3 символа")
    .max(120, "Название не должно превышать 120 символов"),
  description: z
    .string()
    .min(10, "Описание должно содержать минимум 10 символов")
    .max(2000, "Описание не должно превышать 2000 символов"),
  price: z
    .number()
    .min(0, "Цена не может быть отрицательной")
    .max(MAX_PRICE, `Цена не может превышать ${MAX_PRICE.toLocaleString("ru-RU")}`),
  originalPrice: z
    .number()
    .min(0, "Цена не может быть отрицательной")
    .max(MAX_PRICE, `Цена не может превышать ${MAX_PRICE.toLocaleString("ru-RU")}`)
    .nullable()
    .optional(),
  currency: z.enum(["BYN", "USD", "EUR", "RUB"]).default("BYN"),
  condition: z
    .enum(["NEW_WITH_TAGS", "NEW_WITHOUT_TAGS", "USED_EXCELLENT", "USED_GOOD", "USED_FAIR"])
    .default("USED_EXCELLENT"),
  gender: z.enum(["MEN", "WOMEN", "UNISEX", "KIDS"]).default("UNISEX"),
  size: z.string().max(20).optional(),
  color: z.string().max(40).optional(),
  city: z.enum(CITIES, { message: "Выберите город из списка" }),
  categoryId: z.string().min(1, "Выберите категорию"),
  brandId: z.string().min(1, "Выберите бренд"),
  quantity: z.number().int().min(1).max(999).default(1),
  images: z.array(z.string().min(1)).min(1, "Добавьте хотя бы одно фото").default([]),
  delivery: z.string().default("[]"),
});

export const updateListingSchema = createListingSchema.partial();
