import { Response, NextFunction } from "express";
import * as staffService from "./staff.service";
import ExcelJS from "exceljs";
import { AuthRequest } from "../auth/auth.types";

export const getStaff = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limitParam = req.query.limit as string; 
    const limit = (limitParam === '0') ? 0 : (parseInt(limitParam) || 10);
    
    const sortBy = (req.query.sortBy as string) || "nombre";
    const order = (req.query.order as "asc"|"desc") || "asc";
    const skip = (page - 1) * limit;

    if (limit === 0) {
        const { users } = await staffService.getStaffMembers({ 
            skip: 0, 
            sortBy, 
            order 
        }, req.user!);
        return res.json(users);
    }

    const { users, totalCount } = await staffService.getStaffMembers({ 
        skip, 
        take: limit, 
        search: req.query.search as string, 
        sortBy, 
        order 
    }, req.user!);

    res.json({
      data: users,
      totalCount: totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    next(error);
  }
};

export const getAllStaff = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const users = await staffService.getAllStaff(req.user!); 
    res.json(users); 
  } catch (error) {
    next(error);
  }
};

export const getStaffMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await staffService.getStaffById(String(req.params.id), req.user!);
    if (!user) return res.status(404).json({ message: "Staff not found or access denied in Aura" });
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const createStaff = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await staffService.createStaff(req.body, req.user!);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

export const updateStaff = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await staffService.updateStaff(String(req.params.id), req.body, req.user!);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const deleteStaff = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await staffService.deleteStaff(String(req.params.id), req.user!);
    res.json({ message: "Staff archived correctly in Aura" });
  } catch (error) {
    next(error);
  }
};

export const exportStaff = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { users } = await staffService.getStaffMembers({ skip: 0 }, req.user!); 
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Aura Staff Roster");
    
    worksheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Nombre", key: "nombre", width: 30 },
      { header: "Correo", key: "correo", width: 30 },
      { header: "Área", key: "area", width: 25 },          
      { header: "Departamento", key: "departamento", width: 25 },
      { header: "Login Alias", key: "usuario_login", width: 20 },
    ];

    users.forEach((u: any) => {
      worksheet.addRow({
        id: u.id,
        nombre: u.nombre,
        correo: u.correo,
        area: u.area?.nombre || "N/A", 
        departamento: u.area?.departamento?.nombre || "N/A",
        usuario_login: u.usuario_login || "N/A",
      });
    });

    worksheet.getRow(1).font = { bold: true };
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=aura_staff.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

export const importStaff = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No payload injected" });

      const targetSiteId = req.body.siteId ? Number(req.body.siteId) : null;

      const result = await staffService.importStaffFromExcel(req.file.buffer, req.user!, targetSiteId);
      res.json(result);
    } catch (error) {
      next(error);
    }
};
