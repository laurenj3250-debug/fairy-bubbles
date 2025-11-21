CREATE TABLE "alpine_gear" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" varchar(30) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"weight_grams" integer DEFAULT 0 NOT NULL,
	"tier" varchar(20) NOT NULL,
	"unlock_level" integer DEFAULT 1 NOT NULL,
	"unlock_habit_count" integer DEFAULT 0 NOT NULL,
	"cost" integer DEFAULT 0 NOT NULL,
	"stats" text DEFAULT '{}' NOT NULL,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "alpine_gear_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "costumes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" varchar(20) NOT NULL,
	"price" integer NOT NULL,
	"image_url" text NOT NULL,
	"rarity" varchar(20) NOT NULL,
	"evolution_required" varchar(20) DEFAULT 'seed' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_quests" (
	"id" serial PRIMARY KEY NOT NULL,
	"quest_type" varchar(50) NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"target_value" integer NOT NULL,
	"reward_tokens" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "daily_quests_quest_type_unique" UNIQUE("quest_type")
);
--> statement-breakpoint
CREATE TABLE "dream_scroll_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" varchar(20) NOT NULL,
	"priority" varchar(10) DEFAULT 'medium' NOT NULL,
	"cost" varchar(10),
	"tags" text,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dream_scroll_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"category" varchar(20) NOT NULL,
	"name" text NOT NULL,
	"color" varchar(50) DEFAULT 'bg-gray-500/20 text-gray-300' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expedition_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"expedition_id" integer NOT NULL,
	"event_type" varchar(30) NOT NULL,
	"event_day" integer NOT NULL,
	"event_description" text NOT NULL,
	"energy_cost" integer DEFAULT 0 NOT NULL,
	"progress_impact" integer DEFAULT 0 NOT NULL,
	"morale_impact" integer DEFAULT 0 NOT NULL,
	"player_choice" text DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expedition_gear_loadout" (
	"id" serial PRIMARY KEY NOT NULL,
	"expedition_id" integer NOT NULL,
	"gear_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"condition_before" integer DEFAULT 100 NOT NULL,
	"condition_after" integer DEFAULT 100 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expedition_missions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"mountain_id" integer NOT NULL,
	"status" varchar(20) NOT NULL,
	"start_date" timestamp DEFAULT now() NOT NULL,
	"completion_date" timestamp,
	"total_days" integer NOT NULL,
	"current_day" integer DEFAULT 1 NOT NULL,
	"required_completion_percent" integer NOT NULL,
	"days_completed" integer DEFAULT 0 NOT NULL,
	"perfect_days" integer DEFAULT 0 NOT NULL,
	"total_habits_completed" integer DEFAULT 0 NOT NULL,
	"total_habits_possible" integer DEFAULT 0 NOT NULL,
	"xp_earned" integer DEFAULT 0,
	"points_earned" integer DEFAULT 0,
	"bonuses_earned" text DEFAULT '[]',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goal_updates" (
	"id" serial PRIMARY KEY NOT NULL,
	"goal_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"date" varchar(10) NOT NULL,
	"value" integer NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"target_value" integer NOT NULL,
	"current_value" integer DEFAULT 0 NOT NULL,
	"unit" text NOT NULL,
	"deadline" varchar(10) NOT NULL,
	"category" text NOT NULL,
	"difficulty" varchar(10) DEFAULT 'medium' NOT NULL,
	"priority" varchar(10) DEFAULT 'medium' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "habit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"habit_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"date" varchar(10) NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"note" text,
	"mood" integer,
	"energy_level" integer,
	"duration_minutes" integer,
	"quantity_completed" integer,
	"session_type" text,
	"increment_value" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "habit_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"habit_id" integer NOT NULL,
	"metric_type" varchar(30) NOT NULL,
	"label" text NOT NULL,
	"unit" text NOT NULL,
	"target_value" integer NOT NULL,
	"current_value" integer DEFAULT 0 NOT NULL,
	"color" text DEFAULT '#3b82f6' NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "habits" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"icon" text NOT NULL,
	"color" text NOT NULL,
	"cadence" varchar(10) NOT NULL,
	"target_per_week" integer,
	"difficulty" varchar(10) DEFAULT 'medium' NOT NULL,
	"linked_goal_id" integer,
	"category" varchar(20) DEFAULT 'training',
	"effort" varchar(10) DEFAULT 'medium',
	"grade" text DEFAULT '5.9',
	"scheduled_day" varchar(10),
	"goal_type" varchar(20) DEFAULT 'binary' NOT NULL,
	"target_value" integer,
	"current_value" integer DEFAULT 0 NOT NULL,
	"target_date" varchar(10),
	"created_date" varchar(10),
	"is_locked" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "labels" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#gray' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mountain_backgrounds" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"mountain_id" integer NOT NULL,
	"expedition_id" integer,
	"unlocked_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mountain_unlocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"mountain_id" integer NOT NULL,
	"unlocked_at" timestamp DEFAULT now() NOT NULL,
	"unlocked_by" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mountains" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"elevation" integer NOT NULL,
	"country" text NOT NULL,
	"mountain_range" text NOT NULL,
	"continent" varchar(50) NOT NULL,
	"region_id" integer,
	"latitude" text NOT NULL,
	"longitude" text NOT NULL,
	"difficulty_tier" varchar(20) NOT NULL,
	"required_climbing_level" integer DEFAULT 1 NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"first_ascent_year" integer,
	"fatality_rate" text,
	"best_season_start" varchar(20),
	"best_season_end" varchar(20),
	"unlock_requirements" text DEFAULT '{}' NOT NULL,
	"image_url" text,
	"map_position_x" integer,
	"map_position_y" integer,
	"background_image" text,
	"theme_colors" text DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mountains_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "player_climbing_stats" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"climbing_level" integer DEFAULT 1 NOT NULL,
	"total_experience" integer DEFAULT 0 NOT NULL,
	"current_mountain_index" integer DEFAULT 1 NOT NULL,
	"summits_reached" integer DEFAULT 0 NOT NULL,
	"total_elevation_climbed" integer DEFAULT 0 NOT NULL,
	"continents_completed" text DEFAULT '[]' NOT NULL,
	"achievements" text DEFAULT '[]' NOT NULL,
	"current_energy" integer DEFAULT 100 NOT NULL,
	"max_energy" integer DEFAULT 100 NOT NULL,
	"training_days_completed" integer DEFAULT 0 NOT NULL,
	"longest_expedition" integer DEFAULT 0 NOT NULL,
	"highest_peak_climbed" integer DEFAULT 0 NOT NULL,
	"last_energy_refresh" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_expeditions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"route_id" integer NOT NULL,
	"status" varchar(20) NOT NULL,
	"start_date" timestamp DEFAULT now() NOT NULL,
	"completion_date" timestamp,
	"current_progress" integer DEFAULT 0 NOT NULL,
	"current_altitude" integer DEFAULT 0 NOT NULL,
	"current_day" integer DEFAULT 1 NOT NULL,
	"energy_spent" integer DEFAULT 0 NOT NULL,
	"habits_completed_during" integer DEFAULT 0 NOT NULL,
	"summit_reached" boolean DEFAULT false NOT NULL,
	"experience_earned" integer DEFAULT 0 NOT NULL,
	"notes" text DEFAULT '',
	"weather_condition" varchar(20),
	"team_morale" integer DEFAULT 100 NOT NULL,
	"acclimatization_level" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_gear_inventory" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"gear_id" integer NOT NULL,
	"acquired_date" timestamp DEFAULT now() NOT NULL,
	"times_used" integer DEFAULT 0 NOT NULL,
	"condition" integer DEFAULT 100 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "point_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"type" varchar(30) NOT NULL,
	"related_id" integer,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#3b82f6' NOT NULL,
	"icon" text DEFAULT '📁',
	"parent_id" integer,
	"position" integer DEFAULT 0 NOT NULL,
	"archived" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "route_gear_requirements" (
	"id" serial PRIMARY KEY NOT NULL,
	"route_id" integer NOT NULL,
	"gear_id" integer NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "routes" (
	"id" serial PRIMARY KEY NOT NULL,
	"mountain_id" integer NOT NULL,
	"route_name" text NOT NULL,
	"grading_system" varchar(20) NOT NULL,
	"grade_value" text NOT NULL,
	"elevation_gain" integer NOT NULL,
	"estimated_days" integer NOT NULL,
	"terrain_types" text DEFAULT '[]' NOT NULL,
	"hazards" text DEFAULT '[]' NOT NULL,
	"requires_oxygen" boolean DEFAULT false NOT NULL,
	"requires_fixed_ropes" boolean DEFAULT false NOT NULL,
	"requires_technical_climbing" boolean DEFAULT false NOT NULL,
	"route_description" text DEFAULT '' NOT NULL,
	"first_ascent_year" integer,
	"technical_difficulty" integer DEFAULT 1 NOT NULL,
	"physical_difficulty" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_filters" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"icon" text DEFAULT '🔍',
	"filter_config" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sprites" (
	"id" serial PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"category" varchar(30) NOT NULL,
	"name" text,
	"data" text NOT NULL,
	"mime_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sprites_filename_unique" UNIQUE("filename")
);
--> statement-breakpoint
CREATE TABLE "streak_freezes" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"freeze_count" integer DEFAULT 0 NOT NULL,
	"last_earned_date" varchar(10),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_labels" (
	"task_id" integer NOT NULL,
	"label_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_productivity_stats" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"karma_points" integer DEFAULT 0 NOT NULL,
	"tasks_completed_today" integer DEFAULT 0 NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_completion_date" varchar(10),
	"total_completed" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "todos" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"due_date" varchar(10),
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"difficulty" varchar(10) DEFAULT 'medium' NOT NULL,
	"subtasks" text DEFAULT '[]' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"project_id" integer,
	"priority" integer DEFAULT 4 NOT NULL,
	"recurring_pattern" text,
	"next_recurrence" varchar(10),
	"position" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"parent_task_id" integer
);
--> statement-breakpoint
CREATE TABLE "user_combo_stats" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"current_combo" integer DEFAULT 0 NOT NULL,
	"daily_high_score" integer DEFAULT 0 NOT NULL,
	"last_completion_time" timestamp,
	"combo_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_costumes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"costume_id" integer NOT NULL,
	"purchased_at" timestamp DEFAULT now() NOT NULL,
	"is_equipped" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_daily_quests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"quest_date" varchar(10) NOT NULL,
	"quest_id" integer NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"claimed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_points" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"total_earned" integer DEFAULT 0 NOT NULL,
	"total_spent" integer DEFAULT 0 NOT NULL,
	"available" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"dark_mode" boolean DEFAULT true NOT NULL,
	"notifications" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "virtual_pets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text DEFAULT 'Forest Friend' NOT NULL,
	"species" varchar(50) DEFAULT 'Gremlin' NOT NULL,
	"happiness" integer DEFAULT 50 NOT NULL,
	"health" integer DEFAULT 100 NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"experience" integer DEFAULT 0 NOT NULL,
	"evolution" varchar(20) DEFAULT 'seed' NOT NULL,
	"current_costume_id" integer,
	"last_fed" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "virtual_pets_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "world_map_regions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"continent" varchar(50) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"unlock_level" integer DEFAULT 1 NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "world_map_regions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "dream_scroll_items" ADD CONSTRAINT "dream_scroll_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dream_scroll_tags" ADD CONSTRAINT "dream_scroll_tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expedition_events" ADD CONSTRAINT "expedition_events_expedition_id_player_expeditions_id_fk" FOREIGN KEY ("expedition_id") REFERENCES "public"."player_expeditions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expedition_gear_loadout" ADD CONSTRAINT "expedition_gear_loadout_expedition_id_player_expeditions_id_fk" FOREIGN KEY ("expedition_id") REFERENCES "public"."player_expeditions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expedition_gear_loadout" ADD CONSTRAINT "expedition_gear_loadout_gear_id_alpine_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "public"."alpine_gear"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expedition_missions" ADD CONSTRAINT "expedition_missions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expedition_missions" ADD CONSTRAINT "expedition_missions_mountain_id_mountains_id_fk" FOREIGN KEY ("mountain_id") REFERENCES "public"."mountains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_updates" ADD CONSTRAINT "goal_updates_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_updates" ADD CONSTRAINT "goal_updates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_logs" ADD CONSTRAINT "habit_logs_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_logs" ADD CONSTRAINT "habit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_metrics" ADD CONSTRAINT "habit_metrics_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habits" ADD CONSTRAINT "habits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habits" ADD CONSTRAINT "habits_linked_goal_id_goals_id_fk" FOREIGN KEY ("linked_goal_id") REFERENCES "public"."goals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "labels" ADD CONSTRAINT "labels_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mountain_backgrounds" ADD CONSTRAINT "mountain_backgrounds_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mountain_backgrounds" ADD CONSTRAINT "mountain_backgrounds_mountain_id_mountains_id_fk" FOREIGN KEY ("mountain_id") REFERENCES "public"."mountains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mountain_backgrounds" ADD CONSTRAINT "mountain_backgrounds_expedition_id_player_expeditions_id_fk" FOREIGN KEY ("expedition_id") REFERENCES "public"."player_expeditions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mountain_unlocks" ADD CONSTRAINT "mountain_unlocks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mountain_unlocks" ADD CONSTRAINT "mountain_unlocks_mountain_id_mountains_id_fk" FOREIGN KEY ("mountain_id") REFERENCES "public"."mountains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mountains" ADD CONSTRAINT "mountains_region_id_world_map_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."world_map_regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_climbing_stats" ADD CONSTRAINT "player_climbing_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_expeditions" ADD CONSTRAINT "player_expeditions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_expeditions" ADD CONSTRAINT "player_expeditions_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_gear_inventory" ADD CONSTRAINT "player_gear_inventory_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_gear_inventory" ADD CONSTRAINT "player_gear_inventory_gear_id_alpine_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "public"."alpine_gear"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_parent_id_projects_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_gear_requirements" ADD CONSTRAINT "route_gear_requirements_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_gear_requirements" ADD CONSTRAINT "route_gear_requirements_gear_id_alpine_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "public"."alpine_gear"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routes" ADD CONSTRAINT "routes_mountain_id_mountains_id_fk" FOREIGN KEY ("mountain_id") REFERENCES "public"."mountains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_filters" ADD CONSTRAINT "saved_filters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streak_freezes" ADD CONSTRAINT "streak_freezes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_task_id_todos_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."todos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_labels" ADD CONSTRAINT "task_labels_task_id_todos_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."todos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_labels" ADD CONSTRAINT "task_labels_label_id_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."labels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_productivity_stats" ADD CONSTRAINT "task_productivity_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_parent_task_id_todos_id_fk" FOREIGN KEY ("parent_task_id") REFERENCES "public"."todos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_combo_stats" ADD CONSTRAINT "user_combo_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_costumes" ADD CONSTRAINT "user_costumes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_costumes" ADD CONSTRAINT "user_costumes_costume_id_costumes_id_fk" FOREIGN KEY ("costume_id") REFERENCES "public"."costumes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_daily_quests" ADD CONSTRAINT "user_daily_quests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_daily_quests" ADD CONSTRAINT "user_daily_quests_quest_id_daily_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."daily_quests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_points" ADD CONSTRAINT "user_points_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "virtual_pets" ADD CONSTRAINT "virtual_pets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "virtual_pets" ADD CONSTRAINT "virtual_pets_current_costume_id_costumes_id_fk" FOREIGN KEY ("current_costume_id") REFERENCES "public"."costumes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "habit_logs_habit_id_user_id_date_key" ON "habit_logs" USING btree ("habit_id","user_id","date");