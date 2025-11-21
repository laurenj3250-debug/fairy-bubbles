ALTER TABLE "habits" ADD COLUMN "primary_goal_achieved" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "primary_goal_achieved_date" varchar(10);