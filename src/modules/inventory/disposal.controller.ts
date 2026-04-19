import { Response, NextFunction } from "express";
import * as disposalService from "./disposal.service";
import * as deviceService from "./device.service";
import ExcelJS from "exceljs";
import { AuthRequest } from "../auth/auth.types";

export const getDisposals = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || ""; 
    const skip = (page - 1) * limit;

    const { devices, totalCount } = await disposalService.getInactiveDevices({ skip, take: limit, search }, req.user!);
    
    res.json({
      data: devices,
      totalCount: totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) { next(error); }
};

export const getDisposal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const disposal = await deviceService.getDeviceById(String(req.params.id), req.user!); 
    if (!disposal) return res.status(404).json({ error: "Baja no encontrada o sin permisos en tu Aura Tenant" });
    res.json(disposal);
  } catch (error) { next(error); }
};

export const updateDisposal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const oldDisposal = await deviceService.getDeviceById(String(req.params.id), req.user!);
    if (!oldDisposal) return res.status(404).json({ message: "Baja no encontrada o sin permisos" });
    
    const dataToUpdate = { motivo_baja: req.body.motivo_baja, observaciones_baja: req.body.observaciones_baja };

    const disposal = await deviceService.updateDevice(String(req.params.id), dataToUpdate, req.user!);
    res.json(disposal);
  } catch (error) { next(error); }
};

export const deleteDisposal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.status(403).json({ error: "Aura Policy: Las bajas no se pueden eliminar. Es un registro histórico inmutable para la auditoría contable." });
  } catch (error) { next(error); }
};

export const exportDisposalsExcel = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { devices } = await disposalService.getInactiveDevices({ skip: 0, take: 999999 }, req.user!); 
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Bajas de Equipos");
    
    worksheet.columns = [
      { header: "No", key: "id", width: 10 },
      { header: "Etiqueta", key: "etiqueta", width: 15 },
      { header: "Nombre Equipo", key: "nombre_equipo", width: 25 },
      { header: "Categoría Lenses", key: "categoria", width: 15 },
      { header: "N° Serie", key: "numero_serie", width: 25 },
      { header: "Marca", key: "marca", width: 15 },
      { header: "Modelo", key: "modelo", width: 20 },
      { header: "Usuario Asignado", key: "usuario_nombre", width: 30 },
      { header: "IP", key: "ip_equipo", width: 15 },
      { header: "Tipo", key: "tipo", width: 20 },
      { header: "Motivo", key: "motivo_baja", width: 40 },
      { header: "Observaciones", key: "observaciones_baja", width: 40 }
    ];

    devices.forEach((d: any) => {
      worksheet.addRow({
        id: d.id,
        etiqueta: d.etiqueta || "N/A",
        nombre_equipo: d.nombre_equipo || "N/A",
        categoria: d.type?.category || "N/A",
        numero_serie: d.numero_serie || "N/A",
        marca: d.marca || "N/A",
        modelo: d.modelo || "N/A",
        usuario_nombre: d.staff?.nombre || "N/A",
        ip_equipo: d.ip_equipo || "N/A",
        tipo: d.type?.nombre || "N/A",
        motivo_baja: d.motivo_baja || "",
        observaciones_baja: d.observaciones_baja || ""
      });
    });
    
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { horizontal: "center" };
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=bajas_aura.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) { next(error); }
};
