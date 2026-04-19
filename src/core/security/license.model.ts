import { mysqlTable, int, varchar, timestamp, boolean } from 'drizzle-orm/mysql-core';

export const auraLicense = mysqlTable('AuraLicense', {
  id: int('id').autoincrement().primaryKey(),
  machineId: varchar('machine_id', { length: 255 }).unique().notNull(),
  activationToken: varchar('activation_token', { length: 500 }),
  isActive: boolean('is_active').default(false).notNull(),
  lastValidatedAt: timestamp('last_validated_at'),
  expireAt: timestamp('expire_at'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});
