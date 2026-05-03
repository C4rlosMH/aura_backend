"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMaintenance = exports.updateMaintenance = exports.createMaintenance = exports.getMaintenanceById = exports.getMaintenances = void 0;
const database_1 = require("../../core/database");
const maintenance_model_1 = require("./maintenance.model");
const inventory_model_1 = require("../inventory/inventory.model");
const constants_js_1 = require("../../config/constants.js");
const auditService = __importStar(require("../audit/audit.service"));
const drizzle_orm_1 = require("drizzle-orm");
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
const getMaintenances = async ({ skip, take, sortBy, order }, user) => {
    const tenantFilter = getTenantFilter(user);
    const conds = [(0, drizzle_orm_1.isNull)(maintenance_model_1.maintenances.deletedAt)];
    if (tenantFilter) {
        if (tenantFilter.siteId === -1)
            conds.push((0, drizzle_orm_1.eq)(maintenance_model_1.maintenances.siteId, -1));
        else if (tenantFilter.siteId)
            conds.push((0, drizzle_orm_1.eq)(maintenance_model_1.maintenances.siteId, tenantFilter.siteId));
        else if (tenantFilter.in)
            conds.push((0, drizzle_orm_1.inArray)(maintenance_model_1.maintenances.siteId, tenantFilter.in));
    }
    const list = await database_1.db.query.maintenances.findMany({
        where: (0, drizzle_orm_1.and)(...conds),
        offset: skip, limit: take,
        with: { device: { with: { staff: true, area: { with: { departamento: true } } } }, site: true },
        orderBy: (m, { asc, desc }) => [order === 'desc' ? desc(m[sortBy || 'fecha_programada']) : asc(m[sortBy || 'fecha_programada'])]
    });
    const totals = await database_1.db.query.maintenances.findMany({ where: (0, drizzle_orm_1.and)(...conds), columns: { id: true } });
    return { maintenances: list, totalCount: totals.length };
};
exports.getMaintenances = getMaintenances;
const getMaintenanceById = async (id, user) => {
    const tenantFilter = getTenantFilter(user);
    const conds = [(0, drizzle_orm_1.eq)(maintenance_model_1.maintenances.id, Number(id)), (0, drizzle_orm_1.isNull)(maintenance_model_1.maintenances.deletedAt)];
    if (tenantFilter) {
        if (tenantFilter.siteId === -1)
            conds.push((0, drizzle_orm_1.eq)(maintenance_model_1.maintenances.siteId, -1));
        else if (tenantFilter.siteId)
            conds.push((0, drizzle_orm_1.eq)(maintenance_model_1.maintenances.siteId, tenantFilter.siteId));
        else if (tenantFilter.in)
            conds.push((0, drizzle_orm_1.inArray)(maintenance_model_1.maintenances.siteId, tenantFilter.in));
    }
    return await database_1.db.query.maintenances.findFirst({ where: (0, drizzle_orm_1.and)(...conds), with: { device: { with: { staff: true, area: true } } } });
};
exports.getMaintenanceById = getMaintenanceById;
const createMaintenance = async (data, user) => {
    const device = await database_1.db.query.devices.findFirst({ where: (0, drizzle_orm_1.eq)(inventory_model_1.devices.id, Number(data.deviceId)) });
    if (!device)
        throw new Error("Dispositivo no encontrado en Aura.");
    if (user.siteId && device.siteId !== user.siteId)
        throw new Error("Acceso denegado al Tenant de este equipo.");
    if (!user.siteId && user.sites && user.sites.length > 0) {
        const hasAccess = user.sites.some(h => h.id === device.siteId);
        if (!hasAccess && user.rol !== constants_js_1.ROLES.AURA_ROOT)
            throw new Error("Permisos insuficientes.");
    }
    const [res] = await database_1.db.insert(maintenance_model_1.maintenances).values({ ...data, siteId: device.siteId, fecha_programada: data.fecha_programada ? new Date(data.fecha_programada) : null, fecha_realizacion: data.fecha_realizacion ? new Date(data.fecha_realizacion) : null });
    const newId = res.insertId;
    const newManto = await database_1.db.query.maintenances.findFirst({ where: (0, drizzle_orm_1.eq)(maintenance_model_1.maintenances.id, newId) });
    await auditService.logActivity({
        action: 'CREATE', entity: 'Maintenance', entityId: newId, newData: newManto, user, details: `Mantenimiento Aura programado (Equipo: ${device.id})`
    });
    return newManto;
};
exports.createMaintenance = createMaintenance;
const updateMaintenance = async (id, data, user) => {
    const mantoId = Number(id);
    const oldManto = await (0, exports.getMaintenanceById)(mantoId, user);
    if (!oldManto)
        throw new Error("Registro no encontrado.");
    await database_1.db.update(maintenance_model_1.maintenances).set({ ...data, fecha_programada: data.fecha_programada ? new Date(data.fecha_programada) : oldManto.fecha_programada, fecha_realizacion: data.fecha_realizacion ? new Date(data.fecha_realizacion) : oldManto.fecha_realizacion }).where((0, drizzle_orm_1.eq)(maintenance_model_1.maintenances.id, mantoId));
    const updatedManto = await database_1.db.query.maintenances.findFirst({ where: (0, drizzle_orm_1.eq)(maintenance_model_1.maintenances.id, mantoId) });
    let details = "Aura Mantenimiento Modificado";
    if (oldManto.estado !== 'realizado' && data.estado === 'realizado')
        details = "Aura Mantenimiento COMPLETADO";
    await auditService.logActivity({
        action: 'UPDATE', entity: 'Maintenance', entityId: mantoId, oldData: oldManto, newData: updatedManto, user, details
    });
    return updatedManto;
};
exports.updateMaintenance = updateMaintenance;
const deleteMaintenance = async (id, user) => {
    const mantoId = Number(id);
    const oldManto = await (0, exports.getMaintenanceById)(mantoId, user);
    if (!oldManto)
        throw new Error("Registro inalcanzable.");
    await database_1.db.update(maintenance_model_1.maintenances).set({ deletedAt: new Date() }).where((0, drizzle_orm_1.eq)(maintenance_model_1.maintenances.id, mantoId));
    await auditService.logActivity({ action: 'DELETE', entity: 'Maintenance', entityId: mantoId, oldData: oldManto, user, details: "Mantenimiento eliminado (Soft Delete)" });
    return { message: "Eliminado de Aura" };
};
exports.deleteMaintenance = deleteMaintenance;
