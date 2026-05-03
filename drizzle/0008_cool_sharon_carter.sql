ALTER TABLE `Aura_VLANs` DROP INDEX `vlan_site_idx`;--> statement-breakpoint
ALTER TABLE `Aura_VLANs` DROP INDEX `segment_site_idx`;--> statement-breakpoint
ALTER TABLE `Aura_VLANs` DROP FOREIGN KEY `Aura_VLANs_siteId_sites_id_fk`;
--> statement-breakpoint
ALTER TABLE `Aura_VLANs` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `Aura_IP_Assignments` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `Aura_IP_Assignments` MODIFY COLUMN `device_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `Aura_IP_Assignments` MODIFY COLUMN `vlan_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `Aura_VLANs` ADD `site_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `Aura_VLANs` ADD CONSTRAINT `vlan_site_idx` UNIQUE(`vlan_number`,`site_id`);--> statement-breakpoint
ALTER TABLE `Aura_VLANs` ADD CONSTRAINT `segment_site_idx` UNIQUE(`network_segment`,`site_id`);--> statement-breakpoint
ALTER TABLE `Aura_VLANs` ADD CONSTRAINT `Aura_VLANs_site_id_sites_id_fk` FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Aura_VLANs` DROP COLUMN `siteId`;