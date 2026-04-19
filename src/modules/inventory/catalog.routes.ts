import { Router } from "express";
import * as catalogController from "./catalog.controller";
import { authenticateJWT } from "../../middlewares/auth.middleware";

const router = Router();
router.use(authenticateJWT);

router.get("/types", catalogController.getDeviceTypes);
router.get("/statuses", catalogController.getDeviceStatuses);
router.get("/operating-systems", catalogController.getOperatingSystems);

export default router;
