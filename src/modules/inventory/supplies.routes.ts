import { Router } from "express";
import { createSupply, getSuppliesBySite, addStock, consumeStock } from "./supplies.controller";
import { authenticateJWT, verifyRole } from "../../middlewares/auth.middleware";
import { ROLES } from "../../config/constants.js";

const router = Router();
router.use(authenticateJWT);

// Roles para MODIFICAR (Editores + Support)
const canModifySupplies = [
    ROLES.AURA_ROOT, ROLES.CORP_ADMIN, ROLES.SITE_ADMIN, 
    ROLES.SITE_STAFF, ROLES.SITE_AUX, ROLES.AURA_SUPPORT
];

// Roles para VER (Editores + Lectores)
const canReadSupplies = [
    ROLES.AURA_ROOT, ROLES.CORP_ADMIN, ROLES.SITE_ADMIN, 
    ROLES.SITE_STAFF, ROLES.SITE_AUX, ROLES.CORP_VIEWER, ROLES.SITE_GUEST
];

router.post("/", verifyRole(canModifySupplies), createSupply);
router.get("/site/:siteId", verifyRole(canReadSupplies), getSuppliesBySite);
router.post("/:id/add", verifyRole(canModifySupplies), addStock);
router.post("/:id/consume", verifyRole(canModifySupplies), consumeStock);

export default router;