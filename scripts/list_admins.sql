SELECT id, name, "telegramId", role FROM "User" WHERE role IN ('ADMIN','MODERATOR') OR name ILIKE '%clothy%';
