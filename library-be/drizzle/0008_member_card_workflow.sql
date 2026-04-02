CREATE TYPE member_card_status AS ENUM ('not_requested', 'pending', 'active', 'rejected', 'expired');

ALTER TABLE members
ADD COLUMN card_status member_card_status NOT NULL DEFAULT 'not_requested',
ADD COLUMN card_number varchar(100),
ADD COLUMN card_requested_at timestamp,
ADD COLUMN card_approved_at timestamp,
ADD COLUMN card_rejected_at timestamp,
ADD COLUMN card_rejected_reason text;

ALTER TABLE members
ADD CONSTRAINT members_card_number_unique UNIQUE (card_number);
