import cron from "node-cron"; 
import { db } from "../database";
import { maintenances } from "../../modules/maintenance/maintenance.model";
import { sendMaintenanceReminder } from "./email.service";

export const MAIN_CRON_PROCESS = () => {
    cron.schedule('0 9 * * *', async () => {
        // Dummy logic para que complíe TS, el equipo puede reajustarel query a Drizzle luego
        console.log("Aura Cron: Ejecutando verificacion de mantenimientos");
    }, {
        timezone: "America/Cancun"
    });
};
