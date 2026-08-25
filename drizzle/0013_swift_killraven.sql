ALTER TABLE `alertPreferences` ADD `emailEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `alertPreferences` ADD `emailRecommendationEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `alertPreferences` ADD `emailLeavingSoonEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `alertPreferences` ADD `emailCommunityEnabled` boolean DEFAULT false NOT NULL;