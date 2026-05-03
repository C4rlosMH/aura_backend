"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maintenancesRelations = exports.maintenances = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const inventory_model_1 = require("../inventory/inventory.model");
const organization_model_1 = require("../organization/organization.model");
exports.maintenances = (0, mysql_core_1.mysqlTable)('Maintenance', {
    id: (0, mysql_core_1.int)('id').autoincrement().primaryKey(),
    estado: (0, mysql_core_1.varchar)('estado', { length: 255 }).default('programado'),
    tipo_mantenimiento: (0, mysql_core_1.varchar)('tipo_mantenimiento', { length: 255 }).notNull(),
    fecha_programada: (0, mysql_core_1.timestamp)('fecha_programada'),
    fecha_realizacion: (0, mysql_core_1.timestamp)('fecha_realizacion'),
    detalles: (0, mysql_core_1.text)('detalles'),
    deviceId: (0, mysql_core_1.int)('deviceId').notNull(),
    siteId: (0, mysql_core_1.int)('siteId').notNull(),
    created_at: (0, mysql_core_1.timestamp)('created_at').defaultNow().notNull(),
    deletedAt: (0, mysql_core_1.timestamp)('deletedAt')
});
exports.maintenancesRelations = (0, drizzle_orm_1.relations)(exports.maintenances, ({ one }) => ({
    device: one(inventory_model_1.devices, { fields: [exports.maintenances.deviceId], references: [inventory_model_1.devices.id] }),
    site: one(organization_model_1.sites, { fields: [exports.maintenances.siteId], references: [organization_model_1.sites.id] })
}));
