export const CITIES = [
  "Минск",
  "Брест",
  "Витебск",
  "Гомель",
  "Гродно",
  "Могилёв",
  "Бобруйск",
  "Барановичи",
  "Борисов",
  "Пинск",
  "Орша",
  "Мозырь",
  "Солигорск",
  "Новополоцк",
  "Лида",
  "Молодечно",
  "Полоцк",
  "Жлобин",
  "Светлогорск",
  "Речица",
] as const;

export const CONDITION_LABELS: Record<string, string> = {
  NEW_WITH_TAGS: "Новое с бирками",
  NEW_WITHOUT_TAGS: "Новое без бирок",
  USED_EXCELLENT: "Б/у отличное",
  USED_GOOD: "Б/у хорошее",
  USED_FAIR: "Б/у удовлетворительное",
};

export const GENDER_LABELS: Record<string, string> = {
  MEN: "Мужское",
  WOMEN: "Женское",
  UNISEX: "Унисекс",
  KIDS: "Детское",
};

export const CURRENCY_LABELS: Record<string, string> = {
  BYN: "BYN",
  USD: "USD",
  EUR: "EUR",
  RUB: "RUB",
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  BYN: "Br",
  USD: "$",
  EUR: "€",
  RUB: "₽",
};

export const BRAND_SEGMENT_LABELS: Record<string, string> = {
  LUXURY: "Люкс",
  PREMIUM: "Премиум",
  MASS_MARKET: "Масс-маркет",
  STREETWEAR: "Стритвир",
  SPORT: "Спорт",
};

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Черновик",
  MODERATION: "На модерации",
  ACTIVE: "Активно",
  REJECTED: "Отклонено",
  SOLD: "Продано",
  ARCHIVED: "В архиве",
};

export const CLOTHING_SIZES = [
  "XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL",
  "40", "42", "44", "46", "48", "50", "52", "54", "56",
] as const;

export const SHOE_SIZES = [
  "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47",
] as const;

export const ACCESSORY_SIZES = ["One Size"] as const;

export const DELIVERY_OPTIONS = [
  {
    id: "europochta",
    name: "Европочта",
    color: "bg-blue-500",
    textColor: "text-blue-600",
    bgLight: "bg-blue-50",
    icon: "📦",
  },
  {
    id: "belpochta",
    name: "Белпочта",
    color: "bg-orange-500",
    textColor: "text-orange-600",
    bgLight: "bg-orange-50",
    icon: "📮",
  },
  {
    id: "cdek",
    name: "СДЭК",
    color: "bg-green-600",
    textColor: "text-green-700",
    bgLight: "bg-green-50",
    icon: "🚚",
  },
] as const;

export const DELIVERY_LABELS: Record<string, string> = {
  europochta: "Европочта",
  belpochta: "Белпочта",
  cdek: "СДЭК",
};

export const COLOR_OPTIONS = [
  { value: "Чёрный", hex: "#000000" },
  { value: "Белый", hex: "#ffffff" },
  { value: "Серый", hex: "#9ca3af" },
  { value: "Бежевый", hex: "#d4b896" },
  { value: "Коричневый", hex: "#7c5c3f" },
  { value: "Красный", hex: "#dc2626" },
  { value: "Розовый", hex: "#ec4899" },
  { value: "Оранжевый", hex: "#f97316" },
  { value: "Жёлтый", hex: "#eab308" },
  { value: "Зелёный", hex: "#16a34a" },
  { value: "Голубой", hex: "#0ea5e9" },
  { value: "Синий", hex: "#2563eb" },
  { value: "Фиолетовый", hex: "#7c3aed" },
  { value: "Бордовый", hex: "#7f1d1d" },
  { value: "Хаки", hex: "#6b6e3a" },
  { value: "Золотой", hex: "#d4a017" },
  { value: "Серебряный", hex: "#cbd5e1" },
  { value: "Разноцветный", hex: "linear-gradient(135deg,#ef4444,#eab308,#22c55e,#3b82f6,#a855f7)" },
] as const;

export const LISTINGS_PER_PAGE = 20;
