ALTER TABLE `plans` ADD `estimated_known` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `estimated_known` integer DEFAULT 1 NOT NULL;