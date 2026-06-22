SELECT id, "conversationId", length(text), left(text, 50) FROM "Message" WHERE length(text) > 100;
