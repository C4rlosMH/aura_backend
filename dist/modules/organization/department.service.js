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
exports.deleteDepartment = exports.updateDepartment = exports.createDepartment = exports.getDepartmentById = exports.getAllDepartments = exports.getDepartments = void 0;
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
const getDepartments = async ({ skip, take, sortBy, order }, user) => {
    const tenantFilter = getTenantFilter(user);
    const conditions = [(0, drizzle_orm_1.isNull)(organization_model_1.departments.deletedAt)];
    if (tenantFilter) {
        if (tenantFilter.siteId === -1)
            conditions.push((0, drizzle_orm_1.eq)(organization_model_1.departments.siteId, -1));
        else if (tenantFilter.in)
            conditions.push((0, drizzle_orm_1.inArray)(organization_model_1.departments.siteId, tenantFilter.in));
        else if (tenantFilter.siteId)
            conditions.push((0, drizzle_orm_1.eq)(organization_model_1.departments.siteId, tenantFilter.siteId));
    }
    const result = await database_1.db.query.departments.findMany({
        where: conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined,
        with: { site: { columns: { nombre: true, codigo: true } } },
        offset: skip,
        limit: take,
        orderBy: (departments, { asc, desc }) => [order === 'desc' ? desc(departments.nombre) : asc(departments.nombre)]
    });
    // Calculate total via a separate query
    const allDepts = await database_1.db.query.departments.findMany({
        where: conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined,
        columns: { id: true }
    });
    const totalCount = allDepts.length;
    return { departments: result, totalCount };
};
exports.getDepartments = getDepartments;
const getAllDepartments = async (user) => {
    const tenantFilter = getTenantFilter(user);
    const conditions = [(0, drizzle_orm_1.isNull)(organization_model_1.departments.deletedAt)];
    if (tenantFilter) {
        if (tenantFilter.siteId === -1)
            conditions.push((0, drizzle_orm_1.eq)(organization_model_1.departments.siteId, -1));
        else if (tenantFilter.in)
            conditions.push((0, drizzle_orm_1.inArray)(organization_model_1.departments.siteId, tenantFilter.in));
        else if (tenantFilter.siteId)
            conditions.push((0, drizzle_orm_1.eq)(organization_model_1.departments.siteId, tenantFilter.siteId));
    }
    return await database_1.db.query.departments.findMany({
        where: conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined,
        orderBy: (departments, { asc }) => [asc(departments.nombre)]
    });
};
exports.getAllDepartments = getAllDepartments;
const getDepartmentById = async (id, user) => {
    const tenantFilter = getTenantFilter(user);
    const conditions = [(0, drizzle_orm_1.eq)(organization_model_1.departments.id, Number(id)), (0, drizzle_orm_1.isNull)(organization_model_1.departments.deletedAt)];
    if (tenantFilter) {
        if (tenantFilter.siteId === -1)
            conditions.push((0, drizzle_orm_1.eq)(organization_model_1.departments.siteId, -1));
        else if (tenantFilter.in)
            conditions.push((0, drizzle_orm_1.inArray)(organization_model_1.departments.siteId, tenantFilter.in));
        else if (tenantFilter.siteId)
            conditions.push((0, drizzle_orm_1.eq)(organization_model_1.departments.siteId, tenantFilter.siteId));
    }
    return await database_1.db.query.departments.findFirst({
        where: conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined
    });
};
exports.getDepartmentById = getDepartmentById;
const createDepartment = async (data, user) => {
    let siteIdToAssign = user.siteId;
    if (!siteIdToAssign && data.siteId)
        siteIdToAssign = Number(data.siteId);
    if (user.rol !== constants_js_1.ROLES.AURA_ROOT && user.sites) {
        const canCreate = user.sites.some((h) => h.id === siteIdToAssign);
        if (!canCreate)
            throw new Error("No tienes permiso para crear departamentos en este sitio.");
    }
    if (!siteIdToAssign)
        throw new Error("No se puede crear un departamento sin asignar un sitio.");
    const [result] = await database_1.db.insert(organization_model_1.departments).values({
        nombre: data.nombre,
        siteId: siteIdToAssign
    });
    const newDeptId = result.insertId;
    const newDept = await database_1.db.query.departments.findFirst({ where: (0, drizzle_orm_1.eq)(organization_model_1.departments.id, newDeptId) });
    await auditService.logActivity({
        action: 'CREATE',
        entity: 'Department',
        entityId: newDeptId,
        newData: newDept,
        user: user,
        details: `Departamento creado: ${newDept?.nombre}`
    });
    return newDept;
};
exports.createDepartment = createDepartment;
const updateDepartment = async (id, data, user) => {
    const deptId = Number(id);
    const oldDept = await (0, exports.getDepartmentById)(deptId, user);
    if (!oldDept)
        throw new Error("Departamento no encontrado o sin permisos.");
    await database_1.db.update(organization_model_1.departments).set({ nombre: data.nombre }).where((0, drizzle_orm_1.eq)(organization_model_1.departments.id, deptId));
    const updatedDept = await database_1.db.query.departments.findFirst({ where: (0, drizzle_orm_1.eq)(organization_model_1.departments.id, deptId) });
    await auditService.logActivity({
        action: 'UPDATE',
        entity: 'Department',
        entityId: deptId,
        oldData: oldDept,
        newData: updatedDept,
        user: user,
        details: `Departamento actualizado`
    });
    return updatedDept;
};
exports.updateDepartment = updateDepartment;
const deleteDepartment = async (id, user) => {
    const deptId = Number(id);
    const oldDept = await (0, exports.getDepartmentById)(deptId, user);
    if (!oldDept)
        throw new Error("Departamento no encontrado o sin permisos.");
    await database_1.db.update(organization_model_1.departments).set({ deletedAt: new Date() }).where((0, drizzle_orm_1.eq)(organization_model_1.departments.id, deptId));
    await auditService.logActivity({
        action: 'DELETE',
        entity: 'Department',
        entityId: deptId,
        oldData: oldDept,
        user: user,
        details: `Departamento eliminado`
    });
    return { message: "Department deleted" };
};
exports.deleteDepartment = deleteDepartment;
