import { Response, NextFunction } from "express";
import * as auditService from "./audit.service";
import { AuthRequest } from "../auth/auth.types";

export const getAuditLogs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const { entity, userId, hotelId } = req.query;

    const { logs, totalCount } = await auditService.getAuditLogs({ skip, take: limit, entity, userId, hotelId }, req.user!);

    res.json({ data: logs, totalCount, currentPage: page, totalPages: Math.ceil(totalCount / limit) });
  } catch (error) { next(error); }
};
