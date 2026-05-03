import { mysqlTable, int, varchar, timestamp, mysqlEnum, unique, index } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { sites } from '../organization/organization.model';

export const usersSistema = mysqlTable('userSistema', {
  id: int('id').autoincrement().primaryKey(),
  username: varchar('username', { length: 255 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique(),
  nombre: varchar('nombre', { length: 255 }),
  rol: mysqlEnum('rol', ['AURA_ROOT', 'AURA_SUPPORT', 'CORP_ADMIN', 'CORP_VIEWER', 'SITE_ADMIN', 'SITE_AUX', 'SITE_STAFF', 'SITE_GUEST']).default('SITE_STAFF').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
  deletedAt: timestamp('deletedAt')
});

// Prisma uses _SiteToUserSistema by default for implicit many-to-many
export const siteToUserSistema = mysqlTable('_SiteToUserSistema', {
  A: int('A').notNull(), // site_id
  B: int('B').notNull()  // user_sistema_id
}, (t) => ({
  unq: unique().on(t.A, t.B),
  idx_B: index('idx_user_b').on(t.B)
}));

export const usersSistemaRelations = relations(usersSistema, ({ many }) => ({
  sitesConnection: many(siteToUserSistema)
}));

export const siteToUserSistemaRelations = relations(siteToUserSistema, ({ one }) => ({
  site: one(sites, {
    fields: [siteToUserSistema.A],
    references: [sites.id]
  }),
  user: one(usersSistema, {
    fields: [siteToUserSistema.B],
    references: [usersSistema.id]
  })
}));
