-- Add extendCount field to loans table
ALTER TABLE loans ADD COLUMN extend_count integer DEFAULT 0 NOT NULL;

-- Add isbn field to recommendations table
ALTER TABLE recommendations ADD COLUMN isbn varchar(255);
