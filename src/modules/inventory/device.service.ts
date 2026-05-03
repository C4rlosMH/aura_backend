import { db } from "../../core/database";
import { devices, deviceStatus, auraVLANs, deviceType } from "./inventory.model";
import { eq, inArray, isNull, and, or, ilike, gt, gte, lt, lte, ne } from "drizzle-orm";
import * as auditService from "../audit/audit.service";
import { ROLES, DEVICE_STATUS } from "../../config/constants.js";
import { AuthUser } from "../auth/auth.types";
import { InventoryPaginationParams } from "./inventory.types";
import ExcelJS from "exceljs";

const getTenantFilter = (user: any) => {
  if (!user) return { siteId: -1 };
  if (user.rol === ROLES.AURA_ROOT || user.rol === ROLES.CORP_VIEWER || user.rol === ROLES.CORP_ADMIN) return null;
  if (user.siteId && user.allowedSites && user.allowedSites.includes(Number(user.siteId))) return { siteId: Number(user.siteId) };
  if (user.allowedSites && user.allowedSites.length > 0) return { in: user.allowedSites };
  return { siteId: -1 };
};

const isIpInCidr = (ip: string, cidr: string) => {
    try {
        const [subnet, bits] = cidr.split('/');
        const mask = parseInt(bits, 10);
        const ipToLong = (addr: string) => addr.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
        const cidrToMask = (m: number) => -1 << (32 - m) >>> 0;
        return (ipToLong(ip) & cidrToMask(mask)) === (ipToLong(subnet) & cidrToMask(mask));
    } catch {
        return false;
    }
};

export const getActiveDevices = async ({ skip, take, search, filter, sortBy, order, typeIds }: InventoryPaginationParams, user: AuthUser) => {
  const tenantFilter = getTenantFilter(user);
  const conditions: any[] = [isNull(devices.deletedAt)];

  if (tenantFilter) {
      if (tenantFilter.siteId === -1) conditions.push(eq(devices.siteId, -1));
      else if (tenantFilter.in) conditions.push(inArray(devices.siteId, tenantFilter.in));
      else if (tenantFilter.siteId) conditions.push(eq(devices.siteId, tenantFilter.siteId));
  }

  const disposedStatusIdRes = await db.query.deviceStatus.findFirst({ where: eq(deviceStatus.nombre, DEVICE_STATUS.DISPOSED) });
  if (disposedStatusIdRes) conditions.push(ne(devices.estadoId, disposedStatusIdRes.id));

  if (typeIds && typeIds.length > 0) {
      conditions.push(inArray(devices.tipoId, typeIds));
  }

  if (search) {
      conditions.push(or(
          ilike(devices.etiqueta, `%${search}%`),
          ilike(devices.nombre_equipo, `%${search}%`),
          ilike(devices.numero_serie, `%${search}%`),
          ilike(devices.mac_address, `%${search}%`),
          ilike(devices.ip_equipo, `%${search}%`)
      ));
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ninetyDays = new Date(today);
  ninetyDays.setDate(today.getDate() + 90);

  if (filter === 'no-panda') conditions.push(eq(devices.es_panda, false));
  else if (filter === 'expired-warranty') conditions.push(lt(devices.garantia_fin, today));
  else if (filter === 'warranty-risk') conditions.push(and(gte(devices.garantia_fin, today), lte(devices.garantia_fin, ninetyDays)));

  const list = await db.query.devices.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      offset: skip,
      ...(take && { limit: take }),
      with: {
          staff: true,
          type: true,
          status: true,
          os: true,
          area: { with: { departamento: true } },
          vlan: true
      },
      orderBy: (devices, { asc, desc }) => [order === 'desc' ? desc((devices as any)[sortBy || 'id']) : asc((devices as any)[sortBy || 'id'])]
  });

  const total = await db.query.devices.findMany({ where: conditions.length > 0 ? and(...conditions) : undefined, columns: { id: true } });

  return { devices: list, totalCount: total.length };
};

export const createDevice = async (data: any, user: AuthUser) => {
  let siteIdToAssign = user.siteId;
  if (!siteIdToAssign && data.siteId) siteIdToAssign = Number(data.siteId);
  if (!siteIdToAssign) throw new Error("Aura Core: Se requiere asignar el Tenant (Site) para catalogar este dispositivo.");

  // Validación de VLAN Inteligente
  if (data.ip_equipo && data.vlanId) {
      const vlanInfo = await db.query.auraVLANs.findFirst({ where: eq(auraVLANs.id, data.vlanId) });
      if (vlanInfo && vlanInfo.subnet_cidr && !isIpInCidr(data.ip_equipo, vlanInfo.subnet_cidr)) {
          throw new Error(`Aura Security Protocol: La IP provista no calza con el segmento CIDR (${vlanInfo.subnet_cidr}) de su VLAN asociada.`);
      }
  }

  // Set IA dummy metrics
  const risk_score = (Math.random() * (15 - 0.1) + 0.1).toFixed(2);
  
  const [result] = await db.insert(devices).values({
      ...data,
      es_panda: !!data.es_panda,
      siteId: siteIdToAssign,
      risk_score: data.risk_score || risk_score,
      last_env_check: new Date()
  });

  const newId = (result as any).insertId;
  const newDevice = await getDeviceById(newId, user);

  await auditService.logActivity({
      action: 'CREATE', entity: 'Device', entityId: newId, newData: newDevice, user, details: `Dispositivo indexado: ${newDevice?.nombre_equipo}`
  });

  return newDevice;
};

export const updateDevice = async (id: number | string, data: any, user: AuthUser) => {
  const deviceId = Number(id);
  const oldDevice = await getDeviceById(deviceId, user);
  if (!oldDevice) throw new Error("Dispositivo fantasma o denegado por políticas de Tenant.");

  if (data.ip_equipo || data.vlanId) {
      const IP = data.ip_equipo || oldDevice.ip_equipo;
      const vId = data.vlanId || oldDevice.vlanId;
      if (IP && vId) {
          const vlanInfo = await db.query.auraVLANs.findFirst({ where: eq(auraVLANs.id, vId) });
          if (vlanInfo && vlanInfo.subnet_cidr && !isIpInCidr(IP, vlanInfo.subnet_cidr)) {
             throw new Error(`Aura Security Protocol: La IP registrada no encaja con el entorno CIDR (${vlanInfo.subnet_cidr}) de su VLAN.`);
          }
      }
  }

  const disposedStatus = await db.query.deviceStatus.findFirst({ where: eq(deviceStatus.nombre, DEVICE_STATUS.DISPOSED) });
  const disposedId = disposedStatus?.id;

  if (disposedId) {
      if (oldDevice.estadoId === disposedId && data.estadoId && data.estadoId !== disposedId) {
          data.fecha_baja = null; data.motivo_baja = null; data.observaciones_baja = null;
      } else if (data.estadoId === disposedId && oldDevice.estadoId !== disposedId && !data.fecha_baja) {
          data.fecha_baja = new Date();
      }
  }

  await db.update(devices).set({ ...data, updatedAt: new Date() }).where(eq(devices.id, deviceId));
  const updatedDevice = await getDeviceById(deviceId, user);

  await auditService.logActivity({
      action: 'UPDATE', entity: 'Device', entityId: deviceId, oldData: oldDevice, newData: updatedDevice, user, details: `Device metadata actualizada: ${updatedDevice?.nombre_equipo}`
  });

  return updatedDevice;
};

export const deleteDevice = async (id: number | string, user: AuthUser) => {
    const deviceId = Number(id);
    const old = await getDeviceById(deviceId, user);
    if (!old) throw new Error("No localizado");
    await db.update(devices).set({ deletedAt: new Date() }).where(eq(devices.id, deviceId));
    
    await auditService.logActivity({
       action: 'DELETE', entity: 'Device', entityId: deviceId, oldData: old, user, details: 'Dispositivo enviado al archivo muerto (Soft Delete)'
    });
    return { message: "Eliminado de Aura Network" };
};

export const getDeviceById = async (id: number | string, user: AuthUser) => {
   const tenantFilter = getTenantFilter(user);
   const conds = [eq(devices.id, Number(id)), isNull(devices.deletedAt)];
   if (tenantFilter) {
       if (tenantFilter.siteId === -1) conds.push(eq(devices.siteId, -1));
       else if (tenantFilter.siteId) conds.push(eq(devices.siteId, tenantFilter.siteId));
       else if (tenantFilter.in) conds.push(inArray(devices.siteId, tenantFilter.in));
   }
   
   return await db.query.devices.findFirst({
       where: and(...conds),
       with: { staff: true, type: true, status: true, os: true, area: { with: { departamento: true } }, site: true, vlan: true }
   });
};
