import { Router } from "express";
import * as licenseController from "./license.controller";
import { authenticateJWT, verifyRole } from "../../middlewares/auth.middleware";
import { ROLES } from "../../config/constants";

const router = Router();

// Endpoint ultra-restringido para el núcleo de Aura Core (Director de Sistemas/CORP_ADMIN no entra aquí)
router.post("/activate", authenticateJWT, verifyRole([ROLES.AURA_ROOT]), licenseController.activateLicense as any);

export default router;
