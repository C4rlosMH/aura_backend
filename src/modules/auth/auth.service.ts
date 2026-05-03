import { db } from "../../core/database";
import { usersSistema, siteToUserSistema } from "./auth.model";
import { eq, or, and, isNull, ilike } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ROLES } from "../../config/constants.js";
import * as auditService from "../audit/audit.service"; 
import { AuthUser } from "./auth.types";

const JWT_SECRET = process.env.JWT_SECRET!;

const validateRoleAndSites = (rolToAssign: string, siteIds: number[], adminRole: string) => {
  let allowed = false;
  if (adminRole === ROLES.AURA_ROOT || adminRole === ROLES.AURA_SUPPORT) allowed = true;
  else if (adminRole === ROLES.CORP_ADMIN) allowed = [ROLES.CORP_VIEWER, ROLES.SITE_ADMIN, ROLES.SITE_STAFF, ROLES.SITE_GUEST].includes(rolToAssign);
  else if (adminRole === ROLES.SITE_ADMIN) allowed = [ROLES.SITE_STAFF, ROLES.SITE_GUEST].includes(rolToAssign);

  if (!allowed) {
      throw new Error(`403 Forbidden: Nivel de privilegio insuficiente para asignar este rol (${rolToAssign}).`);
  }

  const isGlobalRole = [ROLES.AURA_ROOT, ROLES.AURA_SUPPORT, ROLES.CORP_ADMIN, ROLES.CORP_VIEWER].includes(rolToAssign);
  const hasSites = siteIds && Array.isArray(siteIds) && siteIds.length > 0;

  if (isGlobalRole && hasSites) {
      throw new Error("Los usuarios Globales (Root/Corp) NO deben tener sitios asignados en Aura. Su acceso es global por defecto.");
  }
  if (!isGlobalRole && !hasSites) {
      throw new Error("Los usuarios Locales (Admin/Aux/Invitado) deben tener al menos un sitio asignado en Aura.");
  }
};

export const registerUser = async (data: any, adminUser: AuthUser) => {
  const assignedRol = data.rol || ROLES.SITE_STAFF;
  
  const isTargetGlobal = [ROLES.AURA_ROOT, ROLES.AURA_SUPPORT, ROLES.CORP_ADMIN, ROLES.CORP_VIEWER].includes(assignedRol);
  const isCreatorGlobal = [ROLES.AURA_ROOT, ROLES.AURA_SUPPORT, ROLES.CORP_ADMIN, ROLES.CORP_VIEWER].includes(adminUser.rol);
  
  let targetSiteIds: any[] = [];

  // REGLA A (Destino Global)
  if (isTargetGlobal) {
      targetSiteIds = [];
  } else {
      targetSiteIds = data.siteIds || [];
      
      // REGLA B (Destino Local - Creador Global)
      if (isCreatorGlobal) {
          if (!targetSiteIds || targetSiteIds.length === 0) throw new Error("403 Forbidden: Para crear roles Locales (Staff/Admin) debes asignar al menos un sitio.");
      } 
      // REGLA C (Destino Local - Creador Local)
      else {
          if (adminUser.sites && adminUser.sites.length === 1) {
             targetSiteIds = [adminUser.sites[0].id]; // Herencia automática monositio
          } else if (adminUser.sites && adminUser.sites.length > 1) {
             const allowedIds = adminUser.sites.map(h => h.id);
             const isSubset = targetSiteIds.length > 0 && targetSiteIds.every((id: any) => allowedIds.includes(Number(id)));
             if (!isSubset) throw new Error("403 Forbidden: Intento de asignar sitios fuera de jurisdicción permitida.");
          } else {
             throw new Error("403 Forbidden: Cuenta creadora huérfana de propiedades.");
          }
      }
  }

  validateRoleAndSites(assignedRol, targetSiteIds, adminUser.rol);

  const hashedPassword = await bcrypt.hash(data.password, 10);
  
  const [result] = await db.insert(usersSistema).values({
      username: data.username,
      password: hashedPassword,
      nombre: data.nombre,
      rol: assignedRol,
      email: data.email,
  });
  
  const newUserId = (result as any).insertId;

  if (targetSiteIds && Array.isArray(targetSiteIds) && targetSiteIds.length > 0) {
      const connections = targetSiteIds.map((hid: string | number) => ({
          A: Number(hid),
          B: newUserId
      }));
      await db.insert(siteToUserSistema).values(connections);
  }

  const newUser = await db.query.usersSistema.findFirst({
      where: eq(usersSistema.id, newUserId),
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

export const loginUser = async ({ identifier, password }: any) => {
  const userRow = await db.query.usersSistema.findFirst({
    where: and(
        or(eq(usersSistema.username, identifier), eq(usersSistema.email, identifier)),
        isNull(usersSistema.deletedAt)
    ),
    with: { sitesConnection: { with: { site: true } } }
  });
  
  if (!userRow) throw new Error("Identidad en Aura no encontrada");
  const validPassword = await bcrypt.compare(password, userRow.password);
  if (!validPassword) throw new Error("Credenciales incorrectas");

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

  const token = jwt.sign(
    { 
      id: userRow.id, 
      username: userRow.username, 
      rol: userRow.rol, 
      sites: mappedSites,
      allowedSites: allowedSiteIds
    },
    JWT_SECRET,
    { expiresIn: "60d" }
  );

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

export const getUsers = async ({ skip, take, search, sortBy, order }: any, adminUser: AuthUser) => {
  const conditions: any[] = [isNull(usersSistema.deletedAt)];
  
  if (search) {
      conditions.push(or(
          ilike(usersSistema.nombre, `%${search}%`),
          ilike(usersSistema.username, `%${search}%`),
          ilike(usersSistema.email, `%${search}%`)
      ));
  }

  // Permisos: Obtenemos ID si aplica filtro de Tenant
  let tenantSiteIds: number[] | null = null;
  if (adminUser.siteId) {
      tenantSiteIds = [adminUser.siteId];
  } else if (adminUser.rol !== ROLES.AURA_ROOT && adminUser.rol !== ROLES.AURA_SUPPORT && adminUser.sites && adminUser.sites.length > 0) {
      tenantSiteIds = adminUser.sites.map(h => h.id);
  }

  // Filtrado final cruzado con `siteToUserSistema`
  // En Drizzle para un "where has site", hacemos un subquery o inArray
  let filteredUserIds: number[] | null = null;
  if (tenantSiteIds) {
       const userConns = await db.query.siteToUserSistema.findMany({
           where: (h2u, { inArray }) => inArray(h2u.A, tenantSiteIds as number[]),
           columns: { B: true }
       });
       filteredUserIds = userConns.map(c => c.B);
       if (filteredUserIds.length === 0) filteredUserIds = [-1]; // Ninguno
       conditions.push((usersSistema as any).id.in(filteredUserIds)); // Type casting for simplicity in raw SQL equivalence
  }
  
  // Actually, Drizzle allows `inArray(usersSistema.id, filteredUserIds)`
  if (tenantSiteIds && filteredUserIds) {
     conditions.pop(); // quitar la linea manual que acabo de meter
     const inArray = require('drizzle-orm').inArray;
     conditions.push(inArray(usersSistema.id, filteredUserIds));
  }

  const rawUsers = await db.query.usersSistema.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      offset: skip,
      limit: take,
      with: { sitesConnection: { with: { site: true } } },
      orderBy: (users, { asc, desc }) => [order === 'desc' ? desc((users as any)[sortBy || 'nombre']) : asc((users as any)[sortBy || 'nombre'])]
  });

  const parsedUsers = rawUsers.map(u => ({ ...u, sites: u.sitesConnection.map(hc => hc.site) }));

  const totalRaw = await db.query.usersSistema.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      columns: { id: true }
  });

  return { users: parsedUsers, totalCount: totalRaw.length };
};

export const getUserById = async (id: number | string, adminUser: AuthUser) => {
  const user = await db.query.usersSistema.findFirst({
      where: and(eq(usersSistema.id, Number(id)), isNull(usersSistema.deletedAt)),
      with: { sitesConnection: { with: { site: true } } }
  });
  if (!user) return null;
  return { ...user, sites: user.sitesConnection.map(hc => hc.site) };
};

export const deleteUser = async (id: number | string, adminUser: AuthUser) => {
  const userId = Number(id);
  const oldUser = await getUserById(userId, adminUser);
  if (!oldUser) throw new Error("Usuario no encontrado en Aura.");

  await db.update(usersSistema).set({ deletedAt: new Date() }).where(eq(usersSistema.id, userId));

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

export const updateUser = async (id: number | string, data: any, adminUser: AuthUser) => {
  const userId = Number(id);
  const { nombre, email, rol, password, siteIds } = data;

  const oldUser = await getUserById(userId, adminUser);
  if (!oldUser) throw new Error("Usuario no encontrado en Aura.");

  const targetRole = rol || oldUser.rol;
  const isTargetGlobal = [ROLES.AURA_ROOT, ROLES.AURA_SUPPORT, ROLES.CORP_ADMIN, ROLES.CORP_VIEWER].includes(targetRole);
  const isCreatorGlobal = [ROLES.AURA_ROOT, ROLES.AURA_SUPPORT, ROLES.CORP_ADMIN, ROLES.CORP_VIEWER].includes(adminUser.rol);

  let targetSiteIds = oldUser.sites.map(h => h.id);
  
  if (isTargetGlobal) {
      targetSiteIds = [];
  } else if (siteIds !== undefined) {
      targetSiteIds = siteIds; 
      
      if (isCreatorGlobal) {
          if (!targetSiteIds || targetSiteIds.length === 0) throw new Error("403 Forbidden: Para guardar roles Locales debes asignar al menos un sitio.");
      } else {
          if (adminUser.sites && adminUser.sites.length === 1) {
             targetSiteIds = [adminUser.sites[0].id];
          } else if (adminUser.sites && adminUser.sites.length > 1) {
             const allowedIds = adminUser.sites.map(h => h.id);
             const isSubset = targetSiteIds.length > 0 && targetSiteIds.every((id: any) => allowedIds.includes(Number(id)));
             if (!isSubset) throw new Error("403 Forbidden: Intento de actualizar sitios fuera de jurisdicción permitida.");
          }
      }
  }

  validateRoleAndSites(targetRole, targetSiteIds, adminUser.rol);

  const updateData: any = {};
  if (nombre) updateData.nombre = nombre;
  if (email) updateData.email = email;
  if (rol) updateData.rol = rol;
  if (password) updateData.password = await bcrypt.hash(password, 10);

  if (oldUser.username === "superuser" && rol && rol !== oldUser.rol) {
    throw new Error("No se puede interactuar con el rol del superadministrador en Aura");
  }

  await db.update(usersSistema).set(updateData).where(eq(usersSistema.id, userId));

  if (targetSiteIds && Array.isArray(targetSiteIds)) {
      // Borrar anteriores
      await db.delete(siteToUserSistema).where(eq(siteToUserSistema.B, userId));
      // Insertar nuevos
      if (targetSiteIds.length > 0) {
          const connections = targetSiteIds.map(hid => ({ A: Number(hid), B: userId }));
          await db.insert(siteToUserSistema).values(connections);
      }
  }

  const updatedUser = await getUserById(userId, adminUser);

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
