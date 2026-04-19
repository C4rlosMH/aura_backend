import { db } from "../../core/database";
import { departments } from "./organization.model";
import { eq, inArray, isNull, and, asc, desc } from "drizzle-orm";
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

export const getDepartments = async ({ skip, take, sortBy, order }: PaginationParams, user: AuthUser) => {
  const tenantFilter = getTenantFilter(user);
  
  const conditions: any[] = [isNull(departments.deletedAt)];
  if (tenantFilter) {
      if (tenantFilter.hotelId === -1) conditions.push(eq(departments.hotelId, -1));
      else if (tenantFilter.in) conditions.push(inArray(departments.hotelId, tenantFilter.in));
      else if (tenantFilter.hotelId) conditions.push(eq(departments.hotelId, tenantFilter.hotelId));
  }

  const result = await db.query.departments.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: { hotel: { columns: { nombre: true, codigo: true } } },
    offset: skip,
    limit: take,
    orderBy: (departments, { asc, desc }) => [order === 'desc' ? desc(departments.nombre) : asc(departments.nombre)]
  });

  // Calculate total via a separate query
  const allDepts = await db.query.departments.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      columns: { id: true }
  });
  const totalCount = allDepts.length;

  return { departments: result, totalCount };
};

export const getAllDepartments = async (user: AuthUser) => {
    const tenantFilter = getTenantFilter(user);
    const conditions: any[] = [isNull(departments.deletedAt)];
    if (tenantFilter) {
        if (tenantFilter.hotelId === -1) conditions.push(eq(departments.hotelId, -1));
        else if (tenantFilter.in) conditions.push(inArray(departments.hotelId, tenantFilter.in));
        else if (tenantFilter.hotelId) conditions.push(eq(departments.hotelId, tenantFilter.hotelId));
    }

    return await db.query.departments.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: (departments, { asc }) => [asc(departments.nombre)]
    });
};

export const getDepartmentById = async (id: string | number, user: AuthUser) => {
  const tenantFilter = getTenantFilter(user);
  const conditions: any[] = [eq(departments.id, Number(id)), isNull(departments.deletedAt)];
  
  if (tenantFilter) {
      if (tenantFilter.hotelId === -1) conditions.push(eq(departments.hotelId, -1));
      else if (tenantFilter.in) conditions.push(inArray(departments.hotelId, tenantFilter.in));
      else if (tenantFilter.hotelId) conditions.push(eq(departments.hotelId, tenantFilter.hotelId));
  }

  return await db.query.departments.findFirst({
    where: conditions.length > 0 ? and(...conditions) : undefined
  });
};

export const createDepartment = async (data: any, user: AuthUser) => {
  let hotelIdToAssign = user.hotelId;
  if (!hotelIdToAssign && data.hotelId) hotelIdToAssign = Number(data.hotelId);
  
  if (user.rol !== ROLES.AURA_ROOT && user.hotels) {
      const canCreate = user.hotels.some((h: any) => h.id === hotelIdToAssign);
      if (!canCreate) throw new Error("No tienes permiso para crear departamentos en este hotel.");
  }

  if (!hotelIdToAssign) throw new Error("No se puede crear un departamento sin asignar un Hotel.");

  const [result] = await db.insert(departments).values({
      nombre: data.nombre,
      hotelId: hotelIdToAssign
  });
  
  const newDeptId = (result as any).insertId;
  const newDept = await db.query.departments.findFirst({ where: eq(departments.id, newDeptId) });

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

export const updateDepartment = async (id: string | number, data: any, user: AuthUser) => {
  const deptId = Number(id);
  const oldDept = await getDepartmentById(deptId, user);
  
  if (!oldDept) throw new Error("Departamento no encontrado o sin permisos.");

  await db.update(departments).set({ nombre: data.nombre }).where(eq(departments.id, deptId));
  const updatedDept = await db.query.departments.findFirst({ where: eq(departments.id, deptId) });

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

export const deleteDepartment = async (id: string | number, user: AuthUser) => {
  const deptId = Number(id);
  const oldDept = await getDepartmentById(deptId, user);
  if (!oldDept) throw new Error("Departamento no encontrado o sin permisos.");

  await db.update(departments).set({ deletedAt: new Date() }).where(eq(departments.id, deptId));

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
