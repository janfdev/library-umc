ALTER TYPE "public"."logs_status" ADD VALUE 'failed_login';--> statement-breakpoint
ALTER TYPE "public"."logs_status" ADD VALUE 'rate_limited';--> statement-breakpoint
ALTER TYPE "public"."logs_entity" ADD VALUE 'auth';--> statement-breakpoint
ALTER TABLE "logs" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "logs" ADD COLUMN "user_agent" text;--> statement-breakpoint
ALTER TABLE "logs" ADD COLUMN "detail" text;