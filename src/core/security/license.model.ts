import { mysqlTable, varchar, timestamp, boolean, int } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const licenses = mysqlTable('License', {
    // ID interno de la tabla
    id: varchar('id', { length: 36 }).primaryKey(),
    
    // Nombre del Corporativo o Cliente (ej. "Hotel XYZ Corp")
    clientName: varchar('clientName', { length: 255 }).notNull(),
    
    // La llave comercial que se le dio al cliente (ej. "XYZ-1234-ABCD-5678")
    licenseKey: varchar('licenseKey', { length: 255 }).notNull().unique(),
    
    // Aquí es donde en el futuro el Asistente guardará el MachineID
    hardwareFingerprint: varchar('hardwareFingerprint', { length: 255 }),
    
    // Control de negocio: ¿Cuántos hoteles pueden conectar a la VPN?
    maxSites: int('maxSites').default(1).notNull(),
    
    // Control de pagos: ¿Está al día con su mensualidad/anualidad?
    isActive: boolean('isActive').default(true).notNull(),
    expiresAt: timestamp('expiresAt'),
    
    // Auditoría básica
    createdAt: timestamp('createdAt').default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: timestamp('updatedAt').default(sql`CURRENT_TIMESTAMP`).onUpdateNow().notNull()
});