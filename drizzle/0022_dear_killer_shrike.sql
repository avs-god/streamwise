ALTER TABLE `tasteProfiles` ADD `defaultRegion` varchar(2) DEFAULT 'IN' NOT NULL;--> statement-breakpoint
ALTER TABLE `tasteProfiles` ADD `interfaceDensity` enum('comfortable','compact') DEFAULT 'comfortable' NOT NULL;--> statement-breakpoint
ALTER TABLE `tasteProfiles` ADD `reducedMotion` boolean DEFAULT false NOT NULL;