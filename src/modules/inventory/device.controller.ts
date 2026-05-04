import { Request, Response, NextFunction } from "express";
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

export const updateDevicePosition = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { pos_x, pos_y, rotation, area_id } = req.body;

    // Validación: X y Y deben ser porcentajes entre 0 y 100
    if (pos_x && (parseFloat(pos_x) < 0 || parseFloat(pos_x) > 100)) {
      return res.status(400).json({ error: "La coordenada X está fuera de rango (0-100)" });
    }
    if (pos_y && (parseFloat(pos_y) < 0 || parseFloat(pos_y) > 100)) {
      return res.status(400).json({ error: "La coordenada Y está fuera de rango (0-100)" });
    }

    const device = await deviceService.updatePosition(String(id), {
      pos_x: pos_x !== undefined ? String(pos_x) : null,
      pos_y: pos_y !== undefined ? String(pos_y) : null,
      rotation: rotation || 0,
      area_id: area_id ? Number(area_id) : null
    }, req.user!);

    res.status(200).json({
      message: "Posición actualizada correctamente en el mapa",
      data: device
    });
  } catch (error: any) {
    // Si es un error controlado (ej. no encontrado), mandamos 400, sino lo pasamos al error handler global
    if (error.message.includes("no localizado")) {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

export const updatePosition = async (req: Request, res: Response) => {
  try {
    const deviceId = parseInt(req.params.id as string);
    
    const { pos_x, pos_y, floor } = req.body;

    if (isNaN(deviceId)) {
      return res.status(400).json({ error: "ID de dispositivo inválido" });
    }

    if (pos_x === undefined || pos_y === undefined) {
      return res.status(400).json({ error: "Coordenadas pos_x y pos_y son requeridas." });
    }

    const result = await deviceService.updateDevicePosition(
      deviceId, 
      pos_x.toString(), 
      pos_y.toString(), 
      floor ? parseInt(floor) : 1
    );

    res.status(200).json({
      success: true,
      message: "Posición actualizada en el mapa",
      data: result
    });
  } catch (error: any) {
    res.status(500).json({ error: "Error al mover el equipo", details: error.message });
  }
};