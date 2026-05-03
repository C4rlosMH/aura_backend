import { db } from "../../core/database";
import { departments } from "./organization.model";
import { eq, inArray, isNull, and, asc, desc } from "drizzle-orm";
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

export const getDepartments = async ({ skip, take, sortBy, order }: PaginationParams, user: AuthUser) => {
  const tenantFilter = getTenantFilter(user);
  
  const conditions: any[] = [isNull(departments.deletedAt)];
  if (tenantFilter) {
      if (tenantFilter.siteId === -1) conditions.push(eq(departments.siteId, -1));
      else if (tenantFilter.in) conditions.push(inArray(departments.siteId, tenantFilter.in));
      else if (tenantFilter.siteId) conditions.push(eq(departments.siteId, tenantFilter.siteId));
  }

  const result = await db.query.departments.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: { site: { columns: { nombre: true, codigo: true } } },
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
        if (tenantFilter.siteId === -1) conditions.push(eq(departments.siteId, -1));
        else if (tenantFilter.in) conditions.push(inArray(departments.siteId, tenantFilter.in));
        else if (tenantFilter.siteId) conditions.push(eq(departments.siteId, tenantFilter.siteId));
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
      if (tenantFilter.siteId === -1) conditions.push(eq(departments.siteId, -1));
      else if (tenantFilter.in) conditions.push(inArray(departments.siteId, tenantFilter.in));
      else if (tenantFilter.siteId) conditions.push(eq(departments.siteId, tenantFilter.siteId));
  }

  return await db.query.departments.findFirst({
    where: conditions.length > 0 ? and(...conditions) : undefined
  });
};

export const createDepartment = async (data: any, user: AuthUser) => {
  let siteIdToAssign = user.siteId;
  if (!siteIdToAssign && data.siteId) siteIdToAssign = Number(data.siteId);
  
  if (user.rol !== ROLES.AURA_ROOT && user.sites) {
      const canCreate = user.sites.some((h: any) => h.id === siteIdToAssign);
      if (!canCreate) throw new Error("No tienes permiso para crear departamentos en este sitio.");
  }

  if (!siteIdToAssign) throw new Error("No se puede crear un departamento sin asignar un sitio.");

  const [result] = await db.insert(departments).values({
      nombre: data.nombre,
      siteId: siteIdToAssign
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
