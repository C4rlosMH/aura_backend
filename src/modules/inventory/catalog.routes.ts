import { Router } from "express";
import * as catalogController from "./catalog.controller";
import { authenticateJWT, verifyRole } from "../../middlewares/auth.middleware";
import { ROLES } from "../../config/constants.js";

const router = Router();
router.use(authenticateJWT);

// LECTURA DE CATÁLOGOS (Editores + Lectores)
const canReadCatalog = [
    ROLES.AURA_ROOT, ROLES.CORP_ADMIN, ROLES.SITE_ADMIN, 
    ROLES.SITE_STAFF, ROLES.SITE_AUX, ROLES.CORP_VIEWER, ROLES.SITE_GUEST
];

router.get("/types", verifyRole(canReadCatalog), catalogController.getDeviceTypes);
router.get("/statuses", verifyRole(canReadCatalog), catalogController.getDeviceStatuses);
router.get("/operating-systems", verifyRole(canReadCatalog), catalogController.getOperatingSystems);

export default router;