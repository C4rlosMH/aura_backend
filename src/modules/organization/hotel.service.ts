import { db } from "../../core/database";
import { hotels, departments, areas } from "./organization.model";
import { eq, inArray, isNull, and } from "drizzle-orm";
import * as auditService from "../audit/audit.service";
import { STANDARD_STRUCTURE_TEMPLATE } from "../../core/utils/preloadData";
import { ROLES } from "../../config/constants.js";
import { AuthUser } from "./organization.types";

const getHotelFilter = (user: any) => {
  if (!user) return { id: -1 };
  if (user.rol === ROLES.AURA_ROOT || user.rol === ROLES.CORP_VIEWER || user.rol === ROLES.CORP_ADMIN) return null;
  if (user.allowedHotels && user.allowedHotels.length > 0) return { in: user.allowedHotels };
  return { id: -1 };
};

export const getAllHotels = async (user: AuthUser) => {
  const filter = getHotelFilter(user);
  
  const conditions: any[] = [isNull(hotels.deletedAt), eq(hotels.activo, true)];
  if (filter) {
      if (filter.id === -1) conditions.push(eq(hotels.id, -1));
      else if (filter.in) conditions.push(inArray(hotels.id, filter.in));
  }

  return await db.query.hotels.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: (hotels, { asc }) => [asc(hotels.nombre)]
  });
};

export const createHotel = async (data: any, user: AuthUser) => {
  const [result] = await db.insert(hotels).values({
      nombre: data.nombre,
      codigo: data.codigo,
      direccion: data.direccion,
      ciudad: data.ciudad,
      razonSocial: data.razonSocial,
      diminutivo: data.diminutivo,
      activo: data.activo !== undefined ? data.activo : true
  });
  
  const newHotelId = (result as any).insertId;
  const newHotel = await db.query.hotels.findFirst({ where: eq(hotels.id, newHotelId) });

  if (data.autoStructure && newHotel) {
      for (const group of STANDARD_STRUCTURE_TEMPLATE) {
          await db.insert(departments).values({
              nombre: group.depto,
              hotelId: newHotel.id
          }).onDuplicateKeyUpdate({ set: { nombre: group.depto } });
          
          const depto = await db.query.departments.findFirst({
              where: and(eq(departments.nombre, group.depto), eq(departments.hotelId, newHotel.id))
          });

          if (depto && group.areas && group.areas.length > 0) {
              const uniqueAreas = [...new Set(group.areas)];
              const areasData = uniqueAreas.map(areaName => ({
                  nombre: areaName,
                  departamentoId: depto.id,
                  hotelId: newHotel.id
              }));

              await db.insert(areas).values(areasData as any).onDuplicateKeyUpdate({ set: { hotelId: newHotel.id } });
          }
      }
  }

  await auditService.logActivity({
    action: 'CREATE',
    entity: 'Hotel',
    entityId: newHotelId,
    newData: newHotel,
    user: user,
    details: `Nuevo Hotel creado: ${newHotel?.nombre}`
  });

  return newHotel;
};

export const updateHotel = async (id: string | number, data: any, user: AuthUser) => {
  const hotelId = Number(id);
  
  if (user.rol !== ROLES.AURA_ROOT) {
      const hasAccess = user.hotels?.some((h: any) => h.id === hotelId);
      if (!hasAccess) throw new Error("No tienes permiso para editar este hotel.");
  }

  const oldHotel = await db.query.hotels.findFirst({ where: eq(hotels.id, hotelId) });

  await db.update(hotels).set({
      nombre: data.nombre,
      codigo: data.codigo,
      direccion: data.direccion,
      ciudad: data.ciudad,
      razonSocial: data.razonSocial,
      diminutivo: data.diminutivo,
      activo: data.activo
  }).where(eq(hotels.id, hotelId));

  const updatedHotel = await db.query.hotels.findFirst({ where: eq(hotels.id, hotelId) });

  await auditService.logActivity({
    action: 'UPDATE',
    entity: 'Hotel',
    entityId: hotelId,
    oldData: oldHotel,
    newData: updatedHotel,
    user: user,
    details: `Hotel actualizado: ${updatedHotel?.nombre}`
  });

  return updatedHotel;
};

export const deleteHotel = async (id: string | number, user: AuthUser) => {
  if (user.rol !== ROLES.AURA_ROOT) {
      throw new Error("Solo el Super Admin (Root) puede eliminar hoteles.");
  }

  const hotelId = Number(id);
  const oldHotel = await db.query.hotels.findFirst({ where: eq(hotels.id, hotelId) });

  await db.update(hotels).set({ 
      deletedAt: new Date(), 
      activo: false 
  }).where(eq(hotels.id, hotelId));

  await auditService.logActivity({
    action: 'DELETE',
    entity: 'Hotel',
    entityId: hotelId,
    oldData: oldHotel,
    user: user,
    details: `Hotel dado de baja: ${oldHotel?.nombre}`
  });

  return { message: "Hotel eliminado" };
};
