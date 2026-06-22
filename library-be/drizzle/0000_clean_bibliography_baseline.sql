CREATE TYPE "public"."collection_type" AS ENUM('physical_book', 'ebook', 'journal', 'thesis');--> statement-breakpoint
CREATE TYPE "public"."content_type" AS ENUM('text', 'pdf', 'url');--> statement-breakpoint
CREATE TYPE "public"."fines_status" AS ENUM('paid', 'unpaid');--> statement-breakpoint
CREATE TYPE "public"."import_batch_status" AS ENUM('uploading', 'parsing', 'validating', 'preview', 'approved', 'committed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."import_batch_type" AS ENUM('bibliography', 'item');--> statement-breakpoint
CREATE TYPE "public"."import_row_status" AS ENUM('pending', 'valid', 'invalid', 'committed', 'skipped', 'duplicate');--> statement-breakpoint
CREATE TYPE "public"."item_status" AS ENUM('available', 'loaned', 'damaged', 'lost');--> statement-breakpoint
CREATE TYPE "public"."loans_status" AS ENUM('pending', 'approved', 'returned', 'extended', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."logs_entity" AS ENUM('loan', 'item', 'fine', 'Users', 'category', 'bibliography', 'reservation', 'auth');--> statement-breakpoint
CREATE TYPE "public"."logs_status" AS ENUM('create', 'update', 'delete', 'approve', 'blacklist', 'failed_login', 'rate_limited');--> statement-breakpoint
CREATE TYPE "public"."member_card_status" AS ENUM('not_requested', 'pending', 'active', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "public"."member_type" AS ENUM('student', 'lecturer', 'staff', 'super_admin', 'external');--> statement-breakpoint
CREATE TYPE "public"."recommendation_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."reservations_status" AS ENUM('waiting', 'fulfilled', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."return_request_status" AS ENUM('pending', 'approved');--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"password_hash" varchar(255),
	"deleted_at" timestamp,
	"role" text DEFAULT 'student',
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "acquisitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" integer NOT NULL,
	"bibliography_id" uuid NOT NULL,
	"quantity" integer,
	"acquired_at" date,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "authors" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "authors_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"normalized_name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "bibliographies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(500) NOT NULL,
	"isbn_issn" varchar(255),
	"edition" varchar(100),
	"publisher_id" integer,
	"publish_year" integer,
	"collation" varchar(255),
	"series_title" varchar(255),
	"call_number" varchar(100),
	"language_id" integer,
	"publication_place_id" integer,
	"classification" varchar(100),
	"notes" text,
	"image" text,
	"sor" text,
	"gmd_id" integer,
	"collection_type_id" integer,
	"category_id" integer,
	"description" text,
	"type" "collection_type",
	"stock" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "bibliography_authors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bibliography_id" uuid NOT NULL,
	"author_id" integer NOT NULL,
	"role" varchar(50) DEFAULT 'primary',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "bibliography_author_unique" UNIQUE("bibliography_id","author_id")
);
--> statement-breakpoint
CREATE TABLE "bibliography_contents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bibliography_id" uuid,
	"content_type" "content_type",
	"content" text,
	"content_url" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "bibliography_subjects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bibliography_id" uuid NOT NULL,
	"subject_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "bibliography_subject_unique" UNIQUE("bibliography_id","subject_id")
);
--> statement-breakpoint
CREATE TABLE "bibliography_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bibliography_id" uuid NOT NULL,
	"user_id" text,
	"ip_address" varchar(45),
	"viewed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(100) NOT NULL,
	"description" text,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "collection_types" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "collection_types_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(100) NOT NULL,
	"code" varchar(50),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "fines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loan_id" uuid NOT NULL,
	"amount" numeric(12, 2),
	"status" "fines_status" NOT NULL,
	"last_notified_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "gmds" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "gmds_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(100) NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "guest_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255),
	"name" varchar(255) NOT NULL,
	"identifier" varchar(100) NOT NULL,
	"faculty" varchar(255),
	"major" varchar(255),
	"visit_date" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "import_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "import_batch_type" NOT NULL,
	"filename" varchar(255) NOT NULL,
	"status" "import_batch_status" DEFAULT 'uploading' NOT NULL,
	"total_rows" integer DEFAULT 0,
	"processed_rows" integer DEFAULT 0,
	"valid_rows" integer DEFAULT 0,
	"invalid_rows" integer DEFAULT 0,
	"committed_rows" integer DEFAULT 0,
	"duplicate_rows" integer DEFAULT 0,
	"file_path" text,
	"error_report_path" text,
	"metadata" jsonb,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"committed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "import_bibliography_rows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"row_number" integer NOT NULL,
	"raw_data" jsonb NOT NULL,
	"status" "import_row_status" DEFAULT 'pending' NOT NULL,
	"resolved_data" jsonb,
	"resolved_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "import_bib_row_batch_number_unique" UNIQUE("batch_id","row_number")
);
--> statement-breakpoint
CREATE TABLE "import_errors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"row_number" integer NOT NULL,
	"raw_data" jsonb NOT NULL,
	"errors" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_item_rows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"row_number" integer NOT NULL,
	"raw_data" jsonb NOT NULL,
	"status" "import_row_status" DEFAULT 'pending' NOT NULL,
	"resolved_data" jsonb,
	"resolved_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "import_item_row_batch_number_unique" UNIQUE("batch_id","row_number")
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bibliography_id" uuid NOT NULL,
	"item_code" varchar(50) NOT NULL,
	"inventory_code" varchar(50),
	"call_number" varchar(100),
	"collection_type_id" integer,
	"location_id" integer NOT NULL,
	"vendor_id" integer,
	"received_date" date,
	"order_no" varchar(100),
	"order_date" date,
	"status" "item_status" DEFAULT 'available' NOT NULL,
	"site" varchar(255),
	"source" varchar(255),
	"invoice" varchar(255),
	"price" numeric(14, 2),
	"price_currency" varchar(10) DEFAULT 'IDR',
	"invoice_date" date,
	"qr_token" varchar(100) NOT NULL,
	"qr_version" integer DEFAULT 1 NOT NULL,
	"qr_generated_at" timestamp,
	"qr_revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "item_qr_token_unique" UNIQUE("qr_token"),
	CONSTRAINT "item_item_code_unique" UNIQUE("item_code"),
	CONSTRAINT "item_inventory_code_unique" UNIQUE("inventory_code")
);
--> statement-breakpoint
CREATE TABLE "languages" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "languages_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"code" varchar(10) NOT NULL,
	"name" varchar(100) NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "loans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"loan_date" date NOT NULL,
	"due_date" date NOT NULL,
	"return_date" date,
	"status" "loans_status" NOT NULL,
	"extend_count" integer DEFAULT 0 NOT NULL,
	"approved_by" text,
	"verification_token" varchar(100),
	"verification_expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "locations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"room" varchar(200) NOT NULL,
	"rack" varchar(200) NOT NULL,
	"shelf" varchar(200) NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"action" "logs_status" NOT NULL,
	"entity" "logs_entity" NOT NULL,
	"entity_id" varchar(255),
	"ip_address" varchar(255),
	"user_agent" text,
	"detail" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"member_type" "member_type" NOT NULL,
	"nim_nidn" varchar(255),
	"faculty" varchar(255),
	"origin_region" varchar(255),
	"institution" varchar(255),
	"phone" varchar(100),
	"card_status" "member_card_status" DEFAULT 'not_requested' NOT NULL,
	"card_number" varchar(100),
	"card_requested_at" timestamp,
	"card_approved_at" timestamp,
	"card_rejected_at" timestamp,
	"card_rejected_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	CONSTRAINT "members_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "members_card_number_unique" UNIQUE("card_number")
);
--> statement-breakpoint
CREATE TABLE "publication_places" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "publication_places_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"normalized_name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "publishers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "publishers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"normalized_name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dosen_id" text NOT NULL,
	"isbn" varchar(255),
	"title" varchar(255),
	"author" varchar(255),
	"publisher" varchar(255),
	"reason" text,
	"status" "recommendation_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"bibliography_id" uuid NOT NULL,
	"status" "reservations_status" NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "return_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loan_id" uuid NOT NULL,
	"requested_at" timestamp DEFAULT now(),
	"status" "return_request_status" DEFAULT 'pending' NOT NULL,
	"processed_at" timestamp,
	"processed_by" text
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "subjects_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"normalized_name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fine_id" uuid NOT NULL,
	"payment_method" varchar(100),
	"confirmed_by" text NOT NULL,
	"paid_at" date,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "vendors_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255),
	"contact" varchar(255),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "web_traffic" (
	"id" text PRIMARY KEY NOT NULL,
	"ip_address" varchar(45),
	"user_id" text,
	"page_visited" varchar(255),
	"visit_timestamp" timestamp DEFAULT now(),
	"user_agent" text
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acquisitions" ADD CONSTRAINT "acquisitions_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acquisitions" ADD CONSTRAINT "acquisitions_bibliography_id_bibliographies_id_fk" FOREIGN KEY ("bibliography_id") REFERENCES "public"."bibliographies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bibliographies" ADD CONSTRAINT "bibliographies_publisher_id_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bibliographies" ADD CONSTRAINT "bibliographies_language_id_languages_id_fk" FOREIGN KEY ("language_id") REFERENCES "public"."languages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bibliographies" ADD CONSTRAINT "bibliographies_publication_place_id_publication_places_id_fk" FOREIGN KEY ("publication_place_id") REFERENCES "public"."publication_places"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bibliographies" ADD CONSTRAINT "bibliographies_gmd_id_gmds_id_fk" FOREIGN KEY ("gmd_id") REFERENCES "public"."gmds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bibliographies" ADD CONSTRAINT "bibliographies_collection_type_id_collection_types_id_fk" FOREIGN KEY ("collection_type_id") REFERENCES "public"."collection_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bibliographies" ADD CONSTRAINT "bibliographies_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bibliography_authors" ADD CONSTRAINT "bibliography_authors_bibliography_id_bibliographies_id_fk" FOREIGN KEY ("bibliography_id") REFERENCES "public"."bibliographies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bibliography_authors" ADD CONSTRAINT "bibliography_authors_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bibliography_contents" ADD CONSTRAINT "bibliography_contents_bibliography_id_bibliographies_id_fk" FOREIGN KEY ("bibliography_id") REFERENCES "public"."bibliographies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bibliography_subjects" ADD CONSTRAINT "bibliography_subjects_bibliography_id_bibliographies_id_fk" FOREIGN KEY ("bibliography_id") REFERENCES "public"."bibliographies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bibliography_subjects" ADD CONSTRAINT "bibliography_subjects_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bibliography_views" ADD CONSTRAINT "bibliography_views_bibliography_id_bibliographies_id_fk" FOREIGN KEY ("bibliography_id") REFERENCES "public"."bibliographies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bibliography_views" ADD CONSTRAINT "bibliography_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fines" ADD CONSTRAINT "fines_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_bibliography_rows" ADD CONSTRAINT "import_bibliography_rows_batch_id_import_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."import_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_errors" ADD CONSTRAINT "import_errors_batch_id_import_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."import_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_item_rows" ADD CONSTRAINT "import_item_rows_batch_id_import_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."import_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_bibliography_id_bibliographies_id_fk" FOREIGN KEY ("bibliography_id") REFERENCES "public"."bibliographies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_collection_type_id_collection_types_id_fk" FOREIGN KEY ("collection_type_id") REFERENCES "public"."collection_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logs" ADD CONSTRAINT "logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_dosen_id_users_id_fk" FOREIGN KEY ("dosen_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_bibliography_id_bibliographies_id_fk" FOREIGN KEY ("bibliography_id") REFERENCES "public"."bibliographies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_fine_id_fines_id_fk" FOREIGN KEY ("fine_id") REFERENCES "public"."fines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_confirmed_by_users_id_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "web_traffic" ADD CONSTRAINT "web_traffic_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_deleted_at_idx" ON "users" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "author_normalized_name_idx" ON "authors" USING btree ("normalized_name");--> statement-breakpoint
CREATE INDEX "bibliography_title_idx" ON "bibliographies" USING btree ("title");--> statement-breakpoint
CREATE INDEX "bibliography_isbn_idx" ON "bibliographies" USING btree ("isbn_issn");--> statement-breakpoint
CREATE INDEX "bibliography_call_number_idx" ON "bibliographies" USING btree ("call_number");--> statement-breakpoint
CREATE INDEX "bibliography_publish_year_idx" ON "bibliographies" USING btree ("publish_year");--> statement-breakpoint
CREATE INDEX "bibliography_deleted_at_idx" ON "bibliographies" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "ba_bibliography_idx" ON "bibliography_authors" USING btree ("bibliography_id");--> statement-breakpoint
CREATE INDEX "ba_author_idx" ON "bibliography_authors" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "bs_bibliography_idx" ON "bibliography_subjects" USING btree ("bibliography_id");--> statement-breakpoint
CREATE INDEX "bs_subject_idx" ON "bibliography_subjects" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "bv_bibliography_idx" ON "bibliography_views" USING btree ("bibliography_id");--> statement-breakpoint
CREATE INDEX "bv_viewed_at_idx" ON "bibliography_views" USING btree ("viewed_at");--> statement-breakpoint
CREATE INDEX "import_bib_row_batch_idx" ON "import_bibliography_rows" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "import_bib_row_status_idx" ON "import_bibliography_rows" USING btree ("status");--> statement-breakpoint
CREATE INDEX "import_error_batch_idx" ON "import_errors" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "import_item_row_batch_idx" ON "import_item_rows" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "import_item_row_status_idx" ON "import_item_rows" USING btree ("status");--> statement-breakpoint
CREATE INDEX "item_bibliography_idx" ON "items" USING btree ("bibliography_id");--> statement-breakpoint
CREATE INDEX "item_status_idx" ON "items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "item_deleted_at_idx" ON "items" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "item_location_idx" ON "items" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "item_code_idx" ON "items" USING btree ("item_code");--> statement-breakpoint
CREATE INDEX "item_qr_token_idx" ON "items" USING btree ("qr_token");--> statement-breakpoint
CREATE INDEX "loan_status_idx" ON "loans" USING btree ("status");--> statement-breakpoint
CREATE INDEX "loan_deleted_at_idx" ON "loans" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "loan_member_idx" ON "loans" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "loan_item_idx" ON "loans" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "loan_active_idx" ON "loans" USING btree ("item_id","status");--> statement-breakpoint
CREATE INDEX "loan_verification_token_idx" ON "loans" USING btree ("verification_token");--> statement-breakpoint
CREATE INDEX "member_nim_idx" ON "members" USING btree ("nim_nidn");--> statement-breakpoint
CREATE INDEX "member_deleted_at_idx" ON "members" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "place_normalized_name_idx" ON "publication_places" USING btree ("normalized_name");--> statement-breakpoint
CREATE INDEX "publisher_normalized_name_idx" ON "publishers" USING btree ("normalized_name");--> statement-breakpoint
CREATE INDEX "subject_normalized_name_idx" ON "subjects" USING btree ("normalized_name");