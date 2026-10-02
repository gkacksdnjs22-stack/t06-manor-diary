CREATE TABLE `completions` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`cycle` integer NOT NULL,
	`request_key` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `completions_request_key_unique` ON `completions` (`request_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_completions_task_cycle` ON `completions` (`task_id`,`cycle`);--> statement-breakpoint
CREATE TABLE `executions` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`start_at` text NOT NULL,
	`end_at` text NOT NULL,
	`actual_minutes` integer NOT NULL,
	`blocked_reason` text DEFAULT '' NOT NULL,
	`request_key` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `executions_request_key_unique` ON `executions` (`request_key`);--> statement-breakpoint
CREATE INDEX `idx_executions_task` ON `executions` (`task_id`);--> statement-breakpoint
CREATE TABLE `plan_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`plan_id` text NOT NULL,
	`version` integer NOT NULL,
	`snapshot` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_plan_versions_plan_version` ON `plan_versions` (`plan_id`,`version`);--> statement-breakpoint
CREATE TABLE `plans` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`priority` integer NOT NULL,
	`success_criteria` text NOT NULL,
	`estimated_minutes` integer NOT NULL,
	`improvement` text DEFAULT '' NOT NULL,
	`source_review_id` text,
	`created_at` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`plan_id` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`improvement` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_reviews_plan` ON `reviews` (`plan_id`);--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`plan_id` text NOT NULL,
	`title` text NOT NULL,
	`due_date` text NOT NULL,
	`priority` integer NOT NULL,
	`tags` text DEFAULT '' NOT NULL,
	`estimated_minutes` integer NOT NULL,
	`status` text DEFAULT 'todo' NOT NULL,
	`completion_cycle` integer DEFAULT 0 NOT NULL,
	`deleted_at` text,
	`created_at` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_tasks_plan_due` ON `tasks` (`plan_id`,`due_date`);