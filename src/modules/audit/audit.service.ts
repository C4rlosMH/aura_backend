import { db } from "../../core/database";
import { auditLogs } from "./audit.model";
import { ROLES } from "../../config/constants.js";
import { AuthUser } from "../auth/auth.types";
import { eq, inArray, and } from "drizzle-orm";

export const logActivity = async ({ action, entity, entityId, oldData = null, newData = null, user = null, details = null }: any) => {
  try {
    const actionsWithoutId = ['LOGIN_FAIL', 'UNAUTHORIZED_ACCESS', 'IMPORT'];
    if ((entityId === null || entityId === undefined) && !actionsWithoutId.includes(action)) return;

    let hotelIdToLog = null;
    if (user && user.hotelId) hotelIdToLog = user.hotelId;
    else if (newData && newData.hotelId) hotelIdToLog = newData.hotelId;
    else if (oldData && oldData.hotelId) hotelIdToLog = oldData.hotelId;

    await db.insert(auditLogs).values({
        action, entity,
        entityId: (entityId !== null && entityId !== undefined) ? Number(entityId) : 0,
        oldData: oldData ? oldData : null, 
        newData: newData ? newData : null,
        userId: user ? Number(user.id) : null,
        hotelId: hotelIdToLog ? Number(hotelIdToLog) : null,
        details: details || null,
    });
  } catch (error: any) { console.error("Error al registrar auditoría:", error.message); }
};

export const getAuditLogs = async ({ skip, take, entity, userId, hotelId }: any, user: AuthUser) => {
  const conditions: any[] = [];

  if (user.hotelId) conditions.push(eq(auditLogs.hotelId, user.hotelId));
  else if (user.rol === ROLES.AURA_ROOT || user.rol === ROLES.AURA_SUPPORT) {
      if (hotelId) conditions.push(eq(auditLogs.hotelId, Number(hotelId)));
  } else if (user.hotels && user.hotels.length > 0) {
      const myHotelIds = user.hotels.map(h => h.id);
      if (hotelId) {
          if (myHotelIds.includes(Number(hotelId))) conditions.push(eq(auditLogs.hotelId, Number(hotelId)));
          else conditions.push(eq(auditLogs.hotelId, -1)); 
      } else {
          conditions.push(inArray(auditLogs.hotelId, myHotelIds));
      }
  } else { conditions.push(eq(auditLogs.hotelId, -1)); }

  if (entity) conditions.push(eq(auditLogs.entity, entity));
  if (userId) conditions.push(eq(auditLogs.userId, Number(userId)));

  const logs = await db.query.auditLogs.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      offset: skip, limit: take,
      with: { user: { columns: { username: true, nombre: true, rol: true } }, hotel: { columns: { nombre: true, codigo: true } } },
      orderBy: (logs, { desc }) => [desc(logs.createdAt)]
  });

  const totals = await db.query.auditLogs.findMany({ where: conditions.length ? and(...conditions) : undefined, columns: { id: true }});

  return { logs, totalCount: totals.length };
};
