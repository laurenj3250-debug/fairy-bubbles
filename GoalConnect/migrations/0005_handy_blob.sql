CREATE TYPE "public"."ascent_style" AS ENUM('onsight', 'flash', 'redpoint', 'pinkpoint', 'send', 'attempt', 'toprope');--> statement-breakpoint
CREATE TYPE "public"."route_type" AS ENUM('sport', 'trad', 'boulder', 'alpine', 'ice');--> statement-breakpoint
CREATE TABLE "outdoor_climbing_ticks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"route_name" text NOT NULL,
	"grade" varchar(20) NOT NULL,
	"route_type" "route_type" NOT NULL,
	"ascent_style" "ascent_style" NOT NULL,
	"date" varchar(10) NOT NULL,
	"location" text,
	"area" text,
	"pitches" integer DEFAULT 1 NOT NULL,
	"stars" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "journey_goals" DROP CONSTRAINT "journey_goals_linked_goal_id_goals_id_fk";
--> statement-breakpoint
ALTER TABLE "outdoor_climbing_ticks" ADD CONSTRAINT "outdoor_climbing_ticks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_goals" DROP COLUMN "linked_goal_id";