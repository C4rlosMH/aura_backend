CREATE TABLE `License` (
	`id` varchar(36) NOT NULL,
	`clientName` varchar(255) NOT NULL,
	`licenseKey` varchar(255) NOT NULL,
	`hardwareFingerprint` varchar(255),
	`maxSites` int NOT NULL DEFAULT 1,
	`isActive` boolean NOT NULL DEFAULT true,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `License_id` PRIMARY KEY(`id`),
	CONSTRAINT `License_licenseKey_unique` UNIQUE(`licenseKey`)
);
--> statement-breakpoint
DROP TABLE `AuraLicense`;--> statement-breakpoint
ALTER TABLE `Device` ADD `invoice_id` int;--> statement-breakpoint
ALTER TABLE `supplies` ADD `invoice_id` int;--> statement-breakpoint
ALTER TABLE `Device` ADD CONSTRAINT `Device_invoice_id_Invoices_id_fk` FOREIGN KEY (`invoice_id`) REFERENCES `Invoices`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplies` ADD CONSTRAINT `supplies_invoice_id_Invoices_id_fk` FOREIGN KEY (`invoice_id`) REFERENCES `Invoices`(`id`) ON DELETE no action ON UPDATE no action;