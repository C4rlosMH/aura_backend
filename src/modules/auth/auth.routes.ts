import { Router } from "express";
import * as authController from "./auth.controller";
import { authenticateJWT, verifyRole } from "../../middlewares/auth.middleware";
import { validateId } from "../../core/middlewares/validateHelper";

const router = Router();

// Rutas Públicas (No requieren Token de Aura)
router.post("/login", authController.login);

// Middlewares Globales
router.use(authenticateJWT);

// Rutas Protegidas
router.get("/", authController.getUsers);
router.get("/export", verifyRole(['AURA_ROOT', 'AURA_SUPPORT', 'HOTEL_ADMIN']), authController.exportSystemUsers);
router.get("/:id", validateId, authController.getUser);

// Solo ROOT o ADMIN pueden crear usuarios en Aura
router.post("/", verifyRole(['AURA_ROOT', 'HOTEL_ADMIN']), authController.createUser);

router.put("/:id/password", validateId, authController.updatePassword);

router.put("/:id", validateId, verifyRole(['AURA_ROOT', 'HOTEL_ADMIN']), authController.updateUserController);

// Solo ROOT o CORP pueden eliminar cuentas enteras
router.delete("/:id", validateId, verifyRole(['AURA_ROOT', 'AURA_SUPPORT']), authController.deleteUser);

export default router;
