"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auraHandoverLogsRelations = exports.staffRelations = exports.auraHandoverLogs = exports.staff = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const organization_model_1 = require("../organization/organization.model");
const auth_model_1 = require("../auth/auth.model");
// Map explicit to legacy table "User" to maintain DB continuity
exports.staff = (0, mysql_core_1.mysqlTable)('User', {
    id: (0, mysql_core_1.int)('id').autoincrement().primaryKey(),
    nombre: (0, mysql_core_1.varchar)('nombre', { length: 255 }).notNull(),
    correo: (0, mysql_core_1.varchar)('correo', { length: 255 }),
    usuario_login: (0, mysql_core_1.varchar)('usuario_login', { length: 255 }),
    es_jefe_de_area: (0, mysql_core_1.boolean)('es_jefe_de_area').default(false).notNull(),
    areaId: (0, mysql_core_1.int)('areaId'),
    siteId: (0, mysql_core_1.int)('siteId').notNull(),
    created_at: (0, mysql_core_1.timestamp)('created_at').defaultNow().notNull(),
    deletedAt: (0, mysql_core_1.timestamp)('deletedAt')
});
exports.auraHandoverLogs = (0, mysql_core_1.mysqlTable)('Aura_HandoverLogs', {
    id: (0, mysql_core_1.int)('id').autoincrement().primaryKey(),
    deviceId: (0, mysql_core_1.int)('device_id').notNull(),
    staffId: (0, mysql_core_1.int)('staff_id').notNull(),
    adminId: (0, mysql_core_1.int)('admin_id').notNull(),
    fechaEntregado: (0, mysql_core_1.timestamp)('fecha_entregado').defaultNow().notNull(),
    notas: (0, mysql_core_1.text)('notas')
});
exports.staffRelations = (0, drizzle_orm_1.relations)(exports.staff, ({ one, many }) => ({
    area: one(organization_model_1.areas, { fields: [exports.staff.areaId], references: [organization_model_1.areas.id] }),
    site: one(organization_model_1.sites, { fields: [exports.staff.siteId], references: [organization_model_1.sites.id] }),
    handoverLogs: many(exports.auraHandoverLogs)
}));
exports.auraHandoverLogsRelations = (0, drizzle_orm_1.relations)(exports.auraHandoverLogs, ({ one }) => ({
    staff: one(exports.staff, { fields: [exports.auraHandoverLogs.staffId], references: [exports.staff.id] }),
    admin: one(auth_model_1.usersSistema, { fields: [exports.auraHandoverLogs.adminId], references: [auth_model_1.usersSistema.id] })
}));
