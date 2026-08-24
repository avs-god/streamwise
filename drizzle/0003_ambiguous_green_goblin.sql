CREATE TABLE `alertPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`availabilityChangesEnabled` boolean NOT NULL DEFAULT false,
	`renewalRemindersEnabled` boolean NOT NULL DEFAULT false,
	`renewalLeadDays` int NOT NULL DEFAULT 7,
	`inAppEnabled` boolean NOT NULL DEFAULT true,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alertPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `alertPreferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('availability_changed','renewal_due','subscription_action') NOT NULL,
	`title` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`payloadJson` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `availabilitySnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`watchlistItemId` int NOT NULL,
	`region` varchar(2) NOT NULL,
	`offersJson` text NOT NULL,
	`fingerprint` varchar(128) NOT NULL,
	`sourceUrl` varchar(1024),
	`checkedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `availabilitySnapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptionActions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`subscriptionId` int NOT NULL,
	`actionType` enum('paused','resumed','cancellation_planned','cancelled','renewal_updated') NOT NULL,
	`note` text,
	`actionAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subscriptionActions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `status` enum('active','paused','cancellation_planned','cancelled') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `pauseUntil` timestamp;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `cancellationRequestedAt` timestamp;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `endedAt` timestamp;--> statement-breakpoint
ALTER TABLE `watchlistItems` ADD `monitorAvailability` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `watchlistItems` ADD `availabilityRegion` varchar(2) DEFAULT 'US' NOT NULL;--> statement-breakpoint
CREATE INDEX `alerts_user_created_idx` ON `alerts` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `availability_snapshot_item_checked_idx` ON `availabilitySnapshots` (`watchlistItemId`,`checkedAt`);--> statement-breakpoint
CREATE INDEX `subscription_actions_user_subscription_idx` ON `subscriptionActions` (`userId`,`subscriptionId`,`actionAt`);--> statement-breakpoint
CREATE INDEX `watchlist_monitor_idx` ON `watchlistItems` (`monitorAvailability`);