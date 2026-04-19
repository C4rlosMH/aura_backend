import { Router } from "express";
import { getDisposals, getDisposal, updateDisposal, deleteDisposal, exportDisposalsExcel } from "./disposal.controller";
import { verifyRole, authenticateJWT } from "../../middlewares/auth.middleware";
import { ROLES } from "../../config/constants.js";
import { validateId } from "../../core/middlewares/validateHelper";

const router = Router();
const READ_ALL = [ROLES.AURA_ROOT, ROLES.HOTEL_ADMIN, ROLES.AURA_SUPPORT, ROLES.AURA_SUPPORT];
const EDIT_ACCESS = [ROLES.AURA_ROOT, ROLES.HOTEL_ADMIN, ROLES.AURA_SUPPORT];
const ADMIN_ONLY = [ROLES.AURA_ROOT, ROLES.HOTEL_ADMIN];

router.use(authenticateJWT);

router.get("/get", verifyRole(READ_ALL), getDisposals);
router.get("/get/:id", validateId, verifyRole(READ_ALL), getDisposal);
router.put("/put/:id", validateId, verifyRole(EDIT_ACCESS), updateDisposal);
router.delete("/delete/:id", validateId, verifyRole(ADMIN_ONLY), deleteDisposal);
router.get("/export/excel", verifyRole(READ_ALL), exportDisposalsExcel);

export default router;
