import { db } from "../../core/database";
import { areas, departments } from "./organization.model";
import { eq, inArray, isNull, and } from "drizzle-orm";
import * as auditService from "../audit/audit.service";
import { ROLES } from "../../config/constants.js";
import { AuthUser, PaginationParams } from "./organization.types";

const getTenantFilter = (user: any) => {
  if (!user) return { hotelId: -1 };
  if (user.rol === ROLES.AURA_ROOT || user.rol === ROLES.CORP_VIEWER || user.rol === ROLES.CORP_ADMIN) return null;
  if (user.hotelId && user.allowedHotels && user.allowedHotels.includes(Number(user.hotelId))) return { hotelId: Number(user.hotelId) };
  if (user.allowedHotels && user.allowedHotels.length > 0) return { in: user.allowedHotels };
  return { hotelId: -1 };
};

export const getAreas = async ({ skip, take, sortBy, order }: PaginationParams, user: AuthUser) => {
  const tenantFilter = getTenantFilter(user);
  
  const conditions: any[] = [isNull(areas.deletedAt)];
  if (tenantFilter) {
      if (tenantFilter.hotelId === -1) conditions.push(eq(areas.hotelId, -1));
      else if (tenantFilter.in) conditions.push(inArray(areas.hotelId, tenantFilter.in));
      else if (tenantFilter.hotelId) conditions.push(eq(areas.hotelId, tenantFilter.hotelId));
  }

  const result = await db.query.areas.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: {
        departamento: true,
        hotel: { columns: { nombre: true, codigo: true, id: true } }
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
      if (tenantFilter.hotelId === -1) conditions.push(eq(areas.hotelId, -1));
      else if (tenantFilter.in) conditions.push(inArray(areas.hotelId, tenantFilter.in));
      else if (tenantFilter.hotelId) conditions.push(eq(areas.hotelId, tenantFilter.hotelId));
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
        if (tenantFilter.hotelId === -1) conditions.push(eq(areas.hotelId, -1));
        else if (tenantFilter.in) conditions.push(inArray(areas.hotelId, tenantFilter.in));
        else if (tenantFilter.hotelId) conditions.push(eq(areas.hotelId, tenantFilter.hotelId));
    }

    return await db.query.areas.findFirst({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        with: { departamento: true }
    });
};

export const createArea = async (data: any, user: AuthUser) => {
    let hotelIdToAssign = user.hotelId;
    if (!hotelIdToAssign && data.hotelId) hotelIdToAssign = Number(data.hotelId);
    
    if (user.rol !== ROLES.AURA_ROOT && user.hotels) {
        const canCreate = user.hotels.some((h: any) => h.id === hotelIdToAssign);
        if (!canCreate) throw new Error("No tienes permiso para crear áreas en este hotel.");
    }

    if (!hotelIdToAssign) throw new Error("Se requiere un Hotel para crear el área.");

    const dept = await db.query.departments.findFirst({
        where: and(eq(departments.id, Number(data.departamentoId)), eq(departments.hotelId, hotelIdToAssign))
    });
    if (!dept) throw new Error("El departamento seleccionado no existe o no pertenece a tu hotel.");

    const [result] = await db.insert(areas).values({
        nombre: data.nombre,
        departamentoId: Number(data.departamentoId),
        hotelId: hotelIdToAssign,
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
            where: and(eq(departments.id, Number(data.departamentoId)), eq(departments.hotelId, oldArea.hotelId))
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
