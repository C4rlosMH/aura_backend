"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.areasRelations = exports.departmentsRelations = exports.sitesRelations = exports.areas = exports.departments = exports.sites = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.sites = (0, mysql_core_1.mysqlTable)('sites', {
    id: (0, mysql_core_1.int)('id').autoincrement().primaryKey(),
    nombre: (0, mysql_core_1.varchar)('nombre', { length: 255 }).unique().notNull(),
    codigo: (0, mysql_core_1.varchar)('codigo', { length: 50 }).unique().notNull(),
    direccion: (0, mysql_core_1.varchar)('direccion', { length: 255 }),
    ciudad: (0, mysql_core_1.varchar)('ciudad', { length: 255 }),
    razonSocial: (0, mysql_core_1.varchar)('razon_social', { length: 255 }),
    diminutivo: (0, mysql_core_1.varchar)('diminutivo', { length: 100 }),
    logoUrl: (0, mysql_core_1.varchar)('logo_url', { length: 500 }),
    activo: (0, mysql_core_1.boolean)('activo').default(true).notNull(),
    createdAt: (0, mysql_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: (0, mysql_core_1.timestamp)('deleted_at')
});
exports.departments = (0, mysql_core_1.mysqlTable)('departments', {
    id: (0, mysql_core_1.int)('id').autoincrement().primaryKey(),
    nombre: (0, mysql_core_1.varchar)('nombre', { length: 255 }).notNull(),
    siteId: (0, mysql_core_1.int)('site_id').notNull(),
    deletedAt: (0, mysql_core_1.timestamp)('deleted_at')
}, (t) => ({
    unq: (0, mysql_core_1.unique)().on(t.nombre, t.siteId)
}));
exports.areas = (0, mysql_core_1.mysqlTable)('areas', {
    id: (0, mysql_core_1.int)('id').autoincrement().primaryKey(),
    nombre: (0, mysql_core_1.varchar)('nombre', { length: 255 }).notNull(),
    siteId: (0, mysql_core_1.int)('site_id').notNull(),
    departamentoId: (0, mysql_core_1.int)('departamento_id').notNull(),
    environmentType: (0, mysql_core_1.mysqlEnum)('environment_type', ['SITE', 'LOBBY', 'OFFICE', 'OUTDOOR']).default('OFFICE'),
    deletedAt: (0, mysql_core_1.timestamp)('deleted_at')
}, (t) => ({
    unq: (0, mysql_core_1.unique)().on(t.nombre, t.departamentoId, t.siteId)
}));
// Relational Queries API
exports.sitesRelations = (0, drizzle_orm_1.relations)(exports.sites, ({ many }) => ({
    departments: many(exports.departments),
    areas: many(exports.areas)
}));
exports.departmentsRelations = (0, drizzle_orm_1.relations)(exports.departments, ({ one, many }) => ({
    site: one(exports.sites, {
        fields: [exports.departments.siteId],
        references: [exports.sites.id]
    }),
    areas: many(exports.areas)
}));
exports.areasRelations = (0, drizzle_orm_1.relations)(exports.areas, ({ one }) => ({
    site: one(exports.sites, {
        fields: [exports.areas.siteId],
        references: [exports.sites.id]
    }),
    departamento: one(exports.departments, {
        fields: [exports.areas.departamentoId],
        references: [exports.departments.id]
    })
}));
