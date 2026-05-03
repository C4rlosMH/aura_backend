import { db } from "../../core/database";
import { sites, departments, areas } from "./organization.model";
import { eq, inArray, isNull, and } from "drizzle-orm";
import * as auditService from "../audit/audit.service";
import { STANDARD_STRUCTURE_TEMPLATE } from "../../core/utils/preloadData";
import { ROLES } from "../../config/constants.js";
import { AuthUser } from "./organization.types";

const getSiteFilter = (user: any) => {
  if (!user) return { id: -1 };
  if (user.rol === ROLES.AURA_ROOT || user.rol === ROLES.CORP_VIEWER || user.rol === ROLES.CORP_ADMIN) return null;
  if (user.allowedSites && user.allowedSites.length > 0) return { in: user.allowedSites };
  return { id: -1 };
};

export const getAllSites = async (user: AuthUser) => {
  const filter = getSiteFilter(user);
  
  const conditions: any[] = [isNull(sites.deletedAt), eq(sites.activo, true)];
  if (filter) {
      if (filter.id === -1) conditions.push(eq(sites.id, -1));
      else if (filter.in) conditions.push(inArray(sites.id, filter.in));
  }

  return await db.query.sites.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: (sites, { asc }) => [asc(sites.nombre)]
  });
};

export const createSite = async (data: any, user: AuthUser) => {
  const [result] = await db.insert(sites).values({
      nombre: data.nombre,
      codigo: data.codigo,
      direccion: data.direccion,
      ciudad: data.ciudad,
      razonSocial: data.razonSocial,
      diminutivo: data.diminutivo,
      activo: data.activo !== undefined ? data.activo : true
  });
  
  const newSiteId = (result as any).insertId;
  const newSite = await db.query.sites.findFirst({ where: eq(sites.id, newSiteId) });

  if (data.autoStructure && newSite) {
      for (const group of STANDARD_STRUCTURE_TEMPLATE) {
          await db.insert(departments).values({
              nombre: group.depto,
              siteId: newSite.id
          }).onDuplicateKeyUpdate({ set: { nombre: group.depto } });
          
          const depto = await db.query.departments.findFirst({
              where: and(eq(departments.nombre, group.depto), eq(departments.siteId, newSite.id))
          });

          if (depto && group.areas && group.areas.length > 0) {
              const uniqueAreas = [...new Set(group.areas)];
              const areasData = uniqueAreas.map(areaName => ({
                  nombre: areaName,
                  departamentoId: depto.id,
                  siteId: newSite.id
              }));

              await db.insert(areas).values(areasData as any).onDuplicateKeyUpdate({ set: { siteId: newSite.id } });
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

export const updateSite = async (id: string | number, data: any, user: AuthUser) => {
  const siteId = Number(id);
  
  if (user.rol !== ROLES.AURA_ROOT) {
      const hasAccess = user.sites?.some((h: any) => h.id === siteId);
      if (!hasAccess) throw new Error("No tienes permiso para editar este sitio.");
  }

  const oldSite = await db.query.sites.findFirst({ where: eq(sites.id, siteId) });

  await db.update(sites).set({
      nombre: data.nombre,
      codigo: data.codigo,
      direccion: data.direccion,
      ciudad: data.ciudad,
      razonSocial: data.razonSocial,
      diminutivo: data.diminutivo,
      activo: data.activo
  }).where(eq(sites.id, siteId));

  const updatedSite = await db.query.sites.findFirst({ where: eq(sites.id, siteId) });

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

export const deleteSite = async (id: string | number, user: AuthUser) => {
  if (user.rol !== ROLES.AURA_ROOT) {
      throw new Error("Solo el Super Admin (Root) puede eliminar sitios.");
  }

  const siteId = Number(id);
  const oldSite = await db.query.sites.findFirst({ where: eq(sites.id, siteId) });

  await db.update(sites).set({ 
      deletedAt: new Date(), 
      activo: false 
  }).where(eq(sites.id, siteId));

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
