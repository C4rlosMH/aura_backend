import "dotenv/config";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cron from "node-cron"; 
import helmet from "helmet"; 
import rateLimit from "express-rate-limit"; 
import compression from "compression"; 
import morgan from "morgan"; 

import { db } from "./core/database";
import { preloadMasterData } from "./core/utils/preloadData";
import { errorHandler } from "./core/middlewares/errorHandler";
import { licenseGuard } from "./middlewares/license.middleware"; 
import { MAIN_CRON_PROCESS } from "./core/utils/cronJobs"; // Asumiremos que crearemos un archivo para agrupar el cron

// Nuevos Rutadores Modulares
import authRoutes from "./modules/auth/auth.routes";
import siteRoutes from "./modules/organization/site.routes";
import departmentRoutes from "./modules/organization/department.routes";
import areaRoutes from "./modules/organization/area.routes";
import staffRoutes from "./modules/staff/staff.routes";
import licenseRoutes from "./modules/license/license.routes";

import deviceRoutes from "./modules/inventory/device.routes";
import catalogRoutes from "./modules/inventory/catalog.routes";
import disposalRoutes from "./modules/inventory/disposal.routes";

import auditRoutes from "./modules/audit/audit.routes";
import maintenanceRoutes from "./modules/maintenance/maintenance.routes";

dotenv.config();

const app = express();

app.set('trust proxy', 1);
app.use(morgan("combined")); 
app.use(helmet());
app.use(compression());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5000, message: "Aura Proteccion DDoS actvada." });
app.use(limiter);

app.use(cors({ origin: true, credentials: true })); // origin true dinámico para dev
app.use(express.json());

// --- AURA LICENSING HEARTBEAT ---
app.use(licenseGuard); 

// --- RUTAS MODULARES DE AURA ---
app.use("/api/auth", authRoutes);
app.use("/api/license", licenseRoutes);
app.use("/api/sites", siteRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/areas", areaRoutes); 

app.use("/api/staff", staffRoutes); // Anterior user.routes.js

app.use("/api/devices", deviceRoutes);
app.use("/api/catalog", catalogRoutes); // Encapsula os, deviceTypes, y deviceStatus
app.use("/api/disposals", disposalRoutes);

app.use("/api/audit", auditRoutes);
app.use("/api/maintenances", maintenanceRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`Aura Framework inicializado en el puerto: ${PORT}`);
  try {
    await preloadMasterData();
    MAIN_CRON_PROCESS(); // Inicia el cron background
  } catch (err) {
    console.error("Aura DB Crash:", err);
  }
});
