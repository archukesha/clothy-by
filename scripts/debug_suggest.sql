SELECT title, status, similarity(title, 'майк') FROM "Listing" WHERE title ILIKE '%майк%';
SELECT title FROM "Listing" WHERE status='ACTIVE';
