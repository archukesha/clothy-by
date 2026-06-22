-- Fix the absurd price on the test listing
UPDATE "Listing" SET price = 50 WHERE id = 'cmqpmiysy0001xub3lvta12k0';

-- Reset spammy profile name/bio for the test user
SELECT id, name FROM "User" WHERE name ILIKE 'ARTLANG%';
