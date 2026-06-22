CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS listing_title_trgm_idx ON "Listing" USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS listing_description_trgm_idx ON "Listing" USING gin (description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS brand_name_trgm_idx ON "Brand" USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS category_name_trgm_idx ON "Category" USING gin (name gin_trgm_ops);
