CREATE TYPE "public"."climbing_source" AS ENUM('kilter_board', 'tension_board', 'moonboard');--> statement-breakpoint
CREATE TYPE "public"."frequency_type" AS ENUM('daily', 'weekly', 'custom');--> statement-breakpoint
CREATE TYPE "public"."sync_frequency" AS ENUM('manual', 'daily', 'weekly');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('idle', 'syncing', 'error');--> statement-breakpoint
CREATE TYPE "public"."workout_source" AS ENUM('apple_watch', 'strava', 'other');--> statement-breakpoint
CREATE TABLE "climbing_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"source_type" "climbing_source" NOT NULL,
	"external_id" text NOT NULL,
	"session_date" varchar(10) NOT NULL,
	"session_start_time" timestamp,
	"duration_minutes" integer,
	"problems_attempted" integer DEFAULT 0 NOT NULL,
	"problems_sent" integer DEFAULT 0 NOT NULL,
	"average_grade" varchar(10),
	"max_grade" varchar(10),
	"board_angle" integer,
	"climbs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"linked_habit_id" integer,
	"imported_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_source_connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"source_type" varchar(20) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_sync_at" timestamp,
	"sync_status" "sync_status" DEFAULT 'idle' NOT NULL,
	"sync_error" text,
	"credentials" jsonb,
	"sync_frequency" "sync_frequency" DEFAULT 'manual' NOT NULL,
	"auto_complete_habits" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_workouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"source_type" "workout_source" NOT NULL,
	"external_id" text NOT NULL,
	"workout_type" text NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"duration_minutes" integer NOT NULL,
	"heart_rate_avg" integer,
	"heart_rate_max" integer,
	"heart_rate_min" integer,
	"calories_burned" integer,
	"distance_km" numeric(10, 2),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"linked_habit_id" integer,
	"imported_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "habit_data_mappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"habit_id" integer NOT NULL,
	"source_type" varchar(20) NOT NULL,
	"match_criteria" jsonb NOT NULL,
	"auto_complete" boolean DEFAULT true NOT NULL,
	"auto_increment" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "habits" ALTER COLUMN "cadence" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "habit_logs" ADD COLUMN "auto_complete_source" varchar(20);--> statement-breakpoint
ALTER TABLE "habit_logs" ADD COLUMN "linked_workout_id" integer;--> statement-breakpoint
ALTER TABLE "habit_logs" ADD COLUMN "linked_session_id" integer;--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "frequency_numerator" integer;--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "frequency_denominator" integer;--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "frequency_type" "frequency_type";--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "current_score" numeric(10, 8) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "score_history" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "climbing_sessions" ADD CONSTRAINT "climbing_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "climbing_sessions" ADD CONSTRAINT "climbing_sessions_linked_habit_id_habits_id_fk" FOREIGN KEY ("linked_habit_id") REFERENCES "public"."habits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_source_connections" ADD CONSTRAINT "data_source_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_workouts" ADD CONSTRAINT "external_workouts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_workouts" ADD CONSTRAINT "external_workouts_linked_habit_id_habits_id_fk" FOREIGN KEY ("linked_habit_id") REFERENCES "public"."habits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_data_mappings" ADD CONSTRAINT "habit_data_mappings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_data_mappings" ADD CONSTRAINT "habit_data_mappings_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "climbing_sessions_user_source_external_key" ON "climbing_sessions" USING btree ("user_id","source_type","external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "data_source_connections_user_source_key" ON "data_source_connections" USING btree ("user_id","source_type");--> statement-breakpoint
CREATE UNIQUE INDEX "external_workouts_user_source_external_key" ON "external_workouts" USING btree ("user_id","source_type","external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "habit_data_mappings_habit_source_key" ON "habit_data_mappings" USING btree ("habit_id","source_type");--> statement-breakpoint
ALTER TABLE "habit_logs" ADD CONSTRAINT "habit_logs_linked_workout_id_external_workouts_id_fk" FOREIGN KEY ("linked_workout_id") REFERENCES "public"."external_workouts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_logs" ADD CONSTRAINT "habit_logs_linked_session_id_climbing_sessions_id_fk" FOREIGN KEY ("linked_session_id") REFERENCES "public"."climbing_sessions"("id") ON DELETE set null ON UPDATE no action;