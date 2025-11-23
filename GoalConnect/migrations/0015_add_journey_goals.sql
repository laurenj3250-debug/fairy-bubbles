CREATE TYPE "public"."journey_goal_category" AS ENUM('cycling', 'lifting', 'climbing');--> statement-breakpoint
CREATE TABLE "journey_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"category" "journey_goal_category" NOT NULL,
	"goal_key" varchar(50) NOT NULL,
	"target_value" integer NOT NULL,
	"unit" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "journey_goals" ADD CONSTRAINT "journey_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "journey_goals_user_goal_key" ON "journey_goals" USING btree ("user_id","goal_key");