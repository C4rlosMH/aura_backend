"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.preloadMasterData = exports.STANDARD_STRUCTURE_TEMPLATE = void 0;
const database_1 = require("../../core/database");
const auth_model_1 = require("../../modules/auth/auth.model");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
exports.STANDARD_STRUCTURE_TEMPLATE = [
    { depto: "Gerencia", areas: ["Oficina Gral", "Junta"] },
    { depto: "Sistemas", areas: ["Site Principal", "Taller"] }
];
const preloadMasterData = async () => {
    const count = await database_1.db.query.usersSistema.findMany({ columns: { id: true } });
    if (count.length > 0)
        return;
    console.log("Iniciando inyección de Root Master de Aura...");
    const hashedPassword = await bcryptjs_1.default.hash("Aura123!", 10);
    await database_1.db.insert(auth_model_1.usersSistema).values({
        nombre: "Aura System Root",
        username: "aura-root",
        email: "root@aura-system.com",
        password: hashedPassword,
        rol: "AURA_ROOT"
    });
    console.log("Aura Master System Inicializado.");
};
exports.preloadMasterData = preloadMasterData;
