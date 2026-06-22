SELECT id, name, city, bio FROM "User" WHERE city ILIKE '4%' OR bio ILIKE '4%' OR length(city) > 30;
