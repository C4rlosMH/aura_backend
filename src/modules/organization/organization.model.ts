import { mysqlTable, int, varchar, timestamp, boolean, mysqlEnum, unique } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

export const hotels = mysqlTable('hotels', {
  id: int('id').autoincrement().primaryKey(),
  nombre: varchar('nombre', { length: 255 }).unique().notNull(),
  codigo: varchar('codigo', { length: 50 }).unique().notNull(),
  direccion: varchar('direccion', { length: 255 }),
  ciudad: varchar('ciudad', { length: 255 }),
  razonSocial: varchar('razon_social', { length: 255 }),
  diminutivo: varchar('diminutivo', { length: 100 }),
  logoUrl: varchar('logo_url', { length: 500 }),
  activo: boolean('activo').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  deletedAt: timestamp('deleted_at')
});

export const departments = mysqlTable('departments', {
  id: int('id').autoincrement().primaryKey(),
  nombre: varchar('nombre', { length: 255 }).notNull(),
  hotelId: int('hotel_id').notNull(),
  deletedAt: timestamp('deleted_at')
}, (t) => ({
   unq: unique().on(t.nombre, t.hotelId)
}));

export const areas = mysqlTable('areas', {
  id: int('id').autoincrement().primaryKey(),
  nombre: varchar('nombre', { length: 255 }).notNull(),
  hotelId: int('hotel_id').notNull(),
  departamentoId: int('departamento_id').notNull(),
  environmentType: mysqlEnum('environment_type', ['SITE', 'LOBBY', 'OFFICE', 'OUTDOOR']).default('OFFICE'),
  deletedAt: timestamp('deleted_at')
}, (t) => ({
  unq: unique().on(t.nombre, t.departamentoId, t.hotelId)
}));

// Relational Queries API
export const hotelsRelations = relations(hotels, ({ many }) => ({
  departments: many(departments),
  areas: many(areas)
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  hotel: one(hotels, {
    fields: [departments.hotelId],
    references: [hotels.id]
  }),
  areas: many(areas)
}));

export const areasRelations = relations(areas, ({ one }) => ({
  hotel: one(hotels, {
    fields: [areas.hotelId],
    references: [hotels.id]
  }),
  departamento: one(departments, {
    fields: [areas.departamentoId],
    references: [departments.id]
  })
}));
