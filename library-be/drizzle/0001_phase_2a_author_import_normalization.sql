-- Phase 2A: Author/import normalization
-- This migration is idempotent — safe for both fresh databases and Vela.

-- 1. Create import_bibliography_item_codes table
CREATE TABLE IF NOT EXISTS "import_bibliography_item_codes" (
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

-- 2. Drop old unique constraint if it exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bibliography_author_unique') THEN
    ALTER TABLE "bibliography_authors" DROP CONSTRAINT "bibliography_author_unique";
  END IF;
END $$;
--> statement-breakpoint

-- 3. Update import_batch_status enum (add 'approving' if missing)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'import_batch_status' AND e.enumlabel = 'approving') THEN
    ALTER TYPE "public"."import_batch_status" ADD VALUE 'approving';
  END IF;
END $$;
--> statement-breakpoint

-- 4. Add unlisted_authors_label to bibliographies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bibliographies' AND column_name = 'unlisted_authors_label') THEN
    ALTER TABLE "bibliographies" ADD COLUMN "unlisted_authors_label" varchar(100);
  END IF;
END $$;
--> statement-breakpoint

-- 5. Add position to bibliography_authors
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bibliography_authors' AND column_name = 'position') THEN
    ALTER TABLE "bibliography_authors" ADD COLUMN "position" integer DEFAULT 1 NOT NULL;
  END IF;
END $$;
--> statement-breakpoint

-- 6. Update role column default and not null
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bibliography_authors' AND column_name = 'role' AND is_nullable = 'YES') THEN
    UPDATE "bibliography_authors" SET "role" = 'author' WHERE "role" IS NULL;
    ALTER TABLE "bibliography_authors" ALTER COLUMN "role" SET DEFAULT 'author';
    ALTER TABLE "bibliography_authors" ALTER COLUMN "role" SET NOT NULL;
  END IF;
END $$;
--> statement-breakpoint

-- 7. Add import_batches columns
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'import_batches' AND column_name = 'reference_batch_id') THEN
    ALTER TABLE "import_batches" ADD COLUMN "reference_batch_id" uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'import_batches' AND column_name = 'failed_rows') THEN
    ALTER TABLE "import_batches" ADD COLUMN "failed_rows" integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'import_batches' AND column_name = 'approved_by') THEN
    ALTER TABLE "import_batches" ADD COLUMN "approved_by" text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'import_batches' AND column_name = 'last_processed_at') THEN
    ALTER TABLE "import_batches" ADD COLUMN "last_processed_at" timestamp;
  END IF;
END $$;
--> statement-breakpoint

-- 8. Add resolution_method to import_item_rows
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'import_item_rows' AND column_name = 'resolution_method') THEN
    ALTER TABLE "import_item_rows" ADD COLUMN "resolution_method" varchar(50);
  END IF;
END $$;
--> statement-breakpoint

-- 9. Add foreign keys for import_bibliography_item_codes (if table was just created)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'import_bibliography_item_codes_batch_id_import_batches_id_fk') THEN
    ALTER TABLE "import_bibliography_item_codes" ADD CONSTRAINT "import_bibliography_item_codes_batch_id_import_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."import_batches"("id") ON DELETE no action ON UPDATE no action;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'import_bibliography_item_codes_bibliography_row_id_import_bibliography_rows_id_fk') THEN
    ALTER TABLE "import_bibliography_item_codes" ADD CONSTRAINT "import_bibliography_item_codes_bibliography_row_id_import_bibliography_rows_id_fk" FOREIGN KEY ("bibliography_row_id") REFERENCES "public"."import_bibliography_rows"("id") ON DELETE no action ON UPDATE no action;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'import_bibliography_item_codes_committed_bibliography_id_bibliographies_id_fk') THEN
    ALTER TABLE "import_bibliography_item_codes" ADD CONSTRAINT "import_bibliography_item_codes_committed_bibliography_id_bibliographies_id_fk" FOREIGN KEY ("committed_bibliography_id") REFERENCES "public"."bibliographies"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint

-- 10. Create indexes (IF NOT EXISTS supported)
CREATE INDEX IF NOT EXISTS "ibic_batch_item_code_idx" ON "import_bibliography_item_codes" USING btree ("batch_id","item_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ibic_committed_bib_idx" ON "import_bibliography_item_codes" USING btree ("committed_bibliography_id");--> statement-breakpoint

-- 11. Add approved_by FK
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'import_batches_approved_by_users_id_fk') THEN
    ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint

-- 12. Add unique constraints
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bibliography_author_role_unique') THEN
    ALTER TABLE "bibliography_authors" ADD CONSTRAINT "bibliography_author_role_unique" UNIQUE("bibliography_id","author_id","role");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bibliography_position_unique') THEN
    ALTER TABLE "bibliography_authors" ADD CONSTRAINT "bibliography_position_unique" UNIQUE("bibliography_id","position");
  END IF;
END $$;
