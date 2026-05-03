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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importStaffFromExcel = exports.deleteStaff = exports.updateStaff = exports.createStaff = exports.getStaffById = exports.getAllStaff = exports.getStaffMembers = void 0;
const database_1 = require("../../core/database");
const staff_model_1 = require("./staff.model");
const organization_model_1 = require("../organization/organization.model");
const drizzle_orm_1 = require("drizzle-orm");
const auditService = __importStar(require("../audit/audit.service"));
const constants_js_1 = require("../../config/constants.js");
const exceljs_1 = __importDefault(require("exceljs"));
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
const getStaffMembers = async ({ skip, take, search, sortBy, order }, user) => {
    const tenantFilter = getTenantFilter(user);
    const conditions = [(0, drizzle_orm_1.isNull)(staff_model_1.staff.deletedAt)];
    if (tenantFilter) {
        if (tenantFilter.siteId === -1)
            conditions.push((0, drizzle_orm_1.eq)(staff_model_1.staff.siteId, -1));
        else if (tenantFilter.in)
            conditions.push((0, drizzle_orm_1.inArray)(staff_model_1.staff.siteId, tenantFilter.in));
        else if (tenantFilter.siteId)
            conditions.push((0, drizzle_orm_1.eq)(staff_model_1.staff.siteId, tenantFilter.siteId));
    }
    if (search) {
        conditions.push((0, drizzle_orm_1.or)((0, drizzle_orm_1.ilike)(staff_model_1.staff.nombre, `%${search}%`), (0, drizzle_orm_1.ilike)(staff_model_1.staff.correo, `%${search}%`), (0, drizzle_orm_1.ilike)(staff_model_1.staff.usuario_login, `%${search}%`)));
    }
    const queryBuilder = database_1.db.query.staff.findMany({
        where: conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined,
        with: {
            area: { with: { departamento: true } },
            site: { columns: { nombre: true, codigo: true } }
        },
        ...(skip !== undefined && { offset: skip }),
        ...(take !== undefined && take > 0 && { limit: take }),
        orderBy: (staffTbl, { asc, desc }) => [order === 'desc' ? desc(staffTbl[sortBy || 'nombre']) : asc(staffTbl[sortBy || 'nombre'])]
    });
    const staffRows = await queryBuilder;
    const totalRaw = await database_1.db.query.staff.findMany({
        where: conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined,
        columns: { id: true }
    });
    return { users: staffRows, totalCount: totalRaw.length };
};
exports.getStaffMembers = getStaffMembers;
const getAllStaff = async (user) => {
    const tenantFilter = getTenantFilter(user);
    const conditions = [(0, drizzle_orm_1.isNull)(staff_model_1.staff.deletedAt)];
    if (tenantFilter) {
        if (tenantFilter.siteId === -1)
            conditions.push((0, drizzle_orm_1.eq)(staff_model_1.staff.siteId, -1));
        else if (tenantFilter.in)
            conditions.push((0, drizzle_orm_1.inArray)(staff_model_1.staff.siteId, tenantFilter.in));
        else if (tenantFilter.siteId)
            conditions.push((0, drizzle_orm_1.eq)(staff_model_1.staff.siteId, tenantFilter.siteId));
    }
    return await database_1.db.query.staff.findMany({
        where: conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined,
        columns: { id: true, nombre: true, areaId: true, siteId: true },
        orderBy: (staffTbl, { asc }) => [asc(staffTbl.nombre)]
    });
};
exports.getAllStaff = getAllStaff;
const getStaffById = async (id, user) => {
    const tenantFilter = getTenantFilter(user);
    const conditions = [(0, drizzle_orm_1.eq)(staff_model_1.staff.id, Number(id)), (0, drizzle_orm_1.isNull)(staff_model_1.staff.deletedAt)];
    if (tenantFilter) {
        if (tenantFilter.siteId === -1)
            conditions.push((0, drizzle_orm_1.eq)(staff_model_1.staff.siteId, -1));
        else if (tenantFilter.in)
            conditions.push((0, drizzle_orm_1.inArray)(staff_model_1.staff.siteId, tenantFilter.in));
        else if (tenantFilter.siteId)
            conditions.push((0, drizzle_orm_1.eq)(staff_model_1.staff.siteId, tenantFilter.siteId));
    }
    return await database_1.db.query.staff.findFirst({
        where: conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined,
        with: { area: { with: { departamento: true } } }
    });
};
exports.getStaffById = getStaffById;
const createStaff = async (data, user) => {
    let siteIdToAssign = user.siteId;
    if (!siteIdToAssign && data.siteId) {
        siteIdToAssign = Number(data.siteId);
    }
    if (!siteIdToAssign) {
        throw new Error("Se requiere un sitio paramétrico para asimilar al Staff en Aura.");
    }
    if (data.areaId) {
        const areaExists = await database_1.db.query.areas.findFirst({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(organization_model_1.areas.id, Number(data.areaId)), (0, drizzle_orm_1.eq)(organization_model_1.areas.siteId, siteIdToAssign))
        });
        if (!areaExists)
            throw new Error("El Área destino no califica para este Hub/Site.");
    }
    const [result] = await database_1.db.insert(staff_model_1.staff).values({
        nombre: data.nombre,
        correo: data.correo,
        usuario_login: data.usuario_login,
        es_jefe_de_area: data.es_jefe_de_area || false,
        areaId: data.areaId ? Number(data.areaId) : null,
        siteId: siteIdToAssign
    });
    const newStaffId = result.insertId;
    const newStaff = await database_1.db.query.staff.findFirst({ where: (0, drizzle_orm_1.eq)(staff_model_1.staff.id, newStaffId) });
    await auditService.logActivity({
        action: 'CREATE',
        entity: 'Staff',
        entityId: newStaffId,
        newData: newStaff,
        user: user,
        details: `Staff Integrado: ${data.nombre}`
    });
    return newStaff;
};
exports.createStaff = createStaff;
const updateStaff = async (id, data, user) => {
    const staffId = Number(id);
    const oldStaff = await (0, exports.getStaffById)(staffId, user);
    if (!oldStaff)
        throw new Error("Staff no localizado o Acceso Denegado por Seguridad Multi-tenant.");
    if (data.areaId) {
        const areaExists = await database_1.db.query.areas.findFirst({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(organization_model_1.areas.id, Number(data.areaId)), (0, drizzle_orm_1.eq)(organization_model_1.areas.siteId, oldStaff.siteId))
        });
        if (!areaExists)
            throw new Error("El Área destino no califica para este Hub/Site.");
    }
    await database_1.db.update(staff_model_1.staff).set({
        nombre: data.nombre !== undefined ? data.nombre : oldStaff.nombre,
        correo: data.correo !== undefined ? data.correo : oldStaff.correo,
        usuario_login: data.usuario_login !== undefined ? data.usuario_login : oldStaff.usuario_login,
        es_jefe_de_area: data.es_jefe_de_area !== undefined ? data.es_jefe_de_area : oldStaff.es_jefe_de_area,
        areaId: data.areaId ? Number(data.areaId) : oldStaff.areaId,
    }).where((0, drizzle_orm_1.eq)(staff_model_1.staff.id, staffId));
    const updatedStaff = await database_1.db.query.staff.findFirst({ where: (0, drizzle_orm_1.eq)(staff_model_1.staff.id, staffId) });
    await auditService.logActivity({
        action: 'UPDATE',
        entity: 'Staff',
        entityId: staffId,
        oldData: oldStaff,
        newData: updatedStaff,
        user: user,
        details: `Log de Staff - Integrante Modificado: ${updatedStaff?.nombre}`
    });
    return updatedStaff;
};
exports.updateStaff = updateStaff;
const deleteStaff = async (id, user) => {
    const staffId = Number(id);
    const oldStaff = await (0, exports.getStaffById)(staffId, user);
    if (!oldStaff)
        throw new Error("Staff no localizado o Acceso Denegado por Seguridad Multi-tenant.");
    await database_1.db.update(staff_model_1.staff).set({ deletedAt: new Date() }).where((0, drizzle_orm_1.eq)(staff_model_1.staff.id, staffId));
    await auditService.logActivity({
        action: 'DELETE',
        entity: 'Staff',
        entityId: staffId,
        oldData: oldStaff,
        user: user,
        details: `Staff dado de baja operativa (Soft Delete)`
    });
    return { message: "Staff eliminado" };
};
exports.deleteStaff = deleteStaff;
/* --- LOGICA DE IMPORTACIÓN DE EXCEL (Refactored a Drizzle) --- */
const cleanLower = (txt) => {
    if (!txt)
        return "";
    return txt.toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};
const extractRowData = (row, headerMap) => {
    const getVal = (possibleKeys) => {
        for (const key of possibleKeys) {
            const idx = headerMap[cleanLower(key)];
            if (idx)
                return row.getCell(idx).text?.trim();
        }
        return null;
    };
    const nombreRaw = getVal(['nombre', 'nombre completo', 'empleado']);
    const es_jefe_de_area = ["si", "yes", "verdadero", "true"].includes(cleanLower(getVal(['es jefe', 'jefe', 'es jefe de area', 'jefe area'])));
    return {
        nombre: nombreRaw,
        correo: getVal(['correo', 'email', 'e-mail']) || null,
        areaNombre: getVal(['área', 'area', 'nombre area']),
        deptoNombre: getVal(['departamento', 'depto', 'dept']),
        usuario_login: getVal(['usuario de login', 'usuario', 'login', 'user', 'usuario login']) || null,
        es_jefe_de_area
    };
};
const importStaffFromExcel = async (buffer, user, targetSiteId = null) => {
    // Lógica de acceso
    let siteIdToImport = null;
    if (targetSiteId) {
        if (user.rol === constants_js_1.ROLES.AURA_ROOT)
            siteIdToImport = targetSiteId;
        else {
            const hasAccess = user.sites && user.sites.some(h => h.id === targetSiteId);
            if (hasAccess)
                siteIdToImport = targetSiteId;
            else
                throw new Error("Acceso denegado en Aura: Proxy rechaza acceso a este Entorno.");
        }
    }
    else {
        if (user.sites && user.sites.length === 1)
            siteIdToImport = user.sites[0].id;
        else
            throw new Error("Falla de Asignación. Aura requiere que especifiques a qué Hub/Site pertenece este batallón de Staff.");
    }
    const workbook = new exceljs_1.default.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet)
        throw new Error("Libro de cálculo inválido");
    const validNameHeaders = ['nombre', 'nombre completo', 'empleado'];
    let headerRowNumber = 0;
    const headerMap = {};
    for (let i = 1; i <= 10; i++) {
        const row = worksheet.getRow(i);
        let found = false;
        row.eachCell((cell) => {
            if (validNameHeaders.includes(cleanLower(cell.value)))
                found = true;
        });
        if (found) {
            headerRowNumber = i;
            row.eachCell((cell, colNumber) => {
                headerMap[cleanLower(cell.value)] = colNumber;
            });
            break;
        }
    }
    if (headerRowNumber === 0)
        throw new Error("Aura Core Rejected: No se encontró la columna Raíz ('Nombre').");
    const activeAreas = await database_1.db.query.areas.findMany({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.isNull)(organization_model_1.areas.deletedAt), (0, drizzle_orm_1.eq)(organization_model_1.areas.siteId, siteIdToImport)),
        with: { departamento: true }
    });
    const areaMap = new Map(activeAreas.map(a => [`${cleanLower(a.nombre)}|${cleanLower(a.departamento?.nombre)}`, a.id]));
    const usersToCreate = [];
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber <= headerRowNumber)
            return;
        const rowData = extractRowData(row, headerMap);
        if (!rowData.nombre)
            return;
        let areaId = null;
        if (rowData.areaNombre && rowData.deptoNombre) {
            areaId = areaMap.get(`${cleanLower(rowData.areaNombre)}|${cleanLower(rowData.deptoNombre)}`);
            if (!areaId) {
                const foundA = activeAreas.filter(a => cleanLower(a.nombre) === cleanLower(rowData.areaNombre));
                if (foundA.length === 1)
                    areaId = foundA[0].id;
            }
        }
        usersToCreate.push({
            nombre: rowData.nombre,
            correo: rowData.correo,
            areaId,
            usuario_login: rowData.usuario_login,
            es_jefe_de_area: rowData.es_jefe_de_area,
            siteId: siteIdToImport
        });
    });
    if (usersToCreate.length === 0)
        throw new Error("Sábana sin registros activos.");
    let successCount = 0;
    const errors = [];
    for (const u of usersToCreate) {
        try {
            const existing = await database_1.db.query.staff.findFirst({
                where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(staff_model_1.staff.nombre, u.nombre), (0, drizzle_orm_1.eq)(staff_model_1.staff.siteId, siteIdToImport))
            });
            if (!existing) {
                await database_1.db.insert(staff_model_1.staff).values(u);
            }
            else {
                await database_1.db.update(staff_model_1.staff).set({ ...u, deletedAt: null }).where((0, drizzle_orm_1.eq)(staff_model_1.staff.id, existing.id));
            }
            successCount++;
        }
        catch (err) {
            errors.push(`Interrupción en '${u.nombre}': ${err.message}`);
        }
    }
    if (successCount > 0) {
        await auditService.logActivity({
            action: 'IMPORT',
            entity: 'Staff',
            entityId: 0,
            details: `Importación Masiva de Staff: ${successCount} Activos asignados al Hub/Site ${siteIdToImport}.`,
            user: user
        });
    }
    return { successCount, errors };
};
exports.importStaffFromExcel = importStaffFromExcel;
