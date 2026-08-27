CREATE TABLE `announcedStreamingReleases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tmdbId` int NOT NULL,
	`mediaType` enum('movie','tv') NOT NULL,
	`region` varchar(2) NOT NULL,
	`title` varchar(500) NOT NULL,
	`providerName` varchar(150) NOT NULL,
	`providerType` varchar(24) NOT NULL,
	`sourceKind` enum('provider_change_feed') NOT NULL DEFAULT 'provider_change_feed',
	`sourceUrl` varchar(1024),
	`announcedFor` timestamp NOT NULL,
	`retrievedAt` timestamp NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`status` enum('active','resolved') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `announcedStreamingReleases_id` PRIMARY KEY(`id`),
	CONSTRAINT `announced_streaming_title_provider_region_unique` UNIQUE(`tmdbId`,`mediaType`,`region`,`providerName`)
);
--> statement-breakpoint
CREATE INDEX `announced_streaming_active_lookup_idx` ON `announcedStreamingReleases` (`tmdbId`,`mediaType`,`region`,`status`,`announcedFor`);