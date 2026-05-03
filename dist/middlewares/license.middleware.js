"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.licenseGuard = void 0;
const license_service_1 = require("../core/security/license.service");
let cachedValidationStatus = null;
const CACHE_TTL_MS = 1000 * 60 * 5; // Rechequear base de datos cada 5 minutos 
const licenseGuard = async (req, res, next) => {
    if (process.env.AURA_SKIP_LICENSE === "true") {
        console.log("[Aura Security] 🟢 Bypass activado (Modo Desarrollo)");
        return next();
    }
    // Permitir ruta de activación pasar el candado y login
    if (req.path.includes("/activate") || req.path.includes("/login")) {
        return next();
    }
    const now = Date.now();
    if (cachedValidationStatus && (now - cachedValidationStatus.lastChecked) < CACHE_TTL_MS) {
        if (!cachedValidationStatus.isValid) {
            return res.status(402).json({ error: "AURA_PAYMENT_REQUIRED", message: "Aura no está activado o la licencia expiró. Contacta al integrador corporativo." });
        }
        return next();
    }
    try {
        const isValid = await (0, license_service_1.validateLicenseLocally)();
        cachedValidationStatus = { isValid, lastChecked: now };
        if (!isValid) {
            return res.status(402).json({ error: "AURA_PAYMENT_REQUIRED", message: "Aura no está activado o la licencia expiró. Contacta al integrador corporativo." });
        }
        next();
    }
    catch (e) {
        console.error("Fallo general en validación de Licensing Aura:", e);
        return res.status(402).json({ error: "AURA_LICENSE_ERROR", message: "Fallo crítico al validar el Aura Heartbeat." });
    }
};
exports.licenseGuard = licenseGuard;
