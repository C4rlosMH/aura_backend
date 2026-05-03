import { mysqlTable, int, varchar, timestamp, boolean, mysqlEnum, unique, decimal } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

export const sites = mysqlTable('sites', {
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
  siteId: int('site_id').notNull(),
  deletedAt: timestamp('deleted_at')
}, (t) => ({
   unq: unique().on(t.nombre, t.siteId)
}));

export const areas = mysqlTable('areas', {
  id: int('id').autoincrement().primaryKey(),
  nombre: varchar('nombre', { length: 255 }).notNull(),
  siteId: int('site_id').notNull(),
  departamentoId: int('departamento_id').notNull(),
  environmentType: mysqlEnum('environment_type', ['SITE', 'LOBBY', 'OFFICE', 'OUTDOOR']).default('OFFICE'),
  deletedAt: timestamp('deleted_at'),

  map_image_url: varchar('map_image_url', { length: 500 }), // URL del croquis (S3 o local)
  map_scale: decimal('map_scale', { precision: 5, scale: 2 }), // Opcional: para saber cuántos metros representa 1 pixel

}, (t) => ({
  unq: unique().on(t.nombre, t.departamentoId, t.siteId)
}));

// Relational Queries API
export const sitesRelations = relations(sites, ({ many }) => ({
  departments: many(departments),
  areas: many(areas)
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  site: one(sites, {
    fields: [departments.siteId],
    references: [sites.id]
  }),
  areas: many(areas)
}));

export const areasRelations = relations(areas, ({ one }) => ({
  site: one(sites, {
    fields: [areas.siteId],
    references: [sites.id]
  }),
  departamento: one(departments, {
    fields: [areas.departamentoId],
    references: [departments.id]
  })
}));
