CREATE TABLE `Invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`folio` varchar(100) NOT NULL,
	`proveedor` varchar(255) NOT NULL,
	`fecha_compra` timestamp NOT NULL,
	`monto_total` decimal(15,2) DEFAULT '0.00',
	`divisa` varchar(3) DEFAULT 'MXN',
	`pdf_url` text,
	`metadata_extraida` json,
	`site_id` int,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `Invoices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `Invoices` ADD CONSTRAINT `Invoices_site_id_sites_id_fk` FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON DELETE no action ON UPDATE no action;