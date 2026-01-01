CREATE TYPE "public"."equipment_type" AS ENUM('barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'kettlebell', 'other');--> statement-breakpoint
CREATE TYPE "public"."lifting_category" AS ENUM('push', 'pull', 'legs', 'core', 'compound', 'accessory');--> statement-breakpoint
CREATE TYPE "public"."study_task_type" AS ENUM('remnote_review', 'email_cases', 'chapter', 'mri_lecture', 'papers');--> statement-breakpoint
CREATE TYPE "public"."yearly_goal_type" AS ENUM('binary', 'count', 'compound');--> statement-breakpoint
CREATE TABLE "lifting_exercises" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"category" "lifting_category" DEFAULT 'compound' NOT NULL,
	"equipment" "equipment_type" DEFAULT 'barbell' NOT NULL,
	"primary_muscle" text,
	"is_custom" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lifting_sets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"exercise_id" integer NOT NULL,
	"workout_date" varchar(10) NOT NULL,
	"set_number" integer DEFAULT 1 NOT NULL,
	"reps" integer NOT NULL,
	"weight_lbs" numeric(6, 2) NOT NULL,
	"rpe" integer,
	"is_pr" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lifting_workouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"workout_date" varchar(10) NOT NULL,
	"name" text,
	"duration_minutes" integer,
	"total_volume" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mood_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"emoji" varchar(10) NOT NULL,
	"tag" varchar(50),
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "residency_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "residency_confounder_state" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"active_confounders" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "residency_confounders" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "residency_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"mood" integer NOT NULL,
	"decision" varchar(10) NOT NULL,
	"activity" text,
	"activity_rating" integer,
	"confounders" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_books" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"abbreviation" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_chapters" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"book_id" integer NOT NULL,
	"title" text NOT NULL,
	"images_completed" boolean DEFAULT false NOT NULL,
	"images_completed_at" timestamp,
	"cards_completed" boolean DEFAULT false NOT NULL,
	"cards_completed_at" timestamp,
	"position" integer DEFAULT 0 NOT NULL,
	"page_start" integer,
	"page_end" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_mri_lectures" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"url" text,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_papers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"url" text,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_schedule_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"task_type" "study_task_type" NOT NULL,
	"day_of_week" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_schedule_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"date" varchar(10) NOT NULL,
	"task_type" "study_task_type" NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"linked_item_id" integer,
	"linked_item_type" varchar(20),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "yearly_goal_progress_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"goal_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"change_type" varchar(20) NOT NULL,
	"previous_value" integer,
	"new_value" integer,
	"sub_item_id" varchar(50),
	"source" varchar(30) NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "yearly_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"year" varchar(4) NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" varchar(30) NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"goal_type" "yearly_goal_type" DEFAULT 'binary' NOT NULL,
	"target_value" integer DEFAULT 1 NOT NULL,
	"current_value" integer DEFAULT 0 NOT NULL,
	"linked_habit_id" integer,
	"linked_journey_key" varchar(50),
	"linked_dream_scroll_category" varchar(20),
	"linked_book_id" integer,
	"sub_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"xp_reward" integer DEFAULT 100 NOT NULL,
	"reward_claimed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "goals" ADD COLUMN "month" varchar(7);--> statement-breakpoint
ALTER TABLE "goals" ADD COLUMN "week" varchar(10);--> statement-breakpoint
ALTER TABLE "goals" ADD COLUMN "archived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "goals" ADD COLUMN "parent_goal_id" integer;--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "requires_note" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "note_placeholder" text;--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "goal_id" integer;--> statement-breakpoint
ALTER TABLE "lifting_exercises" ADD CONSTRAINT "lifting_exercises_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lifting_sets" ADD CONSTRAINT "lifting_sets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lifting_sets" ADD CONSTRAINT "lifting_sets_exercise_id_lifting_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."lifting_exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lifting_workouts" ADD CONSTRAINT "lifting_workouts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mood_logs" ADD CONSTRAINT "mood_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "residency_activities" ADD CONSTRAINT "residency_activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "residency_confounder_state" ADD CONSTRAINT "residency_confounder_state_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "residency_confounders" ADD CONSTRAINT "residency_confounders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "residency_entries" ADD CONSTRAINT "residency_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_books" ADD CONSTRAINT "study_books_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_chapters" ADD CONSTRAINT "study_chapters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_chapters" ADD CONSTRAINT "study_chapters_book_id_study_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."study_books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_mri_lectures" ADD CONSTRAINT "study_mri_lectures_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_papers" ADD CONSTRAINT "study_papers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_schedule_config" ADD CONSTRAINT "study_schedule_config_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_schedule_logs" ADD CONSTRAINT "study_schedule_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yearly_goal_progress_logs" ADD CONSTRAINT "yearly_goal_progress_logs_goal_id_yearly_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."yearly_goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yearly_goal_progress_logs" ADD CONSTRAINT "yearly_goal_progress_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yearly_goals" ADD CONSTRAINT "yearly_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yearly_goals" ADD CONSTRAINT "yearly_goals_linked_habit_id_habits_id_fk" FOREIGN KEY ("linked_habit_id") REFERENCES "public"."habits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yearly_goals" ADD CONSTRAINT "yearly_goals_linked_book_id_study_books_id_fk" FOREIGN KEY ("linked_book_id") REFERENCES "public"."study_books"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lifting_exercises_user_name_key" ON "lifting_exercises" USING btree ("user_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "lifting_workouts_user_date_key" ON "lifting_workouts" USING btree ("user_id","workout_date");--> statement-breakpoint
CREATE UNIQUE INDEX "residency_activities_user_name_key" ON "residency_activities" USING btree ("user_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "residency_confounders_user_name_key" ON "residency_confounders" USING btree ("user_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "study_schedule_config_user_task_day_key" ON "study_schedule_config" USING btree ("user_id","task_type","day_of_week");--> statement-breakpoint
CREATE UNIQUE INDEX "study_schedule_logs_user_date_task_key" ON "study_schedule_logs" USING btree ("user_id","date","task_type");--> statement-breakpoint
CREATE UNIQUE INDEX "yearly_goals_user_year_title_key" ON "yearly_goals" USING btree ("user_id","year","title");--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_parent_goal_id_goals_id_fk" FOREIGN KEY ("parent_goal_id") REFERENCES "public"."goals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE set null ON UPDATE no action;