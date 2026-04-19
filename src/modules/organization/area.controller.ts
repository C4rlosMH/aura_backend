import { Request, Response, NextFunction } from "express";
import * as areaService from "./area.service";

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const getAreas = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = (req.query.sortBy as string) || "nombre";
    const order = (req.query.order as "asc"|"desc") || "asc";
    const skip = (page - 1) * limit;

    if (isNaN(limit) || limit === 0 || req.query.limit === undefined || req.query.limit === '0') {
        const areas = await areaService.getAllAreas(req.user); 
        return res.json(areas);
    }
    
    const { areas, totalCount } = await areaService.getAreas({ skip, take: limit, sortBy, order }, req.user);

    res.json({ data: areas, totalCount: totalCount, currentPage: page, totalPages: Math.ceil(totalCount / limit) });
  } catch (error) { 
    next(error); 
  }
};

export const getArea = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const area = await areaService.getAreaById(String(req.params.id), req.user);
    if (!area) return res.status(404).json({ message: "Area not found" });
    res.json(area);
  } catch (error) { 
    next(error); 
  }
};

export const createArea = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const area = await areaService.createArea(req.body, req.user);
    res.status(201).json(area);
  } catch (error) {
    next(error);
  }
};

export const updateArea = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const area = await areaService.updateArea(String(req.params.id), req.body, req.user);
    res.json(area);
  } catch (error) {
    next(error);
  }
};

export const deleteArea = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await areaService.deleteArea(String(req.params.id), req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
