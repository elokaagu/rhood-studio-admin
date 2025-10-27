-- Clear all messages from the chat
-- Run this in Supabase SQL Editor

-- Delete all messages (this will clear all chat history)
DELETE FROM messages;

SELECT 'All chat messages have been cleared' as status;
SELECT COUNT(*) as remaining_messages FROM messages;

