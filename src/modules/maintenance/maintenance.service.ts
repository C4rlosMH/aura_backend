import { db } from "../../core/database";
import { maintenances } from "./maintenance.model";
import { devices } from "../inventory/inventory.model";
import { areas } from "../organization/organization.model";
import { ROLES } from "../../config/constants.js";
import * as auditService from "../audit/audit.service";
import { AuthUser } from "../auth/auth.types";
import { eq, inArray, and, isNull } from "drizzle-orm";

const getTenantFilter = (user: any) => {
  if (!user) return { siteId: -1 };
  if (user.rol === ROLES.AURA_ROOT || user.rol === ROLES.CORP_VIEWER || user.rol === ROLES.CORP_ADMIN) return null;
  if (user.siteId && user.allowedSites && user.allowedSites.includes(Number(user.siteId))) return { siteId: Number(user.siteId) };
  if (user.allowedSites && user.allowedSites.length > 0) return { in: user.allowedSites };
  return { siteId: -1 };
};

export const getMaintenances = async ({ skip, take, sortBy, order }: any, user: AuthUser) => {
  const tenantFilter = getTenantFilter(user);
  const conds = [isNull(maintenances.deletedAt)];
  
  if (tenantFilter) {
      if (tenantFilter.siteId === -1) conds.push(eq(maintenances.siteId, -1));
      else if (tenantFilter.siteId) conds.push(eq(maintenances.siteId, tenantFilter.siteId));
      else if (tenantFilter.in) conds.push(inArray(maintenances.siteId, tenantFilter.in));
  }

  const list = await db.query.maintenances.findMany({
      where: and(...conds),
      offset: skip, limit: take,
      with: { device: { with: { staff: true, area: { with: { departamento: true } } } }, site: true },
      orderBy: (m, { asc, desc }) => [order === 'desc' ? desc((m as any)[sortBy || 'fecha_programada']) : asc((m as any)[sortBy || 'fecha_programada'])]
  });

  const totals = await db.query.maintenances.findMany({ where: and(...conds), columns: { id: true } });
  return { maintenances: list, totalCount: totals.length };
};

export const getMaintenanceById = async (id: number | string, user: AuthUser) => {
  const tenantFilter = getTenantFilter(user);
  const conds = [eq(maintenances.id, Number(id)), isNull(maintenances.deletedAt)];
  if (tenantFilter) {
      if (tenantFilter.siteId === -1) conds.push(eq(maintenances.siteId, -1));
      else if (tenantFilter.siteId) conds.push(eq(maintenances.siteId, tenantFilter.siteId));
      else if (tenantFilter.in) conds.push(inArray(maintenances.siteId, tenantFilter.in));
  }
  return await db.query.maintenances.findFirst({ where: and(...conds), with: { device: { with: { staff: true, area: true } } } });
};

export const createMaintenance = async (data: any, user: AuthUser) => {
  const device = await db.query.devices.findFirst({ where: eq(devices.id, Number(data.deviceId)) });
  if (!device) throw new Error("Dispositivo no encontrado en Aura.");

  if (user.siteId && device.siteId !== user.siteId) throw new Error("Acceso denegado al Tenant de este equipo.");
  
  if (!user.siteId && user.sites && user.sites.length > 0) {
      const hasAccess = user.sites.some(h => h.id === device.siteId);
      if (!hasAccess && user.rol !== ROLES.AURA_ROOT) throw new Error("Permisos insuficientes.");
  }

  const [res] = await db.insert(maintenances).values({ ...data, siteId: device.siteId, fecha_programada: data.fecha_programada ? new Date(data.fecha_programada) : null, fecha_realizacion: data.fecha_realizacion ? new Date(data.fecha_realizacion) : null });
  const newId = (res as any).insertId;
  const newManto = await db.query.maintenances.findFirst({ where: eq(maintenances.id, newId) });

  await auditService.logActivity({
    action: 'CREATE', entity: 'Maintenance', entityId: newId, newData: newManto, user, details: `Mantenimiento Aura programado (Equipo: ${device.id})`
  });
  return newManto;
};

export const updateMaintenance = async (id: number | string, data: any, user: AuthUser) => {
  const mantoId = Number(id);
  const oldManto = await getMaintenanceById(mantoId, user);
  if (!oldManto) throw new Error("Registro no encontrado.");

  await db.update(maintenances).set({ ...data, fecha_programada: data.fecha_programada ? new Date(data.fecha_programada) : oldManto.fecha_programada, fecha_realizacion: data.fecha_realizacion ? new Date(data.fecha_realizacion) : oldManto.fecha_realizacion }).where(eq(maintenances.id, mantoId));
  const updatedManto = await db.query.maintenances.findFirst({ where: eq(maintenances.id, mantoId) });

  let details = "Aura Mantenimiento Modificado";
  if (oldManto.estado !== 'realizado' && data.estado === 'realizado') details = "Aura Mantenimiento COMPLETADO";

  await auditService.logActivity({
    action: 'UPDATE', entity: 'Maintenance', entityId: mantoId, oldData: oldManto, newData: updatedManto, user, details
  });
  return updatedManto;
};

export const deleteMaintenance = async (id: number | string, user: AuthUser) => {
  const mantoId = Number(id);
  const oldManto = await getMaintenanceById(mantoId, user);
  if (!oldManto) throw new Error("Registro inalcanzable.");

  await db.update(maintenances).set({ deletedAt: new Date() }).where(eq(maintenances.id, mantoId));
  
  await auditService.logActivity({ action: 'DELETE', entity: 'Maintenance', entityId: mantoId, oldData: oldManto, user, details: "Mantenimiento eliminado (Soft Delete)" });
  return { message: "Eliminado de Aura" };
};
