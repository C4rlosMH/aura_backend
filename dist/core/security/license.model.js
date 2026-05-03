"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auraLicense = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
exports.auraLicense = (0, mysql_core_1.mysqlTable)('AuraLicense', {
    id: (0, mysql_core_1.int)('id').autoincrement().primaryKey(),
    machineId: (0, mysql_core_1.varchar)('machine_id', { length: 255 }).unique().notNull(),
    activationToken: (0, mysql_core_1.varchar)('activation_token', { length: 500 }),
    isActive: (0, mysql_core_1.boolean)('is_active').default(false).notNull(),
    lastValidatedAt: (0, mysql_core_1.timestamp)('last_validated_at'),
    expireAt: (0, mysql_core_1.timestamp)('expire_at'),
    createdAt: (0, mysql_core_1.timestamp)('created_at').defaultNow().notNull()
});
