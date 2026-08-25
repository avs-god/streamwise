CREATE TABLE `tasteProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`favoriteGenresJson` text NOT NULL,
	`preferredLanguagesJson` text NOT NULL,
	`maxRuntimeMinutes` int,
	`includeMovies` boolean NOT NULL DEFAULT true,
	`includeSeries` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasteProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `tasteProfiles_userId_unique` UNIQUE(`userId`)
);
