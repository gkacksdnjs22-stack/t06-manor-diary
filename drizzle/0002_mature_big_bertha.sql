ALTER TABLE `executions` ADD `title` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `executions` ADD `ongoing` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `executions` ADD `actual_known` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `executions` ADD `assets` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `executions` ADD `schedule` text DEFAULT '' NOT NULL;