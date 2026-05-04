import pkg from "node-machine-id";
const { machineIdSync } = pkg;
import { db } from "../database";
import { licenses } from "./license.model"; // <-- CORREGIDO: Importamos 'licenses'
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
    // CORREGIDO: db.query.licenses
    const license = await db.query.licenses.findFirst({
        where: eq(licenses.hardwareFingerprint, hwid) // CORREGIDO: hardwareFingerprint
    });

    // CORREGIDO: licenseKey
    if (!license || !license.isActive || !license.licenseKey) {
        return false;
    }

    // CORREGIDO: expiresAt
    if (license.expiresAt && new Date() > license.expiresAt) {
        return false; 
    }

    return true;
}

export const activateAura = async (activationKey: string) => {
    const hwid = getMachineId();
    
    // Simulate external verification
    if (activationKey.startsWith("AURA-KEY-")) {
       
       const existing = await db.query.licenses.findFirst({ 
           where: eq(licenses.hardwareFingerprint, hwid) 
       });

       let expires = new Date();
       expires.setFullYear(expires.getFullYear() + 1); // 1 año de licencia

       if (!existing) {
           await db.insert(licenses).values({
               id: crypto.randomUUID(), // <-- AÑADIDO: Tu modelo pide un varchar(36) para el PK
               clientName: "Cliente Default Aura", // <-- AÑADIDO: Tu modelo lo marca como notNull()
               licenseKey: activationKey, // <-- CORREGIDO
               hardwareFingerprint: hwid, // <-- CORREGIDO
               isActive: true,
               expiresAt: expires // <-- CORREGIDO
               // createdAt y updatedAt se llenan solos por el default() en el modelo
           });
       } else {
           await db.update(licenses).set({
               licenseKey: activationKey,
               isActive: true,
               expiresAt: expires
           }).where(eq(licenses.id, existing.id));
       }

       return { success: true, message: "Instancia de Aura activada y blindada con éxito." };
    }

    throw new Error("Clave de activación inválida o rechazada por los servidores de Aura.");
};