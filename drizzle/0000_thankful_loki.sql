CREATE TABLE `tokens` (
	`accessToken` text,
	`clientToken` text,
	`accountID` text,
	`expiryDate` text
);
--> statement-breakpoint
CREATE TABLE `users` (
	`email` text,
	`password` text,
	`username` text,
	`uuid` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);