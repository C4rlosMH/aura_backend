import { Request, Response, NextFunction } from "express";
import { db } from "../../core/database";
import { deviceType, deviceStatus, operatingSystem } from "./inventory.model";
import { eq, isNull } from "drizzle-orm";

export const getDeviceTypes = async (req: Request, res: Response, next: NextFunction) => {
   try { const list = await db.query.deviceType.findMany();; res.json(list); } catch (e) { next(e); }
};
export const getDeviceStatuses = async (req: Request, res: Response, next: NextFunction) => {
   try { const list = await db.query.deviceStatus.findMany({ where: isNull(deviceStatus.deletedAt) }); res.json(list); } catch (e) { next(e); }
};
export const getOperatingSystems = async (req: Request, res: Response, next: NextFunction) => {
   try { const list = await db.query.operatingSystem.findMany({ where: isNull(operatingSystem.deletedAt) }); res.json(list); } catch (e) { next(e); }
};
