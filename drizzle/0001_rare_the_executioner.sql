ALTER TABLE `DeviceType` MODIFY COLUMN `category` enum('COMPUTING','NETWORK','CCTV','PERIPHERAL','POS','AUDIOVISUAL') NOT NULL;--> statement-breakpoint
ALTER TABLE `DeviceType` MODIFY COLUMN `sub_category` varchar(255);--> statement-breakpoint
ALTER TABLE `DeviceType` ADD `createdAt` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `DeviceType` ADD `updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `DeviceType` ADD CONSTRAINT `DeviceType_nombre_unique` UNIQUE(`nombre`);--> statement-breakpoint
ALTER TABLE `DeviceType` DROP COLUMN `icon_id`;--> statement-breakpoint
ALTER TABLE `DeviceType` DROP COLUMN `deletedAt`;