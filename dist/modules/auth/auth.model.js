"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.siteToUserSistemaRelations = exports.usersSistemaRelations = exports.siteToUserSistema = exports.usersSistema = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const organization_model_1 = require("../organization/organization.model");
exports.usersSistema = (0, mysql_core_1.mysqlTable)('UserSistema', {
    id: (0, mysql_core_1.int)('id').autoincrement().primaryKey(),
    username: (0, mysql_core_1.varchar)('username', { length: 255 }).unique().notNull(),
    password: (0, mysql_core_1.varchar)('password', { length: 255 }).notNull(),
    email: (0, mysql_core_1.varchar)('email', { length: 255 }).unique(),
    nombre: (0, mysql_core_1.varchar)('nombre', { length: 255 }),
    rol: (0, mysql_core_1.mysqlEnum)('rol', ['AURA_ROOT', 'AURA_SUPPORT', 'CORP_ADMIN', 'CORP_VIEWER', 'SITE_ADMIN', 'SITE_AUX', 'SITE_STAFF', 'SITE_GUEST']).default('SITE_STAFF').notNull(),
    createdAt: (0, mysql_core_1.timestamp)('createdAt').defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)('updatedAt').defaultNow().onUpdateNow().notNull(),
    deletedAt: (0, mysql_core_1.timestamp)('deletedAt')
});
// Prisma uses _SiteToUserSistema by default for implicit many-to-many
exports.siteToUserSistema = (0, mysql_core_1.mysqlTable)('_SiteToUserSistema', {
    A: (0, mysql_core_1.int)('A').notNull(), // site_id
    B: (0, mysql_core_1.int)('B').notNull() // user_sistema_id
}, (t) => ({
    unq: (0, mysql_core_1.unique)().on(t.A, t.B),
    idx_B: (0, mysql_core_1.index)('idx_user_b').on(t.B)
}));
exports.usersSistemaRelations = (0, drizzle_orm_1.relations)(exports.usersSistema, ({ many }) => ({
    sitesConnection: many(exports.siteToUserSistema)
}));
exports.siteToUserSistemaRelations = (0, drizzle_orm_1.relations)(exports.siteToUserSistema, ({ one }) => ({
    site: one(organization_model_1.sites, {
        fields: [exports.siteToUserSistema.A],
        references: [organization_model_1.sites.id]
    }),
    user: one(exports.usersSistema, {
        fields: [exports.siteToUserSistema.B],
        references: [exports.usersSistema.id]
    })
}));
