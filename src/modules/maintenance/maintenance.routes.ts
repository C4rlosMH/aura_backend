import { Router } from "express";
import * as maintenanceController from "./maintenance.controller";
import { verifyRole, authenticateJWT } from "../../middlewares/auth.middleware";
import { ROLES } from "../../config/constants.js";
import { validateId } from "../../core/middlewares/validateHelper";

const router = Router();
const READ_ALL = [ROLES.AURA_ROOT, ROLES.HOTEL_ADMIN, ROLES.AURA_SUPPORT, ROLES.HOTEL_STAFF];
const EDIT_ACCESS = [ROLES.AURA_ROOT, ROLES.HOTEL_ADMIN, ROLES.HOTEL_STAFF];

router.use(authenticateJWT);
router.get("/get", verifyRole(READ_ALL), maintenanceController.getMaintenances);
router.get("/get/:id", validateId, verifyRole(READ_ALL), maintenanceController.getMaintenance);
router.post("/post", verifyRole(EDIT_ACCESS), maintenanceController.createMaintenance);
router.put("/put/:id", validateId, verifyRole(EDIT_ACCESS), maintenanceController.updateMaintenance);
router.delete("/delete/:id", validateId, verifyRole([ROLES.AURA_ROOT, ROLES.HOTEL_ADMIN]), maintenanceController.deleteMaintenance);
export default router;
