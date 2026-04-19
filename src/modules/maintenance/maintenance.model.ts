import { mysqlTable, int, varchar, timestamp, text } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { devices } from '../inventory/inventory.model';
import { hotels } from '../organization/organization.model';

export const maintenances = mysqlTable('Maintenance', {
  id: int('id').autoincrement().primaryKey(),
  estado: varchar('estado', { length: 255 }).default('programado'),
  tipo_mantenimiento: varchar('tipo_mantenimiento', { length: 255 }).notNull(),
  fecha_programada: timestamp('fecha_programada'),
  fecha_realizacion: timestamp('fecha_realizacion'),
  detalles: text('detalles'),
  deviceId: int('deviceId').notNull(),
  hotelId: int('hotelId').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deletedAt')
});

export const maintenancesRelations = relations(maintenances, ({ one }) => ({
   device: one(devices, { fields: [maintenances.deviceId], references: [devices.id] }),
   hotel: one(hotels, { fields: [maintenances.hotelId], references: [hotels.id] })
}));
