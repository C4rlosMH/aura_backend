import { Router } from "express";
import * as deviceController from "./device.controller";
import { verifyRole, authenticateJWT } from "../../middlewares/auth.middleware";
import { ROLES } from "../../config/constants.js";
import { validateId } from "../../core/middlewares/validateHelper";

const router = Router();

// 🔐 Definición de grupos de acceso consistentes
const READ_ALL = [ROLES.AURA_ROOT, ROLES.SITE_ADMIN, ROLES.AURA_SUPPORT, ROLES.SITE_STAFF];
const EDIT_ACCESS = [ROLES.AURA_ROOT, ROLES.SITE_ADMIN];

// Para el mapa, permitimos que técnicos (SITE_AUX) y Corp también puedan mover equipos
const MAP_ACCESS = [ROLES.AURA_ROOT, ROLES.CORP_ADMIN, ROLES.SITE_ADMIN, ROLES.SITE_AUX];

router.use(authenticateJWT);

// --- Operaciones Estándar de Inventario ---
router.get("/get", verifyRole(READ_ALL), deviceController.getDevices);
router.get("/get/:id", validateId, verifyRole(READ_ALL), deviceController.getDevice);
router.post("/post", verifyRole(EDIT_ACCESS), deviceController.createDevice);
router.put("/put/:id", validateId, verifyRole(EDIT_ACCESS), deviceController.updateDevice);
router.delete("/delete/:id", validateId, verifyRole(EDIT_ACCESS), deviceController.deleteDevice);

// --- Operación de Espejo Digital (Drag & Drop) ---
// Usamos el prefijo /patch/ para mantener la consistencia con tu estructura actual
router.patch("/patch/:id/position", 
    validateId, 
    verifyRole(MAP_ACCESS), 
    deviceController.updatePosition
);

export default router;