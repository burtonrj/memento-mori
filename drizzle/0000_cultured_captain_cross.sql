CREATE TABLE `affirmation` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`text` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `necessity_block` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT '#cccccc' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`user_id` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `objective` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category` text NOT NULL,
	`text` text NOT NULL,
	`is_completed` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `schedule_allocation` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`block_type` text NOT NULL,
	`necessity_block_id` integer,
	`day_of_week` integer NOT NULL,
	`hour_slot` integer NOT NULL,
	FOREIGN KEY (`necessity_block_id`) REFERENCES `necessity_block`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`birth_date` text DEFAULT '1990-01-01' NOT NULL,
	`lifespan` integer DEFAULT 80 NOT NULL,
	`purpose_label` text DEFAULT '' NOT NULL
);
