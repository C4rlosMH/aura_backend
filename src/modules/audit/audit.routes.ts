import { Router } from "express";
import { getAuditLogs } from "./audit.controller";
import { verifyRole, authenticateJWT } from "../../middlewares/auth.middleware";
import { ROLES } from "../../config/constants.js";

const router = Router();
router.use(authenticateJWT);
router.get("/get", verifyRole([ROLES.AURA_ROOT, ROLES.HOTEL_ADMIN, ROLES.AURA_SUPPORT]), getAuditLogs);
export default router;
