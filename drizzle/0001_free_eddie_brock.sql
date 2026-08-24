CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`providerName` varchar(150) NOT NULL,
	`planName` varchar(150) NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL,
	`billingCycle` enum('monthly','quarterly','yearly') NOT NULL,
	`renewalDate` timestamp,
	`viewingIntent` enum('watch_now','considering','keep') NOT NULL DEFAULT 'considering',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `watchlistItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tmdbId` int NOT NULL,
	`mediaType` enum('movie','tv') NOT NULL,
	`title` varchar(500) NOT NULL,
	`posterPath` varchar(500),
	`releaseDate` varchar(16),
	`plannedFor` enum('this_week','this_month','someday') NOT NULL DEFAULT 'someday',
	`providerNamesJson` text NOT NULL,
	`availabilityCheckedAt` timestamp,
	`availabilitySourceUrl` varchar(1024),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `watchlistItems_id` PRIMARY KEY(`id`),
	CONSTRAINT `watchlist_user_title_unique` UNIQUE(`userId`,`tmdbId`,`mediaType`)
);
