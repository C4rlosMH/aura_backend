"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAIN_CRON_PROCESS = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const MAIN_CRON_PROCESS = () => {
    node_cron_1.default.schedule('0 9 * * *', async () => {
        // Dummy logic para que complíe TS, el equipo puede reajustarel query a Drizzle luego
        console.log("Aura Cron: Ejecutando verificacion de mantenimientos");
    }, {
        timezone: "America/Cancun"
    });
};
exports.MAIN_CRON_PROCESS = MAIN_CRON_PROCESS;
