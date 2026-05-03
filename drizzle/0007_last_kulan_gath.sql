CREATE TABLE `Aura_IP_Assignments` (
	`id` varchar(36) NOT NULL,
	`ip_address` varchar(15) NOT NULL,
	`mac_address` varchar(17),
	`device_id` varchar(36) NOT NULL,
	`vlan_id` varchar(36) NOT NULL,
	`port_number` int,
	`type` enum('STATIC','DHCP_RESERVED','DYNAMIC') DEFAULT 'STATIC',
	CONSTRAINT `Aura_IP_Assignments_id` PRIMARY KEY(`id`),
	CONSTRAINT `ip_vlan_idx` UNIQUE(`ip_address`,`vlan_id`)
);
--> statement-breakpoint
ALTER TABLE `Aura_VLANs` MODIFY COLUMN `id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `Aura_VLANs` MODIFY COLUMN `siteId` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `Aura_VLANs` ADD `name` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `Aura_VLANs` ADD `network_segment` varchar(18) NOT NULL;--> statement-breakpoint
ALTER TABLE `Aura_VLANs` ADD `gateway` varchar(15);--> statement-breakpoint
ALTER TABLE `Aura_VLANs` ADD CONSTRAINT `vlan_site_idx` UNIQUE(`vlan_number`,`siteId`);--> statement-breakpoint
ALTER TABLE `Aura_VLANs` ADD CONSTRAINT `segment_site_idx` UNIQUE(`network_segment`,`siteId`);--> statement-breakpoint
ALTER TABLE `Aura_IP_Assignments` ADD CONSTRAINT `Aura_IP_Assignments_device_id_Device_id_fk` FOREIGN KEY (`device_id`) REFERENCES `Device`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Aura_IP_Assignments` ADD CONSTRAINT `Aura_IP_Assignments_vlan_id_Aura_VLANs_id_fk` FOREIGN KEY (`vlan_id`) REFERENCES `Aura_VLANs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Aura_VLANs` ADD CONSTRAINT `Aura_VLANs_siteId_sites_id_fk` FOREIGN KEY (`siteId`) REFERENCES `sites`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Aura_VLANs` DROP COLUMN `nombre`;--> statement-breakpoint
ALTER TABLE `Aura_VLANs` DROP COLUMN `subnet_cidr`;--> statement-breakpoint
ALTER TABLE `Aura_VLANs` DROP COLUMN `deletedAt`;