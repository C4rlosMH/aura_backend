"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInactiveDevices = void 0;
const database_1 = require("../../core/database");
const inventory_model_1 = require("./inventory.model");
const drizzle_orm_1 = require("drizzle-orm");
const constants_js_1 = require("../../config/constants.js");
const getTenantFilter = (user) => {
    if (!user)
        return { siteId: -1 };
    if (user.rol === constants_js_1.ROLES.AURA_ROOT || user.rol === constants_js_1.ROLES.CORP_VIEWER || user.rol === constants_js_1.ROLES.CORP_ADMIN)
        return null;
    if (user.siteId && user.allowedSites && user.allowedSites.includes(Number(user.siteId)))
        return { siteId: Number(user.siteId) };
    if (user.allowedSites && user.allowedSites.length > 0)
        return { in: user.allowedSites };
    return { siteId: -1 };
};
const getInactiveDevices = async ({ skip, take, search, startDate, endDate }, user) => {
    const tenantFilter = getTenantFilter(user);
    const disposedStatusRes = await database_1.db.query.deviceStatus.findFirst({ where: (0, drizzle_orm_1.eq)(inventory_model_1.deviceStatus.nombre, constants_js_1.DEVICE_STATUS.DISPOSED) });
    if (!disposedStatusRes)
        return { devices: [], totalCount: 0 };
    const conditions = [(0, drizzle_orm_1.isNull)(inventory_model_1.devices.deletedAt), (0, drizzle_orm_1.eq)(inventory_model_1.devices.estadoId, disposedStatusRes.id)];
    if (tenantFilter) {
        if (tenantFilter.siteId === -1)
            conditions.push((0, drizzle_orm_1.eq)(inventory_model_1.devices.siteId, -1));
        else if (tenantFilter.in)
            conditions.push((0, drizzle_orm_1.inArray)(inventory_model_1.devices.siteId, tenantFilter.in));
        else if (tenantFilter.siteId)
            conditions.push((0, drizzle_orm_1.eq)(inventory_model_1.devices.siteId, tenantFilter.siteId));
    }
    if (search) {
        conditions.push((0, drizzle_orm_1.or)((0, drizzle_orm_1.ilike)(inventory_model_1.devices.etiqueta, `%${search}%`), (0, drizzle_orm_1.ilike)(inventory_model_1.devices.nombre_equipo, `%${search}%`), (0, drizzle_orm_1.ilike)(inventory_model_1.devices.numero_serie, `%${search}%`), (0, drizzle_orm_1.ilike)(inventory_model_1.devices.motivo_baja, `%${search}%`)));
    }
    if (startDate && endDate) {
        // Date logic simplificada, the previous logic can be emulated or we could pass the dates literally in PG/MySQL.
        const { gte, lte } = require('drizzle-orm');
        conditions.push((0, drizzle_orm_1.and)(gte(inventory_model_1.devices.fecha_baja, new Date(startDate)), lte(inventory_model_1.devices.fecha_baja, new Date(new Date(endDate).setHours(23, 59, 59, 999)))));
    }
    const list = await database_1.db.query.devices.findMany({
        where: conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined,
        offset: skip,
        limit: take,
        with: { staff: true, type: true, status: true, os: true, area: { with: { departamento: true } } },
        orderBy: (devices, { desc }) => [desc(devices.fecha_baja)]
    });
    const totals = await database_1.db.query.devices.findMany({ where: conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined, columns: { id: true } });
    return { devices: list, totalCount: totals.length };
};
exports.getInactiveDevices = getInactiveDevices;
