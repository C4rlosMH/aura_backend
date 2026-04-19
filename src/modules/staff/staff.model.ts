import { mysqlTable, int, varchar, timestamp, boolean, text } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { areas, hotels } from '../organization/organization.model';
import { usersSistema } from '../auth/auth.model';

// Map explicit to legacy table "User" to maintain DB continuity
export const staff = mysqlTable('User', { 
  id: int('id').autoincrement().primaryKey(),
  nombre: varchar('nombre', { length: 255 }).notNull(),
  correo: varchar('correo', { length: 255 }),
  usuario_login: varchar('usuario_login', { length: 255 }),
  es_jefe_de_area: boolean('es_jefe_de_area').default(false).notNull(),
  areaId: int('areaId'),
  hotelId: int('hotelId').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deletedAt')
});

export const auraHandoverLogs = mysqlTable('Aura_HandoverLogs', {
    id: int('id').autoincrement().primaryKey(),
    deviceId: int('device_id').notNull(), 
    staffId: int('staff_id').notNull(), 
    adminId: int('admin_id').notNull(),
    fechaEntregado: timestamp('fecha_entregado').defaultNow().notNull(),
    notas: text('notas')
});

export const staffRelations = relations(staff, ({ one, many }) => ({
  area: one(areas, { fields: [staff.areaId], references: [areas.id] }),
  hotel: one(hotels, { fields: [staff.hotelId], references: [hotels.id] }),
  handoverLogs: many(auraHandoverLogs)
}));

export const auraHandoverLogsRelations = relations(auraHandoverLogs, ({ one }) => ({
   staff: one(staff, { fields: [auraHandoverLogs.staffId], references: [staff.id] }),
   admin: one(usersSistema, { fields: [auraHandoverLogs.adminId], references: [usersSistema.id] })
}));
