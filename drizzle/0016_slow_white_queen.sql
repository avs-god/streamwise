CREATE TABLE `confirmedProviderDepartures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tmdbId` int NOT NULL,
	`mediaType` enum('movie','tv') NOT NULL,
	`region` varchar(2) NOT NULL,
	`title` varchar(500) NOT NULL,
	`providerName` varchar(150) NOT NULL,
	`providerType` varchar(24) NOT NULL,
	`sourceUrl` varchar(1024),
	`firstObservedAt` timestamp NOT NULL,
	`lastObservedAt` timestamp NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`status` enum('active','resolved') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `confirmedProviderDepartures_id` PRIMARY KEY(`id`),
	CONSTRAINT `confirmed_departure_title_provider_region_unique` UNIQUE(`tmdbId`,`mediaType`,`region`,`providerName`)
);
--> statement-breakpoint
CREATE INDEX `confirmed_departure_active_lookup_idx` ON `confirmedProviderDepartures` (`tmdbId`,`mediaType`,`region`,`status`,`expiresAt`);