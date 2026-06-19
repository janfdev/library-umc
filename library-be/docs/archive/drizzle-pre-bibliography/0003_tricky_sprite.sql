ALTER TABLE "loans" ADD COLUMN "verification_token" varchar(100);--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "verification_expires_at" timestamp;--> statement-breakpoint
CREATE INDEX "item_location_idx" ON "items" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "loan_member_idx" ON "loans" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "loan_item_idx" ON "loans" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "loan_active_idx" ON "loans" USING btree ("item_id","status");--> statement-breakpoint
CREATE INDEX "loan_verification_token_idx" ON "loans" USING btree ("verification_token");--> statement-breakpoint
ALTER TABLE "guest_logs" DROP COLUMN "institution";