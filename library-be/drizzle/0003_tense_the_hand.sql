CREATE TABLE "bibliography_faculties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bibliography_id" uuid NOT NULL,
	"faculty_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "bf_unique" UNIQUE("bibliography_id","faculty_id")
);
--> statement-breakpoint
CREATE TABLE "bibliography_study_programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bibliography_id" uuid NOT NULL,
	"study_program_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "bsp_unique" UNIQUE("bibliography_id","study_program_id")
);
--> statement-breakpoint
CREATE TABLE "faculties" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "faculties_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"code" varchar(50),
	"created_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "study_programs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "study_programs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"faculty_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50),
	"created_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "bibliography_faculties" ADD CONSTRAINT "bibliography_faculties_bibliography_id_bibliographies_id_fk" FOREIGN KEY ("bibliography_id") REFERENCES "public"."bibliographies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bibliography_faculties" ADD CONSTRAINT "bibliography_faculties_faculty_id_faculties_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bibliography_study_programs" ADD CONSTRAINT "bibliography_study_programs_bibliography_id_bibliographies_id_fk" FOREIGN KEY ("bibliography_id") REFERENCES "public"."bibliographies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bibliography_study_programs" ADD CONSTRAINT "bibliography_study_programs_study_program_id_study_programs_id_fk" FOREIGN KEY ("study_program_id") REFERENCES "public"."study_programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_programs" ADD CONSTRAINT "study_programs_faculty_id_faculties_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bf_bibliography_idx" ON "bibliography_faculties" USING btree ("bibliography_id");--> statement-breakpoint
CREATE INDEX "bf_faculty_idx" ON "bibliography_faculties" USING btree ("faculty_id");--> statement-breakpoint
CREATE INDEX "bsp_bibliography_idx" ON "bibliography_study_programs" USING btree ("bibliography_id");--> statement-breakpoint
CREATE INDEX "bsp_study_program_idx" ON "bibliography_study_programs" USING btree ("study_program_id");--> statement-breakpoint
CREATE INDEX "sp_faculty_idx" ON "study_programs" USING btree ("faculty_id");