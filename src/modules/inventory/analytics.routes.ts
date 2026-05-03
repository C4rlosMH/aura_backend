import { Router } from "express";
import { getDeviceFinancials, getSiteAssetsValue } from "./analytics.controller";
import { authenticateJWT, verifyRole } from "../../middlewares/auth.middleware";
import { ROLES } from "../../config/constants.js";

const router = Router();
router.use(authenticateJWT);

// LECTURA DE DATOS FINANCIEROS (Editores + Lectores)
// Support queda fuera porque "no puede ver los datos"
const canReadFinancials = [
    ROLES.AURA_ROOT, ROLES.CORP_ADMIN, ROLES.SITE_ADMIN, 
    ROLES.SITE_STAFF, ROLES.SITE_AUX, ROLES.CORP_VIEWER, ROLES.SITE_GUEST
];

router.get("/device/:id", verifyRole(canReadFinancials), getDeviceFinancials);
router.get("/site/:siteId/value", verifyRole(canReadFinancials), getSiteAssetsValue);

export default router;