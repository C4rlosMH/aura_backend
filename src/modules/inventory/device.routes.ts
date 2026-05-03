import { Router } from "express";
import * as deviceController from "./device.controller";
import { verifyRole, authenticateJWT } from "../../middlewares/auth.middleware";
import { ROLES } from "../../config/constants.js";
import { validateId } from "../../core/middlewares/validateHelper";

const router = Router();
const READ_ALL = [ROLES.AURA_ROOT, ROLES.SITE_ADMIN, ROLES.AURA_SUPPORT, ROLES.SITE_STAFF];
const EDIT_ACCESS = [ROLES.AURA_ROOT, ROLES.SITE_ADMIN];

router.use(authenticateJWT);

router.get("/get", verifyRole(READ_ALL), deviceController.getDevices);
router.get("/get/:id", validateId, verifyRole(READ_ALL), deviceController.getDevice);
router.post("/post", verifyRole(EDIT_ACCESS), deviceController.createDevice);
router.put("/put/:id", validateId, verifyRole(EDIT_ACCESS), deviceController.updateDevice);
router.delete("/delete/:id", validateId, verifyRole(EDIT_ACCESS), deviceController.deleteDevice);

export default router;
