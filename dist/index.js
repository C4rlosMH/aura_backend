"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const preloadData_1 = require("./core/utils/preloadData");
const errorHandler_1 = require("./core/middlewares/errorHandler");
const license_middleware_1 = require("./middlewares/license.middleware");
const cronJobs_1 = require("./core/utils/cronJobs"); // Asumiremos que crearemos un archivo para agrupar el cron
// Nuevos Rutadores Modulares
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const site_routes_1 = __importDefault(require("./modules/organization/site.routes"));
const department_routes_1 = __importDefault(require("./modules/organization/department.routes"));
const area_routes_1 = __importDefault(require("./modules/organization/area.routes"));
const staff_routes_1 = __importDefault(require("./modules/staff/staff.routes"));
const license_routes_1 = __importDefault(require("./modules/license/license.routes"));
const device_routes_1 = __importDefault(require("./modules/inventory/device.routes"));
const catalog_routes_1 = __importDefault(require("./modules/inventory/catalog.routes"));
const disposal_routes_1 = __importDefault(require("./modules/inventory/disposal.routes"));
const audit_routes_1 = __importDefault(require("./modules/audit/audit.routes"));
const maintenance_routes_1 = __importDefault(require("./modules/maintenance/maintenance.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.set('trust proxy', 1);
app.use((0, morgan_1.default)("combined"));
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
const limiter = (0, express_rate_limit_1.default)({ windowMs: 15 * 60 * 1000, max: 5000, message: "Aura Proteccion DDoS actvada." });
app.use(limiter);
app.use((0, cors_1.default)({ origin: true, credentials: true })); // origin true dinámico para dev
app.use(express_1.default.json());
// --- AURA LICENSING HEARTBEAT ---
app.use(license_middleware_1.licenseGuard);
// --- RUTAS MODULARES DE AURA ---
app.use("/api/auth", auth_routes_1.default);
app.use("/api/license", license_routes_1.default);
app.use("/api/sites", site_routes_1.default);
app.use("/api/departments", department_routes_1.default);
app.use("/api/areas", area_routes_1.default);
app.use("/api/staff", staff_routes_1.default); // Anterior user.routes.js
app.use("/api/devices", device_routes_1.default);
app.use("/api/catalog", catalog_routes_1.default); // Encapsula os, deviceTypes, y deviceStatus
app.use("/api/disposals", disposal_routes_1.default);
app.use("/api/audit", audit_routes_1.default);
app.use("/api/maintenances", maintenance_routes_1.default);
app.use(errorHandler_1.errorHandler);
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`Aura Framework inicializado en el puerto: ${PORT}`);
    try {
        await (0, preloadData_1.preloadMasterData)();
        (0, cronJobs_1.MAIN_CRON_PROCESS)(); // Inicia el cron background
    }
    catch (err) {
        console.error("Aura DB Crash:", err);
    }
});
