import cron from "node-cron";
import ping from "ping";
import { db } from "../database";
import { devices } from "../../modules/inventory/inventory.model";
import { ipAssignments } from "../../modules/networks/networks.model";
import { eq, isNotNull } from "drizzle-orm";

export const MAIN_CRON_PROCESS = () => {
    console.log("⏱️ Iniciando procesos en segundo plano de Aura (CronJobs)...");

    // Se ejecutará cada 5 minutos. (Ajusta a "*/10 * * * *" si prefieres cada 10 min)
    cron.schedule("*/5 * * * *", async () => {
        console.log("[Aura Heartbeat] 💓 Iniciando escaneo de red...");
        
        try {
            // 1. Obtenemos TODAS las IPs que están amarradas a un equipo físico
            const assignments = await db.select({
                deviceId: ipAssignments.deviceId,
                ipAddress: ipAssignments.ipAddress
            })
            .from(ipAssignments)
            .where(isNotNull(ipAssignments.deviceId));

            if (assignments.length === 0) {
                console.log("[Aura Heartbeat] No hay equipos con IP asignada para monitorear.");
                return;
            }

            let responded = 0;

            // 2. Iteramos y enviamos un Ping a cada IP
            for (const record of assignments) {
                // Probe manda el ping (timeout de 2 segundos para no trabar el hilo)
                const res = await ping.promise.probe(record.ipAddress, {
                    timeout: 2, 
                });

                // 3. Si el equipo responde al ping (está vivo), actualizamos su last_ping
                if (res.alive) {
                    await db.update(devices)
                        .set({ lastPing: new Date() }) // <-- Asegúrate de que coincida con tu inventory.model.ts
                        .where(eq(devices.id, record.deviceId));
                    
                    responded++;
                }
            }
            
            console.log(`[Aura Heartbeat] Escaneo completado. Equipos en línea: ${responded} / ${assignments.length}`);
            
        } catch (error) {
            console.error("[Aura Heartbeat] Error crítico en el escaneo de red:", error);
        }
    });
};