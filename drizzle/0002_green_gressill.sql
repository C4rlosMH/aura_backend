CREATE TABLE `supplies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(255) NOT NULL,
	`descripcion` text,
	`site_id` int NOT NULL,
	`cantidad` decimal(10,2) NOT NULL DEFAULT '0.00',
	`unidad_medida` enum('PIEZAS','METROS','LITROS','CAJAS','ROLLOS') NOT NULL DEFAULT 'PIEZAS',
	`stock_minimo` decimal(10,2) NOT NULL DEFAULT '5.00',
	`costo_unitario` decimal(10,2) NOT NULL DEFAULT '0.00',
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supplies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supply_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supply_id` int NOT NULL,
	`tipo` enum('IN','OUT') NOT NULL,
	`cantidad` decimal(10,2) NOT NULL,
	`user_id` int NOT NULL,
	`device_id` int,
	`notas` text,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `supply_transactions_id` PRIMARY KEY(`id`)
);
