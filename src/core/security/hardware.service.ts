import pkg from 'node-machine-id';
import { createHash } from 'crypto';

// Extraemos la función del paquete importado por defecto
const { machineIdSync } = pkg;

/**
 * Genera una huella digital única (Fingerprint) del servidor físico.
 */
export const getMachineFingerprint = (): string => {
    try {
        // 1. Extraemos el UUID de la tarjeta madre/procesador
        const rawId = machineIdSync();

        // 2. Sal secreta de MirandaNet
        const secretSalt = "Aura_System_Security_AHG_2026_VPN";

        // 3. Generamos el Hash SHA-256
        return createHash('sha256')
            .update(rawId + secretSalt)
            .digest('hex');
    } catch (error) {
        console.error("🚨 Error al leer el hardware del servidor:", error);
        throw new Error("HARDWARE_READ_FAILED");
    }
};

/**
 * Compara la huella digital actual del servidor con la autorizada.
 */
export const isHardwareAuthorized = (authorizedFingerprint: string): boolean => {
    try {
        const currentFingerprint = getMachineFingerprint();
        return currentFingerprint === authorizedFingerprint;
    } catch {
        return false;
    }
};