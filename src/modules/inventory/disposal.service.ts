import { db } from "../../core/database";
import { devices, deviceStatus } from "./inventory.model";
import { eq, inArray, isNull, and, or, ilike, ne } from "drizzle-orm";
import { AuthUser } from "../auth/auth.types";
import { DEVICE_STATUS, ROLES } from "../../config/constants.js";

const getTenantFilter = (user: any) => {
  if (!user) return { hotelId: -1 };
  if (user.rol === ROLES.AURA_ROOT || user.rol === ROLES.CORP_VIEWER || user.rol === ROLES.CORP_ADMIN) return null;
  if (user.hotelId && user.allowedHotels && user.allowedHotels.includes(Number(user.hotelId))) return { hotelId: Number(user.hotelId) };
  if (user.allowedHotels && user.allowedHotels.length > 0) return { in: user.allowedHotels };
  return { hotelId: -1 };
};

export const getInactiveDevices = async ({ skip, take, search, startDate, endDate }: any, user: AuthUser) => {
  const tenantFilter = getTenantFilter(user);
  const disposedStatusRes = await db.query.deviceStatus.findFirst({ where: eq(deviceStatus.nombre, DEVICE_STATUS.DISPOSED) });
  
  if (!disposedStatusRes) return { devices: [], totalCount: 0 };
  
  const conditions: any[] = [isNull(devices.deletedAt), eq(devices.estadoId, disposedStatusRes.id)];

  if (tenantFilter) {
      if (tenantFilter.hotelId === -1) conditions.push(eq(devices.hotelId, -1));
      else if (tenantFilter.in) conditions.push(inArray(devices.hotelId, tenantFilter.in));
      else if (tenantFilter.hotelId) conditions.push(eq(devices.hotelId, tenantFilter.hotelId));
  }

  if (search) {
      conditions.push(or(
          ilike(devices.etiqueta, `%${search}%`),
          ilike(devices.nombre_equipo, `%${search}%`),
          ilike(devices.numero_serie, `%${search}%`),
          ilike(devices.motivo_baja, `%${search}%`)
      ));
  }

  if (startDate && endDate) {
      // Date logic simplificada, the previous logic can be emulated or we could pass the dates literally in PG/MySQL.
       const { gte, lte } = require('drizzle-orm');
       conditions.push(and(
           gte(devices.fecha_baja, new Date(startDate)),
           lte(devices.fecha_baja, new Date(new Date(endDate).setHours(23, 59, 59, 999)))
       ));
  }

  const list = await db.query.devices.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      offset: skip,
      limit: take,
      with: { staff: true, type: true, status: true, os: true, area: { with: { departamento: true } } },
      orderBy: (devices, { desc }) => [desc(devices.fecha_baja)]
  });

  const totals = await db.query.devices.findMany({ where: conditions.length > 0 ? and(...conditions) : undefined, columns: { id: true } });

  return { devices: list, totalCount: totals.length };
};
