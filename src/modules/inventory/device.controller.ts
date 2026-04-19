import { Response, NextFunction } from "express";
import * as deviceService from "./device.service";
import { AuthRequest } from "../auth/auth.types";

export const getDevices = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const typeIds = req.query.typeIds ? String(req.query.typeIds).split(',').map(Number) : undefined;

    const { devices, totalCount } = await deviceService.getActiveDevices({
        skip, take: limit, search: req.query.search as string, filter: req.query.filter as string, sortBy: req.query.sortBy as string, order: req.query.order as "asc" | "desc", typeIds
    }, req.user!);

    res.json({
      data: devices,
      totalCount: totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) { next(error); }
};

export const getDevice = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const device = await deviceService.getDeviceById(String(req.params.id), req.user!); 
    if (!device) return res.status(404).json({ error: "Dispositivo no localizado en tu entorno Aura." });
    res.json(device);
  } catch (error) { next(error); }
};

export const createDevice = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const device = await deviceService.createDevice(req.body, req.user!);
    res.status(201).json(device);
  } catch (error: any) { res.status(400).json({ error: error.message }); }
};

export const updateDevice = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const device = await deviceService.updateDevice(String(req.params.id), req.body, req.user!);
    res.json(device);
  } catch (error: any) { res.status(400).json({ error: error.message }); }
};

export const deleteDevice = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const r = await deviceService.deleteDevice(String(req.params.id), req.user!);
    res.json(r);
  } catch (error: any) { res.status(400).json({ error: error.message }); }
};
