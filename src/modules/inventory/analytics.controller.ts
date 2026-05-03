import { Request, Response } from "express";
import * as analyticsService from "./analytics.service";

export const getDeviceFinancials = async (req: Request, res: Response) => {
    try {
        const deviceId = parseInt(req.params.id as string);
        const report = await analyticsService.getDeviceTCO(deviceId);
        res.status(200).json(report);
    } catch (error: any) {
        res.status(500).json({ error: "Error al generar reporte financiero", details: error.message });
    }
};

export const getSiteAssetsValue = async (req: Request, res: Response) => {
    try {
        const siteId = parseInt(req.params.siteId as string);
        const total = await analyticsService.getSiteAssetsValue(siteId);
        res.status(200).json(total);
    } catch (error: any) {
        res.status(500).json({ error: "Error al calcular patrimonio del sitio", details: error.message });
    }
};