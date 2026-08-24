CREATE TABLE `viewingSignals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tmdbId` int NOT NULL,
	`mediaType` enum('movie','tv') NOT NULL,
	`title` varchar(500) NOT NULL,
	`status` enum('watched') NOT NULL DEFAULT 'watched',
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `viewingSignals_id` PRIMARY KEY(`id`),
	CONSTRAINT `viewing_signal_member_title_unique` UNIQUE(`userId`,`tmdbId`,`mediaType`)
);
--> statement-breakpoint
CREATE INDEX `viewing_signal_member_recorded_idx` ON `viewingSignals` (`userId`,`recordedAt`);
