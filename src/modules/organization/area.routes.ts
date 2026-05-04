import { Router } from "express";
import * as areaController from "./area.controller";
import { authenticateJWT } from "../../middlewares/auth.middleware.js";
import { validateId } from "../../core/middlewares/validateHelper";
import { uploadMap } from "../../core/middlewares/upload.middleware";

const router = Router();

router.use(authenticateJWT);

router.get("/", areaController.getAreas);
router.get("/:id", validateId, areaController.getArea);
router.post("/", areaController.createArea);
router.put("/:id", validateId, areaController.updateArea);
router.delete("/:id", validateId, areaController.deleteArea);

router.patch("/:id/map", validateId, uploadMap.single('map_image'), areaController.uploadAreaMap);

export default router;
