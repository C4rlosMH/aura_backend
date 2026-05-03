import { Router } from "express";
import { getDeviceFinancials, getSiteAssetsValue } from "./analytics.controller";

const router = Router();

// Reporte de TCO de un equipo específico
router.get("/device/:id", getDeviceFinancials);

// Valor total del inventario de un sitio
router.get("/site/:siteId/value", getSiteAssetsValue);

export default router;