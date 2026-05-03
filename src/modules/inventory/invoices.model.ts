import { mysqlTable, int, varchar, decimal, text, timestamp, json } from 'drizzle-orm/mysql-core';
import { sites } from '../organization/organization.model';

export const invoices = mysqlTable('Invoices', {
    id: int('id').autoincrement().primaryKey(),
    folio: varchar('folio', { length: 100 }).notNull(), // El número de la factura
    proveedor: varchar('proveedor', { length: 255 }).notNull(),
    fechaCompra: timestamp('fecha_compra').notNull(),
    montoTotal: decimal('monto_total', { precision: 15, scale: 2 }).default('0.00'),
    divisa: varchar('divisa', { length: 3 }).default('MXN'), // MXN, USD, etc.
    
    // Ruta del archivo en el servidor (ej: /uploads/facturas/f123.pdf)
    pdfUrl: text('pdf_url'), 

    // Aquí guardaremos los datos que la IA extraiga en el futuro
    metadataExtraida: json('metadata_extraida'), 

    siteId: int('site_id').references(() => sites.id), // A qué hotel/sitio pertenece el gasto
    createdAt: timestamp('created_at').defaultNow(),
});