import { Router } from "express";
import * as siteController from "./site.controller";
import { authenticateJWT, verifyRole } from "../../middlewares/auth.middleware.js";
import { validateId } from "../../core/middlewares/validateHelper";

const router = Router();

router.use(authenticateJWT);

router.get("/available", siteController.getAvailableSites);
router.get("/all", verifyRole(['AURA_ROOT', 'AURA_SUPPORT']), siteController.getAllSitesAdmin);
router.post("/", verifyRole(['AURA_ROOT']), siteController.createSite);
router.put("/:id", validateId, siteController.updateSite);
router.delete("/:id", validateId, verifyRole(['AURA_ROOT']), siteController.deleteSite);

export default router;
