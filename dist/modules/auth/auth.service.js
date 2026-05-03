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
exports.updateUser = exports.deleteUser = exports.getUserById = exports.getUsers = exports.loginUser = exports.registerUser = void 0;
const database_1 = require("../../core/database");
const auth_model_1 = require("./auth.model");
const drizzle_orm_1 = require("drizzle-orm");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const constants_js_1 = require("../../config/constants.js");
const auditService = __importStar(require("../audit/audit.service"));
const JWT_SECRET = process.env.JWT_SECRET;
const validateRoleAndSites = (rolToAssign, siteIds, adminRole) => {
    let allowed = false;
    if (adminRole === constants_js_1.ROLES.AURA_ROOT || adminRole === constants_js_1.ROLES.AURA_SUPPORT)
        allowed = true;
    else if (adminRole === constants_js_1.ROLES.CORP_ADMIN)
        allowed = [constants_js_1.ROLES.CORP_VIEWER, constants_js_1.ROLES.SITE_ADMIN, constants_js_1.ROLES.SITE_STAFF, constants_js_1.ROLES.SITE_GUEST].includes(rolToAssign);
    else if (adminRole === constants_js_1.ROLES.SITE_ADMIN)
        allowed = [constants_js_1.ROLES.SITE_STAFF, constants_js_1.ROLES.SITE_GUEST].includes(rolToAssign);
    if (!allowed) {
        throw new Error(`403 Forbidden: Nivel de privilegio insuficiente para asignar este rol (${rolToAssign}).`);
    }
    const isGlobalRole = [constants_js_1.ROLES.AURA_ROOT, constants_js_1.ROLES.AURA_SUPPORT, constants_js_1.ROLES.CORP_ADMIN, constants_js_1.ROLES.CORP_VIEWER].includes(rolToAssign);
    const hasSites = siteIds && Array.isArray(siteIds) && siteIds.length > 0;
    if (isGlobalRole && hasSites) {
        throw new Error("Los usuarios Globales (Root/Corp) NO deben tener sitios asignados en Aura. Su acceso es global por defecto.");
    }
    if (!isGlobalRole && !hasSites) {
        throw new Error("Los usuarios Locales (Admin/Aux/Invitado) deben tener al menos un sitio asignado en Aura.");
    }
};
const registerUser = async (data, adminUser) => {
    const assignedRol = data.rol || constants_js_1.ROLES.SITE_STAFF;
    const isTargetGlobal = [constants_js_1.ROLES.AURA_ROOT, constants_js_1.ROLES.AURA_SUPPORT, constants_js_1.ROLES.CORP_ADMIN, constants_js_1.ROLES.CORP_VIEWER].includes(assignedRol);
    const isCreatorGlobal = [constants_js_1.ROLES.AURA_ROOT, constants_js_1.ROLES.AURA_SUPPORT, constants_js_1.ROLES.CORP_ADMIN, constants_js_1.ROLES.CORP_VIEWER].includes(adminUser.rol);
    let targetSiteIds = [];
    // REGLA A (Destino Global)
    if (isTargetGlobal) {
        targetSiteIds = [];
    }
    else {
        targetSiteIds = data.siteIds || [];
        // REGLA B (Destino Local - Creador Global)
        if (isCreatorGlobal) {
            if (!targetSiteIds || targetSiteIds.length === 0)
                throw new Error("403 Forbidden: Para crear roles Locales (Staff/Admin) debes asignar al menos un sitio.");
        }
        // REGLA C (Destino Local - Creador Local)
        else {
            if (adminUser.sites && adminUser.sites.length === 1) {
                targetSiteIds = [adminUser.sites[0].id]; // Herencia automática monositio
            }
            else if (adminUser.sites && adminUser.sites.length > 1) {
                const allowedIds = adminUser.sites.map(h => h.id);
                const isSubset = targetSiteIds.length > 0 && targetSiteIds.every((id) => allowedIds.includes(Number(id)));
                if (!isSubset)
                    throw new Error("403 Forbidden: Intento de asignar sitios fuera de jurisdicción permitida.");
            }
            else {
                throw new Error("403 Forbidden: Cuenta creadora huérfana de propiedades.");
            }
        }
    }
    validateRoleAndSites(assignedRol, targetSiteIds, adminUser.rol);
    const hashedPassword = await bcryptjs_1.default.hash(data.password, 10);
    const [result] = await database_1.db.insert(auth_model_1.usersSistema).values({
        username: data.username,
        password: hashedPassword,
        nombre: data.nombre,
        rol: assignedRol,
        email: data.email,
    });
    const newUserId = result.insertId;
    if (targetSiteIds && Array.isArray(targetSiteIds) && targetSiteIds.length > 0) {
        const connections = targetSiteIds.map((hid) => ({
            A: Number(hid),
            B: newUserId
        }));
        await database_1.db.insert(auth_model_1.siteToUserSistema).values(connections);
    }
    const newUser = await database_1.db.query.usersSistema.findFirst({
        where: (0, drizzle_orm_1.eq)(auth_model_1.usersSistema.id, newUserId),
        with: { sitesConnection: { with: { site: true } } }
    });
    const parsedUser = {
        ...newUser,
        sites: newUser?.sitesConnection.map(c => c.site) || []
    };
    await auditService.logActivity({
        action: 'CREATE',
        entity: 'UserSistema',
        entityId: newUserId,
        newData: { ...parsedUser, password: '[HIDDEN]' },
        user: adminUser,
        details: `Usuario creado en Aura con acceso a ${parsedUser.sites.length} sitios.`
    });
    return parsedUser;
};
exports.registerUser = registerUser;
const loginUser = async ({ identifier, password }) => {
    const userRow = await database_1.db.query.usersSistema.findFirst({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(auth_model_1.usersSistema.username, identifier), (0, drizzle_orm_1.eq)(auth_model_1.usersSistema.email, identifier)), (0, drizzle_orm_1.isNull)(auth_model_1.usersSistema.deletedAt)),
        with: { sitesConnection: { with: { site: true } } }
    });
    if (!userRow)
        throw new Error("Identidad en Aura no encontrada");
    const validPassword = await bcryptjs_1.default.compare(password, userRow.password);
    if (!validPassword)
        throw new Error("Credenciales incorrectas");
    const mappedSites = userRow.sitesConnection.map(c => c.site);
    const allowedSiteIds = mappedSites.map(h => h.id);
    const parsedUser = { ...userRow, sites: mappedSites };
    await auditService.logActivity({
        action: 'LOGIN',
        entity: 'Auth',
        entityId: userRow.id,
        user: parsedUser,
        details: `Inicio de sesión exitoso en Aura. Rol: ${userRow.rol}`
    });
    const token = jsonwebtoken_1.default.sign({
        id: userRow.id,
        username: userRow.username,
        rol: userRow.rol,
        sites: mappedSites,
        allowedSites: allowedSiteIds
    }, JWT_SECRET, { expiresIn: "60d" });
    return {
        token,
        user: {
            id: userRow.id,
            username: userRow.username,
            rol: userRow.rol,
            nombre: userRow.nombre,
            email: userRow.email,
            sites: mappedSites
        }
    };
};
exports.loginUser = loginUser;
const getUsers = async ({ skip, take, search, sortBy, order }, adminUser) => {
    const conditions = [(0, drizzle_orm_1.isNull)(auth_model_1.usersSistema.deletedAt)];
    if (search) {
        conditions.push((0, drizzle_orm_1.or)((0, drizzle_orm_1.ilike)(auth_model_1.usersSistema.nombre, `%${search}%`), (0, drizzle_orm_1.ilike)(auth_model_1.usersSistema.username, `%${search}%`), (0, drizzle_orm_1.ilike)(auth_model_1.usersSistema.email, `%${search}%`)));
    }
    // Permisos: Obtenemos ID si aplica filtro de Tenant
    let tenantSiteIds = null;
    if (adminUser.siteId) {
        tenantSiteIds = [adminUser.siteId];
    }
    else if (adminUser.rol !== constants_js_1.ROLES.AURA_ROOT && adminUser.rol !== constants_js_1.ROLES.AURA_SUPPORT && adminUser.sites && adminUser.sites.length > 0) {
        tenantSiteIds = adminUser.sites.map(h => h.id);
    }
    // Filtrado final cruzado con `siteToUserSistema`
    // En Drizzle para un "where has site", hacemos un subquery o inArray
    let filteredUserIds = null;
    if (tenantSiteIds) {
        const userConns = await database_1.db.query.siteToUserSistema.findMany({
            where: (h2u, { inArray }) => inArray(h2u.A, tenantSiteIds),
            columns: { B: true }
        });
        filteredUserIds = userConns.map(c => c.B);
        if (filteredUserIds.length === 0)
            filteredUserIds = [-1]; // Ninguno
        conditions.push(auth_model_1.usersSistema.id.in(filteredUserIds)); // Type casting for simplicity in raw SQL equivalence
    }
    // Actually, Drizzle allows `inArray(usersSistema.id, filteredUserIds)`
    if (tenantSiteIds && filteredUserIds) {
        conditions.pop(); // quitar la linea manual que acabo de meter
        const inArray = require('drizzle-orm').inArray;
        conditions.push(inArray(auth_model_1.usersSistema.id, filteredUserIds));
    }
    const rawUsers = await database_1.db.query.usersSistema.findMany({
        where: conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined,
        offset: skip,
        limit: take,
        with: { sitesConnection: { with: { site: true } } },
        orderBy: (users, { asc, desc }) => [order === 'desc' ? desc(users[sortBy || 'nombre']) : asc(users[sortBy || 'nombre'])]
    });
    const parsedUsers = rawUsers.map(u => ({ ...u, sites: u.sitesConnection.map(hc => hc.site) }));
    const totalRaw = await database_1.db.query.usersSistema.findMany({
        where: conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined,
        columns: { id: true }
    });
    return { users: parsedUsers, totalCount: totalRaw.length };
};
exports.getUsers = getUsers;
const getUserById = async (id, adminUser) => {
    const user = await database_1.db.query.usersSistema.findFirst({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(auth_model_1.usersSistema.id, Number(id)), (0, drizzle_orm_1.isNull)(auth_model_1.usersSistema.deletedAt)),
        with: { sitesConnection: { with: { site: true } } }
    });
    if (!user)
        return null;
    return { ...user, sites: user.sitesConnection.map(hc => hc.site) };
};
exports.getUserById = getUserById;
const deleteUser = async (id, adminUser) => {
    const userId = Number(id);
    const oldUser = await (0, exports.getUserById)(userId, adminUser);
    if (!oldUser)
        throw new Error("Usuario no encontrado en Aura.");
    await database_1.db.update(auth_model_1.usersSistema).set({ deletedAt: new Date() }).where((0, drizzle_orm_1.eq)(auth_model_1.usersSistema.id, userId));
    await auditService.logActivity({
        action: 'DELETE',
        entity: 'UserSistema',
        entityId: userId,
        oldData: { ...oldUser, password: '[HIDDEN]' },
        user: adminUser,
        details: `Usuario de Aura eliminado`
    });
    return { message: "Usuario eliminado" };
};
exports.deleteUser = deleteUser;
const updateUser = async (id, data, adminUser) => {
    const userId = Number(id);
    const { nombre, email, rol, password, siteIds } = data;
    const oldUser = await (0, exports.getUserById)(userId, adminUser);
    if (!oldUser)
        throw new Error("Usuario no encontrado en Aura.");
    const targetRole = rol || oldUser.rol;
    const isTargetGlobal = [constants_js_1.ROLES.AURA_ROOT, constants_js_1.ROLES.AURA_SUPPORT, constants_js_1.ROLES.CORP_ADMIN, constants_js_1.ROLES.CORP_VIEWER].includes(targetRole);
    const isCreatorGlobal = [constants_js_1.ROLES.AURA_ROOT, constants_js_1.ROLES.AURA_SUPPORT, constants_js_1.ROLES.CORP_ADMIN, constants_js_1.ROLES.CORP_VIEWER].includes(adminUser.rol);
    let targetSiteIds = oldUser.sites.map(h => h.id);
    if (isTargetGlobal) {
        targetSiteIds = [];
    }
    else if (siteIds !== undefined) {
        targetSiteIds = siteIds;
        if (isCreatorGlobal) {
            if (!targetSiteIds || targetSiteIds.length === 0)
                throw new Error("403 Forbidden: Para guardar roles Locales debes asignar al menos un sitio.");
        }
        else {
            if (adminUser.sites && adminUser.sites.length === 1) {
                targetSiteIds = [adminUser.sites[0].id];
            }
            else if (adminUser.sites && adminUser.sites.length > 1) {
                const allowedIds = adminUser.sites.map(h => h.id);
                const isSubset = targetSiteIds.length > 0 && targetSiteIds.every((id) => allowedIds.includes(Number(id)));
                if (!isSubset)
                    throw new Error("403 Forbidden: Intento de actualizar sitios fuera de jurisdicción permitida.");
            }
        }
    }
    validateRoleAndSites(targetRole, targetSiteIds, adminUser.rol);
    const updateData = {};
    if (nombre)
        updateData.nombre = nombre;
    if (email)
        updateData.email = email;
    if (rol)
        updateData.rol = rol;
    if (password)
        updateData.password = await bcryptjs_1.default.hash(password, 10);
    if (oldUser.username === "superuser" && rol && rol !== oldUser.rol) {
        throw new Error("No se puede interactuar con el rol del superadministrador en Aura");
    }
    await database_1.db.update(auth_model_1.usersSistema).set(updateData).where((0, drizzle_orm_1.eq)(auth_model_1.usersSistema.id, userId));
    if (targetSiteIds && Array.isArray(targetSiteIds)) {
        // Borrar anteriores
        await database_1.db.delete(auth_model_1.siteToUserSistema).where((0, drizzle_orm_1.eq)(auth_model_1.siteToUserSistema.B, userId));
        // Insertar nuevos
        if (targetSiteIds.length > 0) {
            const connections = targetSiteIds.map(hid => ({ A: Number(hid), B: userId }));
            await database_1.db.insert(auth_model_1.siteToUserSistema).values(connections);
        }
    }
    const updatedUser = await (0, exports.getUserById)(userId, adminUser);
    await auditService.logActivity({
        action: 'UPDATE',
        entity: 'UserSistema',
        entityId: userId,
        oldData: { ...oldUser, password: '[HIDDEN]' },
        newData: { ...updatedUser, password: '[HIDDEN]' },
        user: adminUser,
        details: `Actualización de identidad Aura: ${updatedUser?.username}`
    });
    return updatedUser;
};
exports.updateUser = updateUser;
