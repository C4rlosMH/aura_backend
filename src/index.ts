import "dotenv/config";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cron from "node-cron"; 
import helmet from "helmet"; 
import rateLimit from "express-rate-limit"; 
import compression from "compression"; 
import morgan from "morgan"; 
import path from "path";

import { db } from "./core/database";
import { preloadMasterData } from "./core/utils/preloadData";
import { errorHandler } from "./core/middlewares/errorHandler";
import { licenseGuard } from "./middlewares/license.middleware"; 
import { MAIN_CRON_PROCESS } from "./core/utils/cronJobs"; // Asumiremos que crearemos un archivo para agrupar el cron

// --- [INICIO] IMPORTS NUEVOS PARA DIAGNÓSTICO ---
import { sql } from "drizzle-orm";
import { sites } from "./modules/organization/organization.model";
import { deviceType } from "./modules/inventory/inventory.model";
// --- [FIN] IMPORTS NUEVOS PARA DIAGNÓSTICO ---

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
import suppliesRoutes from "./modules/inventory/supplies.routes";
import analyticsRoutes from "./modules/inventory/analytics.routes";
import invoiceRoutes from "./modules/inventory/invoice.routes";

import auditRoutes from "./modules/audit/audit.routes";
import maintenanceRoutes from "./modules/maintenance/maintenance.routes";

// ==========================================================================
// === [INICIO] MÓDULO DE AUTODIAGNÓSTICO AURA (COMENTAR CUANDO NO SE USE) ===
// ==========================================================================
async function runAuraSanityCheck() {
    console.log("\x1b[36m%s\x1b[0m", "\n--- 🛡️ DIAGNÓSTICO DE ARRANQUE (AURA ITAM/ITSM) ---");
    try {
        const startDb = Date.now();
        await db.execute(sql`SELECT 1`);
        const endDb = Date.now();
        console.log(`✅ Conexión a Base de Datos: ESTABLE (${endDb - startDb}ms)`);

        const siteData = await db.select({ count: sql<number>`count(*)` }).from(sites);
        console.log(`✅ Entorno Multi-tenant: OK (${siteData[0].count} sitios registrados)`);

        const typeData = await db.select({ count: sql<number>`count(*)` }).from(deviceType);
        if (typeData[0].count === 0) {
            console.log("\x1b[33m%s\x1b[0m", "⚠️  ADVERTENCIA: No hay tipos de equipos cargados. Revisa el seed.");
        } else {
            console.log(`✅ Catálogo de Activos: OK (${typeData[0].count} tipos de hardware)`);
        }

        console.log("\x1b[32m%s\x1b[0m", "--- ✨ DIAGNÓSTICO COMPLETADO ---\n");
    } catch (error: any) {
        console.log("\x1b[31m%s\x1b[0m", "\n❌ ERROR EN EL ARRANQUE:");
        console.error(`Detalle: ${error.message}`);
        console.log("\x1b[31m%s\x1b[0m", "Asegúrate de que la DB esté arriba y las tablas renombradas existan.\n");
    }
}
// ==========================================================================
// === [FIN] MÓDULO DE AUTODIAGNÓSTICO ===
// ==========================================================================

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
app.use("/api/supplies", suppliesRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/invoices", invoiceRoutes);

app.use("/api/audit", auditRoutes);
app.use("/api/maintenances", maintenanceRoutes);

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use(errorHandler);

const PORT = process.env.PORT;

app.listen(PORT, async () => {
  console.log(`Aura Framework inicializado en el puerto: ${PORT}`);
  try {
    // --- [INICIO] LLAMADA AL DIAGNÓSTICO ---
    await runAuraSanityCheck();
    // --- [FIN] LLAMADA AL DIAGNÓSTICO ---

    await preloadMasterData();
    MAIN_CRON_PROCESS(); // Inicia el cron background
  } catch (err) {
    console.error("Aura DB Crash:", err);
  }
});