"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activateAura = exports.validateLicenseLocally = exports.getMachineId = void 0;
const node_machine_id_1 = __importDefault(require("node-machine-id"));
const { machineIdSync } = node_machine_id_1.default;
const database_1 = require("../database");
const license_model_1 = require("./license.model");
const drizzle_orm_1 = require("drizzle-orm");
const crypto_1 = __importDefault(require("crypto"));
// Servidor Externo de Validación (Mockeado o Proxy Real)
const AURA_VALIDATION_SERVER = process.env.AURA_VALIDATION_SERVER || "https://aura-license-server.com/api/validate";
const getMachineId = () => {
    try {
        return machineIdSync();
    }
    catch {
        return "AURA-VIRTUAL-MACHINE-ID-FALLBACK";
    }
};
exports.getMachineId = getMachineId;
const validateLicenseLocally = async () => {
    const hwid = (0, exports.getMachineId)();
    const license = await database_1.db.query.auraLicense.findFirst({
        where: (0, drizzle_orm_1.eq)(license_model_1.auraLicense.machineId, hwid)
    });
    if (!license || !license.isActive || !license.activationToken) {
        return false;
    }
    if (license.expireAt && new Date() > license.expireAt) {
        return false;
    }
    return true;
};
exports.validateLicenseLocally = validateLicenseLocally;
const activateAura = async (activationKey) => {
    const hwid = (0, exports.getMachineId)();
    // Simulate external verification
    if (activationKey.startsWith("AURA-KEY-")) {
        const token = crypto_1.default.randomBytes(32).toString('hex');
        const existing = await database_1.db.query.auraLicense.findFirst({ where: (0, drizzle_orm_1.eq)(license_model_1.auraLicense.machineId, hwid) });
        let expires = new Date();
        expires.setFullYear(expires.getFullYear() + 1); // 1 año de licencia
        if (!existing) {
            await database_1.db.insert(license_model_1.auraLicense).values({
                machineId: hwid,
                activationToken: token,
                isActive: true,
                expireAt: expires,
                lastValidatedAt: new Date()
            });
        }
        else {
            await database_1.db.update(license_model_1.auraLicense).set({
                activationToken: token,
                isActive: true,
                expireAt: expires,
                lastValidatedAt: new Date()
            }).where((0, drizzle_orm_1.eq)(license_model_1.auraLicense.id, existing.id));
        }
        return { success: true, message: "Instancia de Aura activada y blindada con éxito." };
    }
    throw new Error("Clave de activación inválida o rechazada por los servidores de Aura.");
};
exports.activateAura = activateAura;
