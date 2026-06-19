ALTER TYPE "public"."logs_entity" ADD VALUE 'category';--> statement-breakpoint
ALTER TYPE "public"."logs_entity" ADD VALUE 'collection';--> statement-breakpoint
ALTER TYPE "public"."logs_entity" ADD VALUE 'reservation';--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "stock" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "guest_logs" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "deleted_at" timestamp;