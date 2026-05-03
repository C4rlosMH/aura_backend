import { Request, Response, NextFunction } from "express";
import * as siteService from "./site.service";
import { ROLES } from "../../config/constants.js";

// Add typed user to Request inline for simplicity
interface AuthenticatedRequest extends Request {
  user?: any;
}

export const getAvailableSites = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (user.rol === ROLES.AURA_ROOT || user.rol === ROLES.AURA_SUPPORT) {
      const sites = await siteService.getAllSites(user);
      return res.json(sites.map(h => ({ id: h.id, nombre: h.nombre, codigo: h.codigo })));
    }
    if (user.sites && user.sites.length > 0) {
        return res.json(user.sites);
    }
    return res.json([]);
  } catch (error) {
    next(error);
  }
};

export const getAllSitesAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const sites = await siteService.getAllSites(req.user);
        res.json(sites);
    } catch (error) { 
        console.error("Error en getAllSitesAdmin:", error);
        next(error); 
    }
};

export const createSite = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const site = await siteService.createSite(req.body, req.user);
        res.status(201).json(site);
    } catch (error) { next(error); }
};

export const updateSite = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const site = await siteService.updateSite(String(req.params.id), req.body, req.user);
        res.json(site);
    } catch (error) { next(error); }
};

export const deleteSite = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        await siteService.deleteSite(String(req.params.id), req.user);
        res.json({ message: "Site eliminado correctamente" });
    } catch (error) { next(error); }
};
