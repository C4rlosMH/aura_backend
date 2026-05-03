import { db } from "../../core/database";
import { areas, departments } from "./organization.model";
import { eq, inArray, isNull, and } from "drizzle-orm";
import * as auditService from "../audit/audit.service";
import { ROLES } from "../../config/constants.js";
import { AuthUser, PaginationParams } from "./organization.types";

const getTenantFilter = (user: any) => {
  if (!user) return { siteId: -1 };
  if (user.rol === ROLES.AURA_ROOT || user.rol === ROLES.CORP_VIEWER || user.rol === ROLES.CORP_ADMIN) return null;
  if (user.siteId && user.allowedSites && user.allowedSites.includes(Number(user.siteId))) return { siteId: Number(user.siteId) };
  if (user.allowedSites && user.allowedSites.length > 0) return { in: user.allowedSites };
  return { siteId: -1 };
};

export const getAreas = async ({ skip, take, sortBy, order }: PaginationParams, user: AuthUser) => {
  const tenantFilter = getTenantFilter(user);
  
  const conditions: any[] = [isNull(areas.deletedAt)];
  if (tenantFilter) {
      if (tenantFilter.siteId === -1) conditions.push(eq(areas.siteId, -1));
      else if (tenantFilter.in) conditions.push(inArray(areas.siteId, tenantFilter.in));
      else if (tenantFilter.siteId) conditions.push(eq(areas.siteId, tenantFilter.siteId));
  }

  const result = await db.query.areas.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: {
        departamento: true,
        site: { columns: { nombre: true, codigo: true, id: true } }
    },
    offset: skip,
    limit: take,
    orderBy: (areas, { asc, desc }) => [order === 'desc' ? desc(areas.nombre) : asc(areas.nombre)]
  });

  const allAreas = await db.query.areas.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      columns: { id: true }
  });
  const totalCount = allAreas.length;

  return { areas: result, totalCount };
};

export const getAllAreas = async (user: AuthUser) => {
  const tenantFilter = getTenantFilter(user);
  const conditions: any[] = [isNull(areas.deletedAt)];
  if (tenantFilter) {
      if (tenantFilter.siteId === -1) conditions.push(eq(areas.siteId, -1));
      else if (tenantFilter.in) conditions.push(inArray(areas.siteId, tenantFilter.in));
      else if (tenantFilter.siteId) conditions.push(eq(areas.siteId, tenantFilter.siteId));
  }

  return await db.query.areas.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: { departamento: true },
    orderBy: (areas, { asc }) => [asc(areas.nombre)]
  });
};

export const getAreaById = async (id: string | number, user: AuthUser) => {
    const tenantFilter = getTenantFilter(user);
    const conditions: any[] = [eq(areas.id, Number(id)), isNull(areas.deletedAt)];
    if (tenantFilter) {
        if (tenantFilter.siteId === -1) conditions.push(eq(areas.siteId, -1));
        else if (tenantFilter.in) conditions.push(inArray(areas.siteId, tenantFilter.in));
        else if (tenantFilter.siteId) conditions.push(eq(areas.siteId, tenantFilter.siteId));
    }

    return await db.query.areas.findFirst({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        with: { departamento: true }
    });
};

export const createArea = async (data: any, user: AuthUser) => {
    let siteIdToAssign = user.siteId;
    if (!siteIdToAssign && data.siteId) siteIdToAssign = Number(data.siteId);
    
    if (user.rol !== ROLES.AURA_ROOT && user.sites) {
        const canCreate = user.sites.some((h: any) => h.id === siteIdToAssign);
        if (!canCreate) throw new Error("No tienes permiso para crear áreas en este sitio.");
    }

    if (!siteIdToAssign) throw new Error("Se requiere un sitio para crear el área.");

    const dept = await db.query.departments.findFirst({
        where: and(eq(departments.id, Number(data.departamentoId)), eq(departments.siteId, siteIdToAssign))
    });
    if (!dept) throw new Error("El departamento seleccionado no existe o no pertenece a tu site.");

    const [result] = await db.insert(areas).values({
        nombre: data.nombre,
        departamentoId: Number(data.departamentoId),
        siteId: siteIdToAssign,
        environmentType: data.environmentType || 'OFFICE'
    });
    
    const newAreaId = (result as any).insertId;
    const newArea = await db.query.areas.findFirst({ where: eq(areas.id, newAreaId) });

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

export const updateArea = async (id: string | number, data: any, user: AuthUser) => {
    const areaId = Number(id);
    const oldArea = await getAreaById(areaId, user);
    if (!oldArea) throw new Error("Área no encontrada o sin permisos.");

    if (data.departamentoId) {
        const dept = await db.query.departments.findFirst({
            where: and(eq(departments.id, Number(data.departamentoId)), eq(departments.siteId, oldArea.siteId))
        });
        if (!dept) throw new Error("El departamento destino no es válido.");
    }

    await db.update(areas).set({
        nombre: data.nombre,
        departamentoId: data.departamentoId ? Number(data.departamentoId) : undefined,
        environmentType: data.environmentType
    }).where(eq(areas.id, areaId));

    const updatedArea = await db.query.areas.findFirst({ where: eq(areas.id, areaId) });

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

export const deleteArea = async (id: string | number, user: AuthUser) => {
    const areaId = Number(id);
    const oldArea = await getAreaById(areaId, user);
    if (!oldArea) throw new Error("Área no encontrada o sin permisos.");

    await db.update(areas).set({ deletedAt: new Date() }).where(eq(areas.id, areaId));

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
