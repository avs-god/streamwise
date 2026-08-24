CREATE TABLE `communityPosts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`mediaType` enum('movie','tv','unknown') NOT NULL DEFAULT 'unknown',
	`region` varchar(2) NOT NULL,
	`providerName` varchar(150),
	`kind` enum('available','ppv','leaving_soon','review','recommendation') NOT NULL,
	`body` text NOT NULL,
	`sourceUrl` varchar(1024),
	`shareAttribution` boolean NOT NULL DEFAULT false,
	`status` enum('visible','hidden','removed') NOT NULL DEFAULT 'visible',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `communityPosts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `communityReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`reporterUserId` int NOT NULL,
	`reason` enum('misleading','spam','abuse','privacy','other') NOT NULL,
	`detail` varchar(500),
	`status` enum('open','resolved','dismissed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `communityReports_id` PRIMARY KEY(`id`),
	CONSTRAINT `community_report_reporter_post_unique` UNIQUE(`reporterUserId`,`postId`)
);
--> statement-breakpoint
CREATE INDEX `community_posts_visible_created_idx` ON `communityPosts` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `community_posts_region_kind_idx` ON `communityPosts` (`region`,`kind`);--> statement-breakpoint
CREATE INDEX `community_reports_post_status_idx` ON `communityReports` (`postId`,`status`);