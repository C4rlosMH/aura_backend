import { db } from "../../core/database";
import { staff, auraHandoverLogs } from "./staff.model";
import { areas } from "../organization/organization.model";
import { eq, inArray, isNull, and, or, ilike } from "drizzle-orm";
import * as auditService from "../audit/audit.service";
import { ROLES } from "../../config/constants.js";
import ExcelJS from "exceljs";
import { AuthUser } from "../auth/auth.types";
import { StaffPaginationParams } from "./staff.types";

const getTenantFilter = (user: any) => {
  if (!user) return { hotelId: -1 };
  if (user.rol === ROLES.AURA_ROOT || user.rol === ROLES.CORP_VIEWER || user.rol === ROLES.CORP_ADMIN) return null;
  if (user.hotelId && user.allowedHotels && user.allowedHotels.includes(Number(user.hotelId))) return { hotelId: Number(user.hotelId) };
  if (user.allowedHotels && user.allowedHotels.length > 0) return { in: user.allowedHotels };
  return { hotelId: -1 };
};

export const getStaffMembers = async ({ skip, take, search, sortBy, order }: StaffPaginationParams, user: AuthUser) => {
  const tenantFilter = getTenantFilter(user);
  
  const conditions: any[] = [isNull(staff.deletedAt)];
  if (tenantFilter) {
      if (tenantFilter.hotelId === -1) conditions.push(eq(staff.hotelId, -1));
      else if (tenantFilter.in) conditions.push(inArray(staff.hotelId, tenantFilter.in));
      else if (tenantFilter.hotelId) conditions.push(eq(staff.hotelId, tenantFilter.hotelId));
  }

  if (search) {
      conditions.push(or(
          ilike(staff.nombre, `%${search}%`),
          ilike(staff.correo, `%${search}%`),
          ilike(staff.usuario_login, `%${search}%`)
      ));
  }

  const queryBuilder = db.query.staff.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: {
        area: { with: { departamento: true } },
        hotel: { columns: { nombre: true, codigo: true } }
    },
    ...(skip !== undefined && { offset: skip }),
    ...(take !== undefined && take > 0 && { limit: take }),
    orderBy: (staffTbl, { asc, desc }) => [order === 'desc' ? desc((staffTbl as any)[sortBy || 'nombre']) : asc((staffTbl as any)[sortBy || 'nombre'])]
  });

  const staffRows = await queryBuilder;

  const totalRaw = await db.query.staff.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      columns: { id: true }
  });

  return { users: staffRows, totalCount: totalRaw.length };
};

export const getAllStaff = async (user: AuthUser) => {
  const tenantFilter = getTenantFilter(user);
  const conditions: any[] = [isNull(staff.deletedAt)];
  
  if (tenantFilter) {
      if (tenantFilter.hotelId === -1) conditions.push(eq(staff.hotelId, -1));
      else if (tenantFilter.in) conditions.push(inArray(staff.hotelId, tenantFilter.in));
      else if (tenantFilter.hotelId) conditions.push(eq(staff.hotelId, tenantFilter.hotelId));
  }

  return await db.query.staff.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      columns: { id: true, nombre: true, areaId: true, hotelId: true },
      orderBy: (staffTbl, { asc }) => [asc(staffTbl.nombre)]
  });
};

export const getStaffById = async (id: number | string, user: AuthUser) => {
    const tenantFilter = getTenantFilter(user);
    const conditions: any[] = [eq(staff.id, Number(id)), isNull(staff.deletedAt)];
    
    if (tenantFilter) {
        if (tenantFilter.hotelId === -1) conditions.push(eq(staff.hotelId, -1));
        else if (tenantFilter.in) conditions.push(inArray(staff.hotelId, tenantFilter.in));
        else if (tenantFilter.hotelId) conditions.push(eq(staff.hotelId, tenantFilter.hotelId));
    }

    return await db.query.staff.findFirst({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        with: { area: { with: { departamento: true } } }
    });
};

export const createStaff = async (data: any, user: AuthUser) => {
    let hotelIdToAssign = user.hotelId;
    if (!hotelIdToAssign && data.hotelId) {
        hotelIdToAssign = Number(data.hotelId);
    }
    
    if (!hotelIdToAssign) {
        throw new Error("Se requiere un Hotel paramétrico para asimilar al Staff en Aura.");
    }

    if (data.areaId) {
        const areaExists = await db.query.areas.findFirst({
            where: and(eq(areas.id, Number(data.areaId)), eq(areas.hotelId, hotelIdToAssign))
        });
        if (!areaExists) throw new Error("El Área destino no califica para este Hub/Hotel.");
    }

    const [result] = await db.insert(staff).values({
        nombre: data.nombre,
        correo: data.correo,
        usuario_login: data.usuario_login,
        es_jefe_de_area: data.es_jefe_de_area || false,
        areaId: data.areaId ? Number(data.areaId) : null,
        hotelId: hotelIdToAssign
    });
    
    const newStaffId = (result as any).insertId;
    const newStaff = await db.query.staff.findFirst({ where: eq(staff.id, newStaffId) });

    await auditService.logActivity({
        action: 'CREATE',
        entity: 'Staff',
        entityId: newStaffId,
        newData: newStaff,
        user: user,
        details: `Staff Integrado: ${data.nombre}`
    });

    return newStaff;
};

export const updateStaff = async (id: number | string, data: any, user: AuthUser) => {
    const staffId = Number(id);
    const oldStaff = await getStaffById(staffId, user);
    
    if (!oldStaff) throw new Error("Staff no localizado o Acceso Denegado por Seguridad Multi-tenant.");

    if (data.areaId) {
        const areaExists = await db.query.areas.findFirst({
            where: and(eq(areas.id, Number(data.areaId)), eq(areas.hotelId, oldStaff.hotelId))
        });
        if (!areaExists) throw new Error("El Área destino no califica para este Hub/Hotel.");
    }

    await db.update(staff).set({
        nombre: data.nombre !== undefined ? data.nombre : oldStaff.nombre,
        correo: data.correo !== undefined ? data.correo : oldStaff.correo,
        usuario_login: data.usuario_login !== undefined ? data.usuario_login : oldStaff.usuario_login,
        es_jefe_de_area: data.es_jefe_de_area !== undefined ? data.es_jefe_de_area : oldStaff.es_jefe_de_area,
        areaId: data.areaId ? Number(data.areaId) : oldStaff.areaId,
    }).where(eq(staff.id, staffId));

    const updatedStaff = await db.query.staff.findFirst({ where: eq(staff.id, staffId) });

    await auditService.logActivity({
        action: 'UPDATE',
        entity: 'Staff',
        entityId: staffId,
        oldData: oldStaff,
        newData: updatedStaff,
        user: user,
        details: `Log de Staff - Integrante Modificado: ${updatedStaff?.nombre}`
    });

    return updatedStaff;
};

export const deleteStaff = async (id: number | string, user: AuthUser) => {
    const staffId = Number(id);
    const oldStaff = await getStaffById(staffId, user);
    
    if (!oldStaff) throw new Error("Staff no localizado o Acceso Denegado por Seguridad Multi-tenant.");

    await db.update(staff).set({ deletedAt: new Date() }).where(eq(staff.id, staffId));

    await auditService.logActivity({
        action: 'DELETE',
        entity: 'Staff',
        entityId: staffId,
        oldData: oldStaff,
        user: user,
        details: `Staff dado de baja operativa (Soft Delete)`
    });

    return { message: "Staff eliminado" };
};

/* --- LOGICA DE IMPORTACIÓN DE EXCEL (Refactored a Drizzle) --- */

const cleanLower = (txt: any) => {
    if (!txt) return "";
    return txt.toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

const extractRowData = (row: any, headerMap: any) => {
  const getVal = (possibleKeys: string[]) => {
    for (const key of possibleKeys) {
        const idx = headerMap[cleanLower(key)];
        if (idx) return row.getCell(idx).text?.trim();
    }
    return null;
  };

  const nombreRaw = getVal(['nombre', 'nombre completo', 'empleado']);
  const es_jefe_de_area = ["si", "yes", "verdadero", "true"].includes(cleanLower(getVal(['es jefe', 'jefe', 'es jefe de area', 'jefe area'])));

  return {
    nombre: nombreRaw,
    correo: getVal(['correo', 'email', 'e-mail']) || null,
    areaNombre: getVal(['área', 'area', 'nombre area']),
    deptoNombre: getVal(['departamento', 'depto', 'dept']),
    usuario_login: getVal(['usuario de login', 'usuario', 'login', 'user', 'usuario login']) || null,
    es_jefe_de_area
  };
};

export const importStaffFromExcel = async (buffer: any, user: AuthUser, targetHotelId: number | null = null) => {
  // Lógica de acceso
  let hotelIdToImport = null;
  if (targetHotelId) {
      if (user.rol === ROLES.AURA_ROOT) hotelIdToImport = targetHotelId;
      else {
          const hasAccess = user.hotels && user.hotels.some(h => h.id === targetHotelId);
          if (hasAccess) hotelIdToImport = targetHotelId;
          else throw new Error("Acceso denegado en Aura: Proxy rechaza acceso a este Entorno.");
      }
  } else {
      if (user.hotels && user.hotels.length === 1) hotelIdToImport = user.hotels[0].id;
      else throw new Error("Falla de Asignación. Aura requiere que especifiques a qué Hub/Hotel pertenece este batallón de Staff.");
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.getWorksheet(1);
  if (!worksheet) throw new Error("Libro de cálculo inválido");

  const validNameHeaders = ['nombre', 'nombre completo', 'empleado'];
  let headerRowNumber = 0;
  const headerMap: any = {};

  for (let i = 1; i <= 10; i++) {
      const row = worksheet.getRow(i);
      let found = false;
      row.eachCell((cell: any) => {
          if (validNameHeaders.includes(cleanLower(cell.value))) found = true;
      });

      if (found) {
          headerRowNumber = i;
          row.eachCell((cell: any, colNumber: number) => {
              headerMap[cleanLower(cell.value)] = colNumber;
          });
          break;
      }
  }

  if (headerRowNumber === 0) throw new Error("Aura Core Rejected: No se encontró la columna Raíz ('Nombre').");

  const activeAreas = await db.query.areas.findMany({
      where: and(isNull(areas.deletedAt), eq(areas.hotelId, hotelIdToImport)),
      with: { departamento: true }
  });

  const areaMap = new Map(activeAreas.map(a => [`${cleanLower(a.nombre)}|${cleanLower(a.departamento?.nombre)}`, a.id]));

  const usersToCreate: any[] = [];
  worksheet.eachRow((row: any, rowNumber: number) => {
    if (rowNumber <= headerRowNumber) return; 

    const rowData = extractRowData(row, headerMap);
    if (!rowData.nombre) return; 

    let areaId = null;
    if (rowData.areaNombre && rowData.deptoNombre) {
        areaId = areaMap.get(`${cleanLower(rowData.areaNombre)}|${cleanLower(rowData.deptoNombre)}`);
        if (!areaId) {
            const foundA = activeAreas.filter(a => cleanLower(a.nombre) === cleanLower(rowData.areaNombre));
            if (foundA.length === 1) areaId = foundA[0].id;
        }
    }

    usersToCreate.push({
      nombre: rowData.nombre,
      correo: rowData.correo,
      areaId,
      usuario_login: rowData.usuario_login,
      es_jefe_de_area: rowData.es_jefe_de_area,
      hotelId: hotelIdToImport
    });
  });

  if (usersToCreate.length === 0) throw new Error("Sábana sin registros activos.");

  let successCount = 0;
  const errors = [];

  for (const u of usersToCreate) {
      try {
          const existing = await db.query.staff.findFirst({
              where: and(eq(staff.nombre, u.nombre), eq(staff.hotelId, hotelIdToImport))
          });

          if (!existing) {
              await db.insert(staff).values(u);
          } else {
              await db.update(staff).set({ ...u, deletedAt: null }).where(eq(staff.id, existing.id));
          }
          successCount++;
      } catch (err: any) {
          errors.push(`Interrupción en '${u.nombre}': ${err.message}`);
      }
  }

  if (successCount > 0) {
      await auditService.logActivity({
          action: 'IMPORT',
          entity: 'Staff',
          entityId: 0,
          details: `Importación Masiva de Staff: ${successCount} Activos asignados al Hub/Hotel ${hotelIdToImport}.`,
          user: user
      });
  }

  return { successCount, errors };
};
