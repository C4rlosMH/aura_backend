import { db } from "../../core/database";
import { auditLogs } from "./audit.model";
import { ROLES } from "../../config/constants.js";
import { AuthUser } from "../auth/auth.types";
import { eq, inArray, and } from "drizzle-orm";

export const logActivity = async ({ action, entity, entityId, oldData = null, newData = null, user = null, details = null }: any) => {
  try {
    const actionsWithoutId = ['LOGIN_FAIL', 'UNAUTHORIZED_ACCESS', 'IMPORT'];
    if ((entityId === null || entityId === undefined) && !actionsWithoutId.includes(action)) return;

    let siteIdToLog = null;
    if (user && user.siteId) siteIdToLog = user.siteId;
    else if (newData && newData.siteId) siteIdToLog = newData.siteId;
    else if (oldData && oldData.siteId) siteIdToLog = oldData.siteId;

    await db.insert(auditLogs).values({
        action, entity,
        entityId: (entityId !== null && entityId !== undefined) ? Number(entityId) : 0,
        oldData: oldData ? oldData : null, 
        newData: newData ? newData : null,
        userId: user ? Number(user.id) : null,
        siteId: siteIdToLog ? Number(siteIdToLog) : null,
        details: details || null,
    });
  } catch (error: any) { console.error("Error al registrar auditoría:", error.message); }
};

export const getAuditLogs = async ({ skip, take, entity, userId, siteId }: any, user: AuthUser) => {
  const conditions: any[] = [];

  if (user.siteId) conditions.push(eq(auditLogs.siteId, user.siteId));
  else if (user.rol === ROLES.AURA_ROOT || user.rol === ROLES.AURA_SUPPORT) {
      if (siteId) conditions.push(eq(auditLogs.siteId, Number(siteId)));
  } else if (user.sites && user.sites.length > 0) {
      const mySiteIds = user.sites.map(h => h.id);
      if (siteId) {
          if (mySiteIds.includes(Number(siteId))) conditions.push(eq(auditLogs.siteId, Number(siteId)));
          else conditions.push(eq(auditLogs.siteId, -1)); 
      } else {
          conditions.push(inArray(auditLogs.siteId, mySiteIds));
      }
  } else { conditions.push(eq(auditLogs.siteId, -1)); }

  if (entity) conditions.push(eq(auditLogs.entity, entity));
  if (userId) conditions.push(eq(auditLogs.userId, Number(userId)));

  const logs = await db.query.auditLogs.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      offset: skip, limit: take,
      with: { user: { columns: { username: true, nombre: true, rol: true } }, site: { columns: { nombre: true, codigo: true } } },
      orderBy: (logs, { desc }) => [desc(logs.createdAt)]
  });

  const totals = await db.query.auditLogs.findMany({ where: conditions.length ? and(...conditions) : undefined, columns: { id: true }});

  return { logs, totalCount: totals.length };
};
