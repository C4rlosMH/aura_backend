import { Response, NextFunction } from "express";
import * as maintenanceService from "./maintenance.service";
import { AuthRequest } from "../auth/auth.types";

export const getMaintenances = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const { maintenances, totalCount } = await maintenanceService.getMaintenances({ skip, take: limit, sortBy: req.query.sortBy as string, order: req.query.order as string }, req.user!);
    res.json({ data: maintenances, totalCount, currentPage: page, totalPages: Math.ceil(totalCount / limit) });
  } catch (error) { next(error); }
};

export const getMaintenance = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const m = await maintenanceService.getMaintenanceById(String(req.params.id), req.user!);
    if (!m) return res.status(404).json({ error: "No encontrado" });
    res.json(m);
  } catch (error) { next(error); }
};

export const createMaintenance = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { res.status(201).json(await maintenanceService.createMaintenance(req.body, req.user!)); } catch (e: any) { res.status(400).json({ error: e.message }); }
};

export const updateMaintenance = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { res.json(await maintenanceService.updateMaintenance(String(req.params.id), req.body, req.user!)); } catch (e: any) { res.status(400).json({ error: e.message }); }
};

export const deleteMaintenance = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { res.json(await maintenanceService.deleteMaintenance(String(req.params.id), req.user!)); } catch (e: any) { res.status(400).json({ error: e.message }); }
};
