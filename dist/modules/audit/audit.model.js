"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogsRelations = exports.auditLogs = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const auth_model_1 = require("../auth/auth.model");
const organization_model_1 = require("../organization/organization.model");
exports.auditLogs = (0, mysql_core_1.mysqlTable)('AuditLog', {
    id: (0, mysql_core_1.int)('id').autoincrement().primaryKey(),
    action: (0, mysql_core_1.varchar)('action', { length: 255 }).notNull(),
    entity: (0, mysql_core_1.varchar)('entity', { length: 255 }).notNull(),
    entityId: (0, mysql_core_1.int)('entityId').notNull(),
    oldData: (0, mysql_core_1.json)('oldData'),
    newData: (0, mysql_core_1.json)('newData'),
    userId: (0, mysql_core_1.int)('userId'),
    siteId: (0, mysql_core_1.int)('siteId'),
    details: (0, mysql_core_1.text)('details'),
    createdAt: (0, mysql_core_1.timestamp)('createdAt').defaultNow().notNull()
});
exports.auditLogsRelations = (0, drizzle_orm_1.relations)(exports.auditLogs, ({ one }) => ({
    user: one(auth_model_1.usersSistema, { fields: [exports.auditLogs.userId], references: [auth_model_1.usersSistema.id] }),
    site: one(organization_model_1.sites, { fields: [exports.auditLogs.siteId], references: [organization_model_1.sites.id] })
}));
