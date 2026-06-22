SELECT l.title, l.id, l.views, count(f.id) as fav_count
FROM "Listing" l LEFT JOIN "Favorite" f ON f."listingId" = l.id
GROUP BY l.id, l.title, l.views;
SELECT * FROM "Favorite";
