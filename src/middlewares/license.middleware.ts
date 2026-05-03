/* import { Request, Response, NextFunction } from "express";
import { validateLicenseLocally } from "../core/security/license.service";

let cachedValidationStatus: { isValid: boolean, lastChecked: number } | null = null;
const CACHE_TTL_MS = 1000 * 60 * 5; // Rechequear base de datos cada 5 minutos 

export const licenseGuard = async (req: Request, res: Response, next: NextFunction) => {
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
        const isValid = await validateLicenseLocally();
        cachedValidationStatus = { isValid, lastChecked: now };

        if (!isValid) {
            return res.status(402).json({ error: "AURA_PAYMENT_REQUIRED", message: "Aura no está activado o la licencia expiró. Contacta al integrador corporativo." });
        }

        next();
    } catch (e) {
        console.error("Fallo general en validación de Licensing Aura:", e);
        return res.status(402).json({ error: "AURA_LICENSE_ERROR", message: "Fallo crítico al validar el Aura Heartbeat." });
    }
}
 */

import { Request, Response, NextFunction } from "express";
import { isHardwareAuthorized } from "../core/security/hardware.service";

export const verifyHardwareLock = (req: Request, res: Response, next: NextFunction) => {
    // 1. Permitimos saltar la licencia si el desarrollador lo necesita (ej. AURA_SKIP_LICENSE=true)
    if (process.env.AURA_SKIP_LICENSE === 'true') {
        return next();
    }

    const authorizedId = process.env.AURA_AUTHORIZED_MACHINE_ID;

    // 2. Si el servidor no tiene una llave instalada, el sistema no arranca
    if (!authorizedId) {
        console.error("🚨 ERROR: No se encontró AURA_AUTHORIZED_MACHINE_ID en las variables de entorno.");
        return res.status(500).json({
            error: "LICENSE_MISSING",
            message: "Falta la llave de licencia corporativa en este servidor."
        });
    }

    // 3. LA VERIFICACIÓN DE HIERRO: ¿Coincide el hardware actual con la llave?
    if (!isHardwareAuthorized(authorizedId)) {
        console.error(`🚨 ALERTA DE SEGURIDAD: Intento de piratería detectado. Hardware no reconocido.`);
        return res.status(403).json({
            error: "UNAUTHORIZED_HARDWARE",
            message: "La licencia de Aura no es válida para este servidor físico. El sistema ha sido bloqueado por razones de seguridad."
        });
    }

    // 4. Todo en orden, el servidor es legítimo. Pasa a la siguiente función.
    next();
};