import pkg from "node-machine-id";
const { machineIdSync } = pkg;
import { db } from "../database";
import { auraLicense } from "./license.model";
import { eq } from "drizzle-orm";
import crypto from "crypto";

// Servidor Externo de Validación (Mockeado o Proxy Real)
const AURA_VALIDATION_SERVER = process.env.AURA_VALIDATION_SERVER || "https://aura-license-server.com/api/validate";

export const getMachineId = () => {
    try {
        return machineIdSync();
    } catch {
        return "AURA-VIRTUAL-MACHINE-ID-FALLBACK";
    }
};

export const validateLicenseLocally = async () => {
    const hwid = getMachineId();
    const license = await db.query.auraLicense.findFirst({
        where: eq(auraLicense.machineId, hwid)
    });

    if (!license || !license.isActive || !license.activationToken) {
        return false;
    }

    if (license.expireAt && new Date() > license.expireAt) {
        return false; 
    }

    return true;
}

export const activateAura = async (activationKey: string) => {
    const hwid = getMachineId();
    
    // Simulate external verification
    if (activationKey.startsWith("AURA-KEY-")) {
       const token = crypto.randomBytes(32).toString('hex');
       
       const existing = await db.query.auraLicense.findFirst({ where: eq(auraLicense.machineId, hwid) });

       let expires = new Date();
       expires.setFullYear(expires.getFullYear() + 1); // 1 año de licencia

       if (!existing) {
           await db.insert(auraLicense).values({
               machineId: hwid,
               activationToken: token,
               isActive: true,
               expireAt: expires,
               lastValidatedAt: new Date()
           });
       } else {
           await db.update(auraLicense).set({
               activationToken: token,
               isActive: true,
               expireAt: expires,
               lastValidatedAt: new Date()
           }).where(eq(auraLicense.id, existing.id));
       }

       return { success: true, message: "Instancia de Aura activada y blindada con éxito." };
    }

    throw new Error("Clave de activación inválida o rechazada por los servidores de Aura.");
};
