CREATE TABLE `userSistema` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`email` varchar(255),
	`nombre` varchar(255),
	`rol` enum('AURA_ROOT','AURA_SUPPORT','CORP_ADMIN','CORP_VIEWER','SITE_ADMIN','SITE_AUX','SITE_STAFF','SITE_GUEST') NOT NULL DEFAULT 'SITE_STAFF',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deletedAt` timestamp,
	CONSTRAINT `userSistema_id` PRIMARY KEY(`id`),
	CONSTRAINT `userSistema_username_unique` UNIQUE(`username`),
	CONSTRAINT `userSistema_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
DROP TABLE `UserSistema`;--> statement-breakpoint
ALTER TABLE `Device` ADD `precio_compra` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `Device` ADD `moneda` varchar(3) DEFAULT 'MXN';--> statement-breakpoint
ALTER TABLE `Maintenance` ADD `costo_reparacion` decimal(10,2) DEFAULT '0.00';