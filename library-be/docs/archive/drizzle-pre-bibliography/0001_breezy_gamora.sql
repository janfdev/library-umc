ALTER TABLE "members" ALTER COLUMN "member_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."member_type";--> statement-breakpoint
CREATE TYPE "public"."member_type" AS ENUM('student', 'lecturer', 'staff', 'super_admin');--> statement-breakpoint
ALTER TABLE "members" ALTER COLUMN "member_type" SET DATA TYPE "public"."member_type" USING "member_type"::"public"."member_type";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'student';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "banned" SET DEFAULT false;