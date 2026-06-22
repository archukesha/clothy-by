-- Seed demo data so CLOTHY.BY (id cmqp5xg900000xuerpu77fo7t) unlocks all seller badges
-- and shows a healthy review history. Uses existing category/brand for FK validity.

-- 1) Fake buyer accounts (distinct authors needed due to unique(authorId, sellerId) on Review)
INSERT INTO "User" (id, "telegramId", name, role, banned, "createdAt", "updatedAt")
SELECT
  'seedbuyer' || gs,
  '9000000' || gs,
  'Покупатель ' || gs,
  'USER',
  false,
  now() - (gs || ' days')::interval,
  now()
FROM generate_series(1, 80) AS gs
ON CONFLICT (id) DO NOTHING;

-- 2) SOLD listings owned by CLOTHY.BY (35 -> clears "Топ продавец" threshold of 30)
INSERT INTO "Listing" (
  id, title, description, price, currency, condition, gender, city, delivery,
  status, quantity, views, "createdAt", "updatedAt", "categoryId", "brandId", "userId"
)
SELECT
  'seedsold' || gs,
  'Товар ' || gs,
  'Демонстрационное объявление для тестовых отзывов и статистики продавца.',
  50 + gs,
  'BYN',
  'USED_GOOD',
  'UNISEX',
  'Минск',
  '[]',
  'SOLD',
  1,
  10 + gs,
  now() - (gs || ' days')::interval,
  now(),
  'cmqjpp8c70002xuuucbom7uc9',
  'cmqjpp8dk001kxuuucbc6wlyp',
  'cmqp5xg900000xuerpu77fo7t'
FROM generate_series(1, 35) AS gs
ON CONFLICT (id) DO NOTHING;

-- 3) ACTIVE listings owned by CLOTHY.BY (6 -> clears "Активный продавец" threshold of 5)
INSERT INTO "Listing" (
  id, title, description, price, currency, condition, gender, city, delivery,
  status, quantity, views, "createdAt", "updatedAt", "categoryId", "brandId", "userId"
)
SELECT
  'seedactive' || gs,
  'Активный товар ' || gs,
  'Демонстрационное активное объявление для тестовой статистики продавца.',
  40 + gs,
  'BYN',
  'NEW_WITH_TAGS',
  'UNISEX',
  'Минск',
  '[]',
  'ACTIVE',
  1,
  5 + gs,
  now() - (gs || ' days')::interval,
  now(),
  'cmqjpp8c70002xuuucbom7uc9',
  'cmqjpp8dk001kxuuucbc6wlyp',
  'cmqp5xg900000xuerpu77fo7t'
FROM generate_series(1, 6) AS gs
ON CONFLICT (id) DO NOTHING;

-- 4) One conversation per SOLD listing so it counts as a verified sale
INSERT INTO "Conversation" (id, "user1Id", "user2Id", "listingId", "createdAt", "updatedAt")
SELECT
  'seedconv' || gs,
  'cmqp5xg900000xuerpu77fo7t',
  'seedbuyer' || gs,
  'seedsold' || gs,
  now() - (gs || ' days')::interval,
  now()
FROM generate_series(1, 35) AS gs
ON CONFLICT (id) DO NOTHING;

-- 5) 80 approved reviews from distinct buyers (mostly 5-star -> "Любимец покупателей")
INSERT INTO "Review" (id, rating, text, status, "createdAt", "authorId", "sellerId", "listingId")
SELECT
  'seedreview' || gs,
  CASE WHEN gs % 10 = 0 THEN 4 ELSE 5 END,
  CASE WHEN gs % 10 = 0
    THEN 'Хорошо, но доставка чуть задержалась. В целом всё устроило.'
    ELSE 'Отличный продавец! Всё как на фото, быстрая отправка, рекомендую.'
  END,
  'APPROVED',
  now() - (gs || ' days')::interval,
  'seedbuyer' || gs,
  'cmqp5xg900000xuerpu77fo7t',
  'seedsold' || ((gs % 35) + 1)
FROM generate_series(1, 80) AS gs
ON CONFLICT (id) DO NOTHING;

SELECT
  (SELECT count(*) FROM "Listing" WHERE "userId" = 'cmqp5xg900000xuerpu77fo7t' AND status = 'SOLD') AS sold_listings,
  (SELECT count(*) FROM "Listing" WHERE "userId" = 'cmqp5xg900000xuerpu77fo7t' AND status = 'ACTIVE') AS active_listings,
  (SELECT count(*) FROM "Review" WHERE "sellerId" = 'cmqp5xg900000xuerpu77fo7t' AND status = 'APPROVED') AS approved_reviews,
  (SELECT round(avg(rating), 2) FROM "Review" WHERE "sellerId" = 'cmqp5xg900000xuerpu77fo7t' AND status = 'APPROVED') AS avg_rating;
