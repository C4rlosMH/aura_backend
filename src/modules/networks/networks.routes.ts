import { Router } from "express";
import { NetworksController } from "./networks.controller";
import { authenticateJWT, verifyRole } from "../../middlewares/auth.middleware"; 
// Opcional: import { ROLES } from "../../config/constants"; si prefieres usar las variables en lugar de strings

const router = Router();
const networksController = new NetworksController();

// 1. Middleware Global: Exige que el usuario tenga un token válido en TODA la ruta
router.use(authenticateJWT);

// 2. Crear una nueva VLAN / Segmento
// POST /api/networks/vlans
// Operación crítica (Infraestructura Core): Solo Administradores
router.post(
    "/vlans", 
    verifyRole(['AURA_ROOT', 'CORP_ADMIN', 'SITE_ADMIN']), 
    networksController.createVlan
);

// 3. Asignar una IP a un dispositivo
// POST /api/networks/assign-ip
// Operación diaria: Se incluye a los Auxiliares/Técnicos (SITE_AUX)
router.post(
    "/assign-ip", 
    verifyRole(['AURA_ROOT', 'AURA_SUPPORT', 'CORP_ADMIN', 'SITE_ADMIN', 'SITE_AUX']), 
    networksController.assignIp
);

// 4. El Copiloto: Sugerir IP libre
// GET /api/networks/vlans/:vlanId/suggest
// Operación diaria: Mismos permisos que asignar
router.get(
    "/vlans/:vlanId/suggest", 
    verifyRole(['AURA_ROOT', 'AURA_SUPPORT', 'CORP_ADMIN', 'SITE_ADMIN', 'SITE_AUX']), 
    networksController.suggestIp
);

// 5. Obtener todas las IPs ocupadas en un Hotel/Sitio
// GET /api/networks/sites/:siteId/ips
// Acceso de lectura: Se añaden los visores (CORP_VIEWER y SITE_STAFF si es necesario)
router.get(
    "/sites/:siteId/ips", 
    verifyRole([
        'AURA_ROOT', 
        'AURA_SUPPORT', 
        'CORP_ADMIN', 
        'CORP_VIEWER', 
        'SITE_ADMIN', 
        'SITE_AUX',
        'SITE_STAFF' // Opcional, dependiendo de si quieres que el staff normal vea la red
    ]), 
    networksController.getIpsBySite
);

export default router;