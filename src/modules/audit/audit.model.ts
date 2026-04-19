import { mysqlTable, int, varchar, timestamp, json, text } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { usersSistema } from '../auth/auth.model';
import { hotels } from '../organization/organization.model';

export const auditLogs = mysqlTable('AuditLog', {
  id: int('id').autoincrement().primaryKey(),
  action: varchar('action', { length: 255 }).notNull(),
  entity: varchar('entity', { length: 255 }).notNull(),
  entityId: int('entityId').notNull(),
  oldData: json('oldData'),
  newData: json('newData'),
  userId: int('userId'),
  hotelId: int('hotelId'),
  details: text('details'),
  createdAt: timestamp('createdAt').defaultNow().notNull()
});

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
   user: one(usersSistema, { fields: [auditLogs.userId], references: [usersSistema.id] }),
   hotel: one(hotels, { fields: [auditLogs.hotelId], references: [hotels.id] })
}));
