CREATE TABLE "import_bibliography_item_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"bibliography_row_id" uuid,
	"item_code" varchar(50) NOT NULL,
	"source_position" integer DEFAULT 1 NOT NULL,
	"committed_bibliography_id" uuid,
	"validation_status" varchar(20) DEFAULT 'pending',
	"warning_codes" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bibliography_authors" DROP CONSTRAINT "bibliography_author_unique";--> statement-breakpoint
ALTER TABLE "import_batches" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "import_batches" ALTER COLUMN "status" SET DEFAULT 'uploading'::text;--> statement-breakpoint
DROP TYPE "public"."import_batch_status";--> statement-breakpoint
CREATE TYPE "public"."import_batch_status" AS ENUM('uploading', 'parsing', 'validating', 'preview', 'approving', 'committed', 'failed', 'cancelled');--> statement-breakpoint
ALTER TABLE "import_batches" ALTER COLUMN "status" SET DEFAULT 'uploading'::"public"."import_batch_status";--> statement-breakpoint
ALTER TABLE "import_batches" ALTER COLUMN "status" SET DATA TYPE "public"."import_batch_status" USING "status"::"public"."import_batch_status";--> statement-breakpoint
ALTER TABLE "bibliography_authors" ALTER COLUMN "role" SET DEFAULT 'author';--> statement-breakpoint
ALTER TABLE "bibliography_authors" ALTER COLUMN "role" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "bibliographies" ADD COLUMN "unlisted_authors_label" varchar(100);--> statement-breakpoint
ALTER TABLE "bibliography_authors" ADD COLUMN "position" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "import_batches" ADD COLUMN "reference_batch_id" uuid;--> statement-breakpoint
ALTER TABLE "import_batches" ADD COLUMN "failed_rows" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "import_batches" ADD COLUMN "approved_by" text;--> statement-breakpoint
ALTER TABLE "import_batches" ADD COLUMN "last_processed_at" timestamp;--> statement-breakpoint
ALTER TABLE "import_item_rows" ADD COLUMN "resolution_method" varchar(50);--> statement-breakpoint
ALTER TABLE "import_bibliography_item_codes" ADD CONSTRAINT "import_bibliography_item_codes_batch_id_import_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."import_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_bibliography_item_codes" ADD CONSTRAINT "import_bibliography_item_codes_bibliography_row_id_import_bibliography_rows_id_fk" FOREIGN KEY ("bibliography_row_id") REFERENCES "public"."import_bibliography_rows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_bibliography_item_codes" ADD CONSTRAINT "import_bibliography_item_codes_committed_bibliography_id_bibliographies_id_fk" FOREIGN KEY ("committed_bibliography_id") REFERENCES "public"."bibliographies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ibic_batch_item_code_idx" ON "import_bibliography_item_codes" USING btree ("batch_id","item_code");--> statement-breakpoint
CREATE INDEX "ibic_committed_bib_idx" ON "import_bibliography_item_codes" USING btree ("committed_bibliography_id");--> statement-breakpoint
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bibliography_authors" ADD CONSTRAINT "bibliography_author_role_unique" UNIQUE("bibliography_id","author_id","role");--> statement-breakpoint
ALTER TABLE "bibliography_authors" ADD CONSTRAINT "bibliography_position_unique" UNIQUE("bibliography_id","position");