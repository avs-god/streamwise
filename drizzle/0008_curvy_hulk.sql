CREATE TABLE `communityThreadReplies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`threadId` int NOT NULL,
	`userId` int NOT NULL,
	`parentReplyId` int,
	`body` text NOT NULL,
	`containsSpoilers` boolean NOT NULL DEFAULT false,
	`shareAttribution` boolean NOT NULL DEFAULT false,
	`status` enum('visible','hidden','removed') NOT NULL DEFAULT 'visible',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `communityThreadReplies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `communityThreadReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`threadId` int NOT NULL,
	`replyId` int,
	`reporterUserId` int NOT NULL,
	`reason` enum('spoiler','misleading','spam','abuse','privacy','other') NOT NULL,
	`detail` varchar(500),
	`status` enum('open','resolved','dismissed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `communityThreadReports_id` PRIMARY KEY(`id`),
	CONSTRAINT `thread_report_reporter_target_unique` UNIQUE(`reporterUserId`,`threadId`,`replyId`)
);
--> statement-breakpoint
CREATE TABLE `communityThreads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tmdbId` int,
	`title` varchar(500) NOT NULL,
	`mediaType` enum('movie','tv','unknown') NOT NULL DEFAULT 'unknown',
	`topic` enum('plot','recommendation','discussion','craft') NOT NULL,
	`headline` varchar(240) NOT NULL,
	`body` text NOT NULL,
	`containsSpoilers` boolean NOT NULL DEFAULT false,
	`shareAttribution` boolean NOT NULL DEFAULT false,
	`status` enum('visible','hidden','removed') NOT NULL DEFAULT 'visible',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `communityThreads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `community_thread_replies_thread_created_idx` ON `communityThreadReplies` (`threadId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `community_threads_visible_created_idx` ON `communityThreads` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `community_threads_title_idx` ON `communityThreads` (`tmdbId`,`mediaType`);