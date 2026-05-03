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
exports.deleteSite = exports.updateSite = exports.createSite = exports.getAllSites = void 0;
const database_1 = require("../../core/database");
const organization_model_1 = require("./organization.model");
const drizzle_orm_1 = require("drizzle-orm");
const auditService = __importStar(require("../audit/audit.service"));
const preloadData_1 = require("../../core/utils/preloadData");
const constants_js_1 = require("../../config/constants.js");
const getSiteFilter = (user) => {
    if (!user)
        return { id: -1 };
    if (user.rol === constants_js_1.ROLES.AURA_ROOT || user.rol === constants_js_1.ROLES.CORP_VIEWER || user.rol === constants_js_1.ROLES.CORP_ADMIN)
        return null;
    if (user.allowedSites && user.allowedSites.length > 0)
        return { in: user.allowedSites };
    return { id: -1 };
};
const getAllSites = async (user) => {
    const filter = getSiteFilter(user);
    const conditions = [(0, drizzle_orm_1.isNull)(organization_model_1.sites.deletedAt), (0, drizzle_orm_1.eq)(organization_model_1.sites.activo, true)];
    if (filter) {
        if (filter.id === -1)
            conditions.push((0, drizzle_orm_1.eq)(organization_model_1.sites.id, -1));
        else if (filter.in)
            conditions.push((0, drizzle_orm_1.inArray)(organization_model_1.sites.id, filter.in));
    }
    return await database_1.db.query.sites.findMany({
        where: conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined,
        orderBy: (sites, { asc }) => [asc(sites.nombre)]
    });
};
exports.getAllSites = getAllSites;
const createSite = async (data, user) => {
    const [result] = await database_1.db.insert(organization_model_1.sites).values({
        nombre: data.nombre,
        codigo: data.codigo,
        direccion: data.direccion,
        ciudad: data.ciudad,
        razonSocial: data.razonSocial,
        diminutivo: data.diminutivo,
        activo: data.activo !== undefined ? data.activo : true
    });
    const newSiteId = result.insertId;
    const newSite = await database_1.db.query.sites.findFirst({ where: (0, drizzle_orm_1.eq)(organization_model_1.sites.id, newSiteId) });
    if (data.autoStructure && newSite) {
        for (const group of preloadData_1.STANDARD_STRUCTURE_TEMPLATE) {
            await database_1.db.insert(organization_model_1.departments).values({
                nombre: group.depto,
                siteId: newSite.id
            }).onDuplicateKeyUpdate({ set: { nombre: group.depto } });
            const depto = await database_1.db.query.departments.findFirst({
                where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(organization_model_1.departments.nombre, group.depto), (0, drizzle_orm_1.eq)(organization_model_1.departments.siteId, newSite.id))
            });
            if (depto && group.areas && group.areas.length > 0) {
                const uniqueAreas = [...new Set(group.areas)];
                const areasData = uniqueAreas.map(areaName => ({
                    nombre: areaName,
                    departamentoId: depto.id,
                    siteId: newSite.id
                }));
                await database_1.db.insert(organization_model_1.areas).values(areasData).onDuplicateKeyUpdate({ set: { siteId: newSite.id } });
            }
        }
    }
    await auditService.logActivity({
        action: 'CREATE',
        entity: 'Site',
        entityId: newSiteId,
        newData: newSite,
        user: user,
        details: `Nuevo Site creado: ${newSite?.nombre}`
    });
    return newSite;
};
exports.createSite = createSite;
const updateSite = async (id, data, user) => {
    const siteId = Number(id);
    if (user.rol !== constants_js_1.ROLES.AURA_ROOT) {
        const hasAccess = user.sites?.some((h) => h.id === siteId);
        if (!hasAccess)
            throw new Error("No tienes permiso para editar este sitio.");
    }
    const oldSite = await database_1.db.query.sites.findFirst({ where: (0, drizzle_orm_1.eq)(organization_model_1.sites.id, siteId) });
    await database_1.db.update(organization_model_1.sites).set({
        nombre: data.nombre,
        codigo: data.codigo,
        direccion: data.direccion,
        ciudad: data.ciudad,
        razonSocial: data.razonSocial,
        diminutivo: data.diminutivo,
        activo: data.activo
    }).where((0, drizzle_orm_1.eq)(organization_model_1.sites.id, siteId));
    const updatedSite = await database_1.db.query.sites.findFirst({ where: (0, drizzle_orm_1.eq)(organization_model_1.sites.id, siteId) });
    await auditService.logActivity({
        action: 'UPDATE',
        entity: 'Site',
        entityId: siteId,
        oldData: oldSite,
        newData: updatedSite,
        user: user,
        details: `Site actualizado: ${updatedSite?.nombre}`
    });
    return updatedSite;
};
exports.updateSite = updateSite;
const deleteSite = async (id, user) => {
    if (user.rol !== constants_js_1.ROLES.AURA_ROOT) {
        throw new Error("Solo el Super Admin (Root) puede eliminar sitios.");
    }
    const siteId = Number(id);
    const oldSite = await database_1.db.query.sites.findFirst({ where: (0, drizzle_orm_1.eq)(organization_model_1.sites.id, siteId) });
    await database_1.db.update(organization_model_1.sites).set({
        deletedAt: new Date(),
        activo: false
    }).where((0, drizzle_orm_1.eq)(organization_model_1.sites.id, siteId));
    await auditService.logActivity({
        action: 'DELETE',
        entity: 'Site',
        entityId: siteId,
        oldData: oldSite,
        user: user,
        details: `Site dado de baja: ${oldSite?.nombre}`
    });
    return { message: "Site eliminado" };
};
exports.deleteSite = deleteSite;
