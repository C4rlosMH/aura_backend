"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogs = exports.logActivity = void 0;
const database_1 = require("../../core/database");
const audit_model_1 = require("./audit.model");
const constants_js_1 = require("../../config/constants.js");
const drizzle_orm_1 = require("drizzle-orm");
const logActivity = async ({ action, entity, entityId, oldData = null, newData = null, user = null, details = null }) => {
    try {
        const actionsWithoutId = ['LOGIN_FAIL', 'UNAUTHORIZED_ACCESS', 'IMPORT'];
        if ((entityId === null || entityId === undefined) && !actionsWithoutId.includes(action))
            return;
        let siteIdToLog = null;
        if (user && user.siteId)
            siteIdToLog = user.siteId;
        else if (newData && newData.siteId)
            siteIdToLog = newData.siteId;
        else if (oldData && oldData.siteId)
            siteIdToLog = oldData.siteId;
        await database_1.db.insert(audit_model_1.auditLogs).values({
            action, entity,
            entityId: (entityId !== null && entityId !== undefined) ? Number(entityId) : 0,
            oldData: oldData ? oldData : null,
            newData: newData ? newData : null,
            userId: user ? Number(user.id) : null,
            siteId: siteIdToLog ? Number(siteIdToLog) : null,
            details: details || null,
        });
    }
    catch (error) {
        console.error("Error al registrar auditoría:", error.message);
    }
};
exports.logActivity = logActivity;
const getAuditLogs = async ({ skip, take, entity, userId, siteId }, user) => {
    const conditions = [];
    if (user.siteId)
        conditions.push((0, drizzle_orm_1.eq)(audit_model_1.auditLogs.siteId, user.siteId));
    else if (user.rol === constants_js_1.ROLES.AURA_ROOT || user.rol === constants_js_1.ROLES.AURA_SUPPORT) {
        if (siteId)
            conditions.push((0, drizzle_orm_1.eq)(audit_model_1.auditLogs.siteId, Number(siteId)));
    }
    else if (user.sites && user.sites.length > 0) {
        const mySiteIds = user.sites.map(h => h.id);
        if (siteId) {
            if (mySiteIds.includes(Number(siteId)))
                conditions.push((0, drizzle_orm_1.eq)(audit_model_1.auditLogs.siteId, Number(siteId)));
            else
                conditions.push((0, drizzle_orm_1.eq)(audit_model_1.auditLogs.siteId, -1));
        }
        else {
            conditions.push((0, drizzle_orm_1.inArray)(audit_model_1.auditLogs.siteId, mySiteIds));
        }
    }
    else {
        conditions.push((0, drizzle_orm_1.eq)(audit_model_1.auditLogs.siteId, -1));
    }
    if (entity)
        conditions.push((0, drizzle_orm_1.eq)(audit_model_1.auditLogs.entity, entity));
    if (userId)
        conditions.push((0, drizzle_orm_1.eq)(audit_model_1.auditLogs.userId, Number(userId)));
    const logs = await database_1.db.query.auditLogs.findMany({
        where: conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined,
        offset: skip, limit: take,
        with: { user: { columns: { username: true, nombre: true, rol: true } }, site: { columns: { nombre: true, codigo: true } } },
        orderBy: (logs, { desc }) => [desc(logs.createdAt)]
    });
    const totals = await database_1.db.query.auditLogs.findMany({ where: conditions.length ? (0, drizzle_orm_1.and)(...conditions) : undefined, columns: { id: true } });
    return { logs, totalCount: totals.length };
};
exports.getAuditLogs = getAuditLogs;
