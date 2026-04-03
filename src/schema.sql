CREATE TABLE IF NOT EXISTS "calendar_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"urgency" real NOT NULL,
	"title" text NOT NULL,
	"title_embedding" vector(384) NOT NULL,
	"description" text NOT NULL,
	"description_embedding" vector(384) NOT NULL,
	"start_date" timestamp DEFAULT now(),
	"end_date" timestamp,
	"completed" boolean DEFAULT false NOT NULL,
	"thought_id" integer
);

CREATE TABLE IF NOT EXISTS "deleted_calendar_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"calendar_event_deleted_by" integer,
	"deleted_calendar_event" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "deleted_thoughts" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"thought_deleted_by" integer,
	"deleted_thought" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "kv" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS "thought_calendar_updates" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"thought_id" integer,
	"calendar_event_id" integer
);

CREATE TABLE IF NOT EXISTS "thought_updates" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"thought_id" integer,
	"updater_thought_id" integer
);

CREATE TABLE IF NOT EXISTS "thoughts" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"content" text NOT NULL,
	"content_embedding" vector(384) NOT NULL,
	"ai_summary" text NOT NULL,
	"ai_summary_embedding" vector(384) NOT NULL,
	"landmark" boolean DEFAULT false NOT NULL,
	"suicidal" boolean DEFAULT false NOT NULL,
	"anxiety" boolean DEFAULT false NOT NULL,
	"mood" real NOT NULL
);

DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'calendar_events_thought_id_thoughts_id_fk') THEN
		ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_thought_id_thoughts_id_fk" FOREIGN KEY ("thought_id") REFERENCES "public"."thoughts"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deleted_calendar_events_calendar_event_deleted_by_thoughts_id_fk') THEN
		ALTER TABLE "deleted_calendar_events" ADD CONSTRAINT "deleted_calendar_events_calendar_event_deleted_by_thoughts_id_fk" FOREIGN KEY ("calendar_event_deleted_by") REFERENCES "public"."thoughts"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deleted_thoughts_thought_deleted_by_thoughts_id_fk') THEN
		ALTER TABLE "deleted_thoughts" ADD CONSTRAINT "deleted_thoughts_thought_deleted_by_thoughts_id_fk" FOREIGN KEY ("thought_deleted_by") REFERENCES "public"."thoughts"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'thought_calendar_updates_thought_id_thoughts_id_fk') THEN
		ALTER TABLE "thought_calendar_updates" ADD CONSTRAINT "thought_calendar_updates_thought_id_thoughts_id_fk" FOREIGN KEY ("thought_id") REFERENCES "public"."thoughts"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'thought_calendar_updates_calendar_event_id_calendar_events_id_fk') THEN
		ALTER TABLE "thought_calendar_updates" ADD CONSTRAINT "thought_calendar_updates_calendar_event_id_calendar_events_id_fk" FOREIGN KEY ("calendar_event_id") REFERENCES "public"."calendar_events"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'thought_updates_thought_id_thoughts_id_fk') THEN
		ALTER TABLE "thought_updates" ADD CONSTRAINT "thought_updates_thought_id_thoughts_id_fk" FOREIGN KEY ("thought_id") REFERENCES "public"."thoughts"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'thought_updates_updater_thought_id_thoughts_id_fk') THEN
		ALTER TABLE "thought_updates" ADD CONSTRAINT "thought_updates_updater_thought_id_thoughts_id_fk" FOREIGN KEY ("updater_thought_id") REFERENCES "public"."thoughts"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
CREATE INDEX IF NOT EXISTS "idx_calendar_events_created_at" ON "calendar_events" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "idx_start_date" ON "calendar_events" USING btree ("start_date");
CREATE INDEX IF NOT EXISTS "idx_end_date" ON "calendar_events" USING btree ("end_date");
CREATE INDEX IF NOT EXISTS "idx_completed" ON "calendar_events" USING btree ("completed");
CREATE INDEX IF NOT EXISTS "idx_calendar_events_thought_id" ON "calendar_events" USING btree ("thought_id");
CREATE INDEX IF NOT EXISTS "idx_title_embedding" ON "calendar_events" USING hnsw ("title_embedding" vector_cosine_ops);
CREATE INDEX IF NOT EXISTS "idx_description_embedding" ON "calendar_events" USING hnsw ("description_embedding" vector_cosine_ops);
CREATE INDEX IF NOT EXISTS "idx_calendar_event_deleted_by" ON "deleted_calendar_events" USING btree ("calendar_event_deleted_by");
CREATE INDEX IF NOT EXISTS "idx_thought_deleted_by" ON "deleted_thoughts" USING btree ("thought_deleted_by");
CREATE INDEX IF NOT EXISTS "idx_thought_calendar_updates_created_at" ON "thought_calendar_updates" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "idx_thought_calendar_updates_thought_id" ON "thought_calendar_updates" USING btree ("thought_id");
CREATE INDEX IF NOT EXISTS "idx_thought_calendar_updates_calendar_event_id" ON "thought_calendar_updates" USING btree ("calendar_event_id");
CREATE INDEX IF NOT EXISTS "idx_thought_updates_thought_id" ON "thought_updates" USING btree ("thought_id");
CREATE INDEX IF NOT EXISTS "idx_thought_updates_updater_thought_id" ON "thought_updates" USING btree ("updater_thought_id");
CREATE INDEX IF NOT EXISTS "idx_thoughts_created_at" ON "thoughts" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "idx_updated_at" ON "thoughts" USING btree ("updated_at");
CREATE INDEX IF NOT EXISTS "idx_content_embedding" ON "thoughts" USING hnsw ("content_embedding" vector_cosine_ops);
CREATE INDEX IF NOT EXISTS "idx_ai_summary_embedding" ON "thoughts" USING hnsw ("ai_summary_embedding" vector_cosine_ops);
