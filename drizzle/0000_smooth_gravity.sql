CREATE TABLE `areas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(255) NOT NULL,
	`site_id` int NOT NULL,
	`departamento_id` int NOT NULL,
	`environment_type` enum('SITE','LOBBY','OFFICE','OUTDOOR') DEFAULT 'OFFICE',
	`deleted_at` timestamp,
	CONSTRAINT `areas_id` PRIMARY KEY(`id`),
	CONSTRAINT `areas_nombre_departamento_id_site_id_unique` UNIQUE(`nombre`,`departamento_id`,`site_id`)
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(255) NOT NULL,
	`site_id` int NOT NULL,
	`deleted_at` timestamp,
	CONSTRAINT `departments_id` PRIMARY KEY(`id`),
	CONSTRAINT `departments_nombre_site_id_unique` UNIQUE(`nombre`,`site_id`)
);
--> statement-breakpoint
CREATE TABLE `sites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(255) NOT NULL,
	`codigo` varchar(50) NOT NULL,
	`direccion` varchar(255),
	`ciudad` varchar(255),
	`razon_social` varchar(255),
	`diminutivo` varchar(100),
	`logo_url` varchar(500),
	`activo` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `sites_id` PRIMARY KEY(`id`),
	CONSTRAINT `sites_nombre_unique` UNIQUE(`nombre`),
	CONSTRAINT `sites_codigo_unique` UNIQUE(`codigo`)
);
--> statement-breakpoint
CREATE TABLE `_SiteToUserSistema` (
	`A` int NOT NULL,
	`B` int NOT NULL,
	CONSTRAINT `_SiteToUserSistema_A_B_unique` UNIQUE(`A`,`B`)
);
--> statement-breakpoint
CREATE TABLE `UserSistema` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`email` varchar(255),
	`nombre` varchar(255),
	`rol` enum('AURA_ROOT','AURA_SUPPORT','CORP_ADMIN','CORP_VIEWER','SITE_ADMIN','SITE_AUX','SITE_STAFF','SITE_GUEST') NOT NULL DEFAULT 'SITE_STAFF',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deletedAt` timestamp,
	CONSTRAINT `UserSistema_id` PRIMARY KEY(`id`),
	CONSTRAINT `UserSistema_username_unique` UNIQUE(`username`),
	CONSTRAINT `UserSistema_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `Aura_HandoverLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`device_id` int NOT NULL,
	`staff_id` int NOT NULL,
	`admin_id` int NOT NULL,
	`fecha_entregado` timestamp NOT NULL DEFAULT (now()),
	`notas` text,
	CONSTRAINT `Aura_HandoverLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `User` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(255) NOT NULL,
	`correo` varchar(255),
	`usuario_login` varchar(255),
	`es_jefe_de_area` boolean NOT NULL DEFAULT false,
	`areaId` int,
	`siteId` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`deletedAt` timestamp,
	CONSTRAINT `User_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Aura_VLANs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(255) NOT NULL,
	`vlan_number` int NOT NULL,
	`subnet_cidr` varchar(50),
	`siteId` int NOT NULL,
	`deletedAt` timestamp,
	CONSTRAINT `Aura_VLANs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `DeviceStatus` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(255) NOT NULL,
	`color` varchar(50),
	`deletedAt` timestamp,
	CONSTRAINT `DeviceStatus_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `DeviceType` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(255) NOT NULL,
	`category` enum('COMPUTING','NETWORK','CCTV','PERIPHERAL','AUDIOVISUAL','POS') NOT NULL DEFAULT 'COMPUTING',
	`sub_category` varchar(100),
	`icon_id` varchar(100),
	`deletedAt` timestamp,
	CONSTRAINT `DeviceType_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Device` (
	`id` int AUTO_INCREMENT NOT NULL,
	`etiqueta` varchar(255),
	`nombre_equipo` varchar(255),
	`numero_serie` varchar(255),
	`marca` varchar(255),
	`modelo` varchar(255),
	`ip_equipo` varchar(50),
	`mac_address` varchar(50),
	`es_panda` boolean NOT NULL DEFAULT false,
	`descripcion` text,
	`comentarios` text,
	`perfiles_usuario` varchar(255),
	`office_version` varchar(255),
	`office_tipo_licencia` varchar(255),
	`garantia_numero_producto` varchar(255),
	`garantia_inicio` timestamp,
	`garantia_fin` timestamp,
	`risk_score` decimal(5,2),
	`last_env_check` timestamp,
	`fecha_baja` timestamp,
	`motivo_baja` text,
	`observaciones_baja` text,
	`usuarioId` int,
	`areaId` int,
	`siteId` int NOT NULL,
	`vlanId` int,
	`tipoId` int NOT NULL,
	`estadoId` int NOT NULL,
	`sistemaOperativoId` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deletedAt` timestamp,
	CONSTRAINT `Device_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `OperatingSystem` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(255) NOT NULL,
	`deletedAt` timestamp,
	CONSTRAINT `OperatingSystem_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `AuditLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`action` varchar(255) NOT NULL,
	`entity` varchar(255) NOT NULL,
	`entityId` int NOT NULL,
	`oldData` json,
	`newData` json,
	`userId` int,
	`siteId` int,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `AuditLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Maintenance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`estado` varchar(255) DEFAULT 'programado',
	`tipo_mantenimiento` varchar(255) NOT NULL,
	`fecha_programada` timestamp,
	`fecha_realizacion` timestamp,
	`detalles` text,
	`deviceId` int NOT NULL,
	`siteId` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`deletedAt` timestamp,
	CONSTRAINT `Maintenance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `AuraLicense` (
	`id` int AUTO_INCREMENT NOT NULL,
	`machine_id` varchar(255) NOT NULL,
	`activation_token` varchar(500),
	`is_active` boolean NOT NULL DEFAULT false,
	`last_validated_at` timestamp,
	`expire_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `AuraLicense_id` PRIMARY KEY(`id`),
	CONSTRAINT `AuraLicense_machine_id_unique` UNIQUE(`machine_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_user_b` ON `_SiteToUserSistema` (`B`);