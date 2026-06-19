CREATE INDEX IF NOT EXISTS "reservations_member_idx" ON "reservations" ("member_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reservations_collection_idx" ON "reservations" ("collection_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reservations_status_idx" ON "reservations" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fines_loan_idx" ON "fines" ("loan_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fines_status_idx" ON "fines" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "logs_created_at_idx" ON "logs" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "logs_entity_idx" ON "logs" ("entity");
