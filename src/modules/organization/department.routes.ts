import { Router } from "express";
import * as departmentController from "./department.controller";
import { authenticateJWT } from "../../middlewares/auth.middleware.js";
import { validateId } from "../../core/middlewares/validateHelper";

const router = Router();

router.use(authenticateJWT);

router.get("/", departmentController.getDepartments);
router.get("/:id", validateId, departmentController.getDepartment);
router.post("/", departmentController.createDepartment);
router.put("/:id", validateId, departmentController.updateDepartment);
router.delete("/:id", validateId, departmentController.deleteDepartment);

export default router;
