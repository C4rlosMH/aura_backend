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
exports.deleteArea = exports.updateArea = exports.createArea = exports.getAreaById = exports.getAllAreas = exports.getAreas = void 0;
const database_1 = require("../../core/database");
const organization_model_1 = require("./organization.model");
const drizzle_orm_1 = require("drizzle-orm");
const auditService = __importStar(require("../audit/audit.service"));
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
const getAreas = async ({ skip, take, sortBy, order }, user) => {
    const tenantFilter = getTenantFilter(user);
    const conditions = [(0, drizzle_orm_1.isNull)(organization_model_1.areas.deletedAt)];
    if (tenantFilter) {
        if (tenantFilter.siteId === -1)
            conditions.push((0, drizzle_orm_1.eq)(organization_model_1.areas.siteId, -1));
        else if (tenantFilter.in)
            conditions.push((0, drizzle_orm_1.inArray)(organization_model_1.areas.siteId, tenantFilter.in));
        else if (tenantFilter.siteId)
            conditions.push((0, drizzle_orm_1.eq)(organization_model_1.areas.siteId, tenantFilter.siteId));
    }
    const result = await database_1.db.query.areas.findMany({
        where: conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined,
        with: {
            departamento: true,
            site: { columns: { nombre: true, codigo: true, id: true } }
        },
        offset: skip,
        limit: take,
        orderBy: (areas, { asc, desc }) => [order === 'desc' ? desc(areas.nombre) : asc(areas.nombre)]
    });
    const allAreas = await database_1.db.query.areas.findMany({
        where: conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined,
        columns: { id: true }
    });
    const totalCount = allAreas.length;
    return { areas: result, totalCount };
};
exports.getAreas = getAreas;
const getAllAreas = async (user) => {
    const tenantFilter = getTenantFilter(user);
    const conditions = [(0, drizzle_orm_1.isNull)(organization_model_1.areas.deletedAt)];
    if (tenantFilter) {
        if (tenantFilter.siteId === -1)
            conditions.push((0, drizzle_orm_1.eq)(organization_model_1.areas.siteId, -1));
        else if (tenantFilter.in)
            conditions.push((0, drizzle_orm_1.inArray)(organization_model_1.areas.siteId, tenantFilter.in));
        else if (tenantFilter.siteId)
            conditions.push((0, drizzle_orm_1.eq)(organization_model_1.areas.siteId, tenantFilter.siteId));
    }
    return await database_1.db.query.areas.findMany({
        where: conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined,
        with: { departamento: true },
        orderBy: (areas, { asc }) => [asc(areas.nombre)]
    });
};
exports.getAllAreas = getAllAreas;
const getAreaById = async (id, user) => {
    const tenantFilter = getTenantFilter(user);
    const conditions = [(0, drizzle_orm_1.eq)(organization_model_1.areas.id, Number(id)), (0, drizzle_orm_1.isNull)(organization_model_1.areas.deletedAt)];
    if (tenantFilter) {
        if (tenantFilter.siteId === -1)
            conditions.push((0, drizzle_orm_1.eq)(organization_model_1.areas.siteId, -1));
        else if (tenantFilter.in)
            conditions.push((0, drizzle_orm_1.inArray)(organization_model_1.areas.siteId, tenantFilter.in));
        else if (tenantFilter.siteId)
            conditions.push((0, drizzle_orm_1.eq)(organization_model_1.areas.siteId, tenantFilter.siteId));
    }
    return await database_1.db.query.areas.findFirst({
        where: conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined,
        with: { departamento: true }
    });
};
exports.getAreaById = getAreaById;
const createArea = async (data, user) => {
    let siteIdToAssign = user.siteId;
    if (!siteIdToAssign && data.siteId)
        siteIdToAssign = Number(data.siteId);
    if (user.rol !== constants_js_1.ROLES.AURA_ROOT && user.sites) {
        const canCreate = user.sites.some((h) => h.id === siteIdToAssign);
        if (!canCreate)
            throw new Error("No tienes permiso para crear áreas en este sitio.");
    }
    if (!siteIdToAssign)
        throw new Error("Se requiere un sitio para crear el área.");
    const dept = await database_1.db.query.departments.findFirst({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(organization_model_1.departments.id, Number(data.departamentoId)), (0, drizzle_orm_1.eq)(organization_model_1.departments.siteId, siteIdToAssign))
    });
    if (!dept)
        throw new Error("El departamento seleccionado no existe o no pertenece a tu site.");
    const [result] = await database_1.db.insert(organization_model_1.areas).values({
        nombre: data.nombre,
        departamentoId: Number(data.departamentoId),
        siteId: siteIdToAssign,
        environmentType: data.environmentType || 'OFFICE'
    });
    const newAreaId = result.insertId;
    const newArea = await database_1.db.query.areas.findFirst({ where: (0, drizzle_orm_1.eq)(organization_model_1.areas.id, newAreaId) });
    await auditService.logActivity({
        action: 'CREATE',
        entity: 'Area',
        entityId: newAreaId,
        newData: newArea,
        user: user,
        details: `Área creada: ${newArea?.nombre}`
    });
    return newArea;
};
exports.createArea = createArea;
const updateArea = async (id, data, user) => {
    const areaId = Number(id);
    const oldArea = await (0, exports.getAreaById)(areaId, user);
    if (!oldArea)
        throw new Error("Área no encontrada o sin permisos.");
    if (data.departamentoId) {
        const dept = await database_1.db.query.departments.findFirst({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(organization_model_1.departments.id, Number(data.departamentoId)), (0, drizzle_orm_1.eq)(organization_model_1.departments.siteId, oldArea.siteId))
        });
        if (!dept)
            throw new Error("El departamento destino no es válido.");
    }
    await database_1.db.update(organization_model_1.areas).set({
        nombre: data.nombre,
        departamentoId: data.departamentoId ? Number(data.departamentoId) : undefined,
        environmentType: data.environmentType
    }).where((0, drizzle_orm_1.eq)(organization_model_1.areas.id, areaId));
    const updatedArea = await database_1.db.query.areas.findFirst({ where: (0, drizzle_orm_1.eq)(organization_model_1.areas.id, areaId) });
    await auditService.logActivity({
        action: 'UPDATE',
        entity: 'Area',
        entityId: areaId,
        oldData: oldArea,
        newData: updatedArea,
        user: user,
        details: `Área actualizada: ${updatedArea?.nombre}`
    });
    return updatedArea;
};
exports.updateArea = updateArea;
const deleteArea = async (id, user) => {
    const areaId = Number(id);
    const oldArea = await (0, exports.getAreaById)(areaId, user);
    if (!oldArea)
        throw new Error("Área no encontrada o sin permisos.");
    await database_1.db.update(organization_model_1.areas).set({ deletedAt: new Date() }).where((0, drizzle_orm_1.eq)(organization_model_1.areas.id, areaId));
    await auditService.logActivity({
        action: 'DELETE',
        entity: 'Area',
        entityId: areaId,
        oldData: oldArea,
        user: user,
        details: `Área eliminada`
    });
    return { message: "Area deleted" };
};
exports.deleteArea = deleteArea;
