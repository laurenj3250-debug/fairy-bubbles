CREATE TYPE "public"."media_status" AS ENUM('want', 'current', 'paused', 'done', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('book', 'tv_show', 'movie', 'audiobook', 'podcast');--> statement-breakpoint
CREATE TYPE "public"."milestone_cadence" AS ENUM('daily', 'weekly', 'biweekly', 'monthly', 'bimonthly', 'quarterly', 'semiannual');--> statement-breakpoint
CREATE TABLE "bird_sightings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"species_name" text NOT NULL,
	"first_seen_date" varchar(10) NOT NULL,
	"first_seen_adventure_id" integer,
	"location" text,
	"photo_path" text,
	"thumb_path" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bird_sightings_user_id_species_name_unique" UNIQUE("user_id","species_name")
);
--> statement-breakpoint
CREATE TABLE "media_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"media_type" "media_type" NOT NULL,
	"status" "media_status" DEFAULT 'want' NOT NULL,
	"author" text,
	"year" integer,
	"image_url" text,
	"current_progress" text,
	"total_progress" text,
	"rating" integer,
	"notes" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outdoor_adventures" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"date" varchar(10) NOT NULL,
	"activity" text NOT NULL,
	"location" text,
	"photo_path" text,
	"thumb_path" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "yearly_goals" ADD COLUMN "due_date" varchar(10);--> statement-breakpoint
ALTER TABLE "yearly_goals" ADD COLUMN "milestone_cadence" "milestone_cadence";--> statement-breakpoint
ALTER TABLE "bird_sightings" ADD CONSTRAINT "bird_sightings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bird_sightings" ADD CONSTRAINT "bird_sightings_first_seen_adventure_id_outdoor_adventures_id_fk" FOREIGN KEY ("first_seen_adventure_id") REFERENCES "public"."outdoor_adventures"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_items" ADD CONSTRAINT "media_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outdoor_adventures" ADD CONSTRAINT "outdoor_adventures_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;