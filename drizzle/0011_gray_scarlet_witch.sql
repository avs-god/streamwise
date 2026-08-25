CREATE TABLE `providerAlertSubscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`providerName` varchar(150) NOT NULL,
	`region` varchar(2) NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `providerAlertSubscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `provider_alert_subscription_member_provider_region_unique` UNIQUE(`userId`,`providerName`,`region`)
);
--> statement-breakpoint
CREATE INDEX `provider_alert_subscription_member_region_idx` ON `providerAlertSubscriptions` (`userId`,`region`);