CREATE TABLE `publicLeavingSoonResearch` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tmdbId` int NOT NULL,
	`mediaType` enum('movie','tv') NOT NULL,
	`region` varchar(2) NOT NULL,
	`directResponse` text NOT NULL,
	`sourcesJson` text NOT NULL,
	`communitySourcesJson` text NOT NULL,
	`status` enum('lead','insufficient','unavailable') NOT NULL,
	`searchedAt` timestamp NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `publicLeavingSoonResearch_id` PRIMARY KEY(`id`),
	CONSTRAINT `public_leaving_soon_title_region_unique` UNIQUE(`tmdbId`,`mediaType`,`region`)
);
--> statement-breakpoint
CREATE INDEX `public_leaving_soon_active_lookup_idx` ON `publicLeavingSoonResearch` (`tmdbId`,`mediaType`,`region`,`expiresAt`);