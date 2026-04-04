ALTER TABLE fines
ADD COLUMN IF NOT EXISTS last_notified_at timestamp;
