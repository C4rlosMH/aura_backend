import { mysqlTable, int, varchar, timestamp, mysqlEnum, unique, index } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { hotels } from '../organization/organization.model';

export const usersSistema = mysqlTable('UserSistema', {
  id: int('id').autoincrement().primaryKey(),
  username: varchar('username', { length: 255 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique(),
  nombre: varchar('nombre', { length: 255 }),
  rol: mysqlEnum('rol', ['AURA_ROOT', 'AURA_SUPPORT', 'CORP_ADMIN', 'CORP_VIEWER', 'HOTEL_ADMIN', 'HOTEL_AUX', 'HOTEL_STAFF', 'HOTEL_GUEST']).default('HOTEL_STAFF').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
  deletedAt: timestamp('deletedAt')
});

// Prisma uses _HotelToUserSistema by default for implicit many-to-many
export const hotelToUserSistema = mysqlTable('_HotelToUserSistema', {
  A: int('A').notNull(), // hotel_id
  B: int('B').notNull()  // user_sistema_id
}, (t) => ({
  unq: unique().on(t.A, t.B),
  idx_B: index('idx_user_b').on(t.B)
}));

export const usersSistemaRelations = relations(usersSistema, ({ many }) => ({
  hotelsConnection: many(hotelToUserSistema)
}));

export const hotelToUserSistemaRelations = relations(hotelToUserSistema, ({ one }) => ({
  hotel: one(hotels, {
    fields: [hotelToUserSistema.A],
    references: [hotels.id]
  }),
  user: one(usersSistema, {
    fields: [hotelToUserSistema.B],
    references: [usersSistema.id]
  })
}));
