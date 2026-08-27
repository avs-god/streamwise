CREATE TABLE `browserPushSubscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`endpoint` varchar(2048) NOT NULL,
	`p256dh` varchar(512) NOT NULL,
	`auth` varchar(512) NOT NULL,
	`userAgent` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `browserPushSubscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `browser_push_endpoint_unique` UNIQUE(`endpoint`)
);
--> statement-breakpoint
CREATE INDEX `browser_push_user_idx` ON `browserPushSubscriptions` (`userId`);