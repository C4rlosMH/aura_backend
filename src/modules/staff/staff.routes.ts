import { Router } from "express";
import multer from "multer";
import * as staffController from "./staff.controller";
import { verifyRole, authenticateJWT } from "../../middlewares/auth.middleware";
import { ROLES } from "../../config/constants.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const READ_ALL = [ROLES.AURA_ROOT, ROLES.HOTEL_ADMIN, ROLES.AURA_SUPPORT, ROLES.AURA_SUPPORT, ROLES.HOTEL_STAFF];
const EDIT_ACCESS = [ROLES.AURA_ROOT, ROLES.HOTEL_ADMIN, ROLES.AURA_SUPPORT];

router.use(authenticateJWT);

router.get("/get", verifyRole(READ_ALL), staffController.getStaff);
router.get("/get/all", verifyRole(READ_ALL), staffController.getAllStaff);
router.get("/get/:id", verifyRole(READ_ALL), staffController.getStaffMember);

router.post("/post", verifyRole(EDIT_ACCESS), staffController.createStaff);
router.put("/put/:id", verifyRole(EDIT_ACCESS), staffController.updateStaff);
router.delete("/delete/:id", verifyRole(EDIT_ACCESS), staffController.deleteStaff);

router.get("/export/all", verifyRole(EDIT_ACCESS), staffController.exportStaff);
router.post("/import", verifyRole([ROLES.AURA_ROOT, ROLES.HOTEL_ADMIN]), upload.single("file"), staffController.importStaff);

export default router;
