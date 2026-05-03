import "dotenv/config";
import { db } from "../../core/database";
import { deviceType, devices } from "../../modules/inventory/inventory.model";
import { eq, inArray } from "drizzle-orm";

const STANDARD_DEVICE_TYPES = [
    // COMPUTING
    { nombre: "Laptop", category: "COMPUTING", sub_category: "Portátil" },
    { nombre: "Desktop", category: "COMPUTING", sub_category: "Estación de Trabajo" },
    { nombre: "Monitor", category: "COMPUTING", sub_category: "Periférico de Salida" },
    { nombre: "Servidor", category: "COMPUTING", sub_category: "Infraestructura" },
    { nombre: "Tablet", category: "COMPUTING", sub_category: "Móvil" },
    { nombre: "Celular", category: "COMPUTING", sub_category: "Móvil" },
    
    // NETWORK
    { nombre: "Switch", category: "NETWORK", sub_category: "Distribución" },
    { nombre: "Access Point", category: "NETWORK", sub_category: "Inalámbrico" },
    { nombre: "Router", category: "NETWORK", sub_category: "Enrutamiento" },
    { nombre: "Patch Panel", category: "NETWORK", sub_category: "Infraestructura" },
    { nombre: "Teléfono IP", category: "NETWORK", sub_category: "Comunicación" },
    { nombre: "Teléfono Analógico", category: "NETWORK", sub_category: "Comunicación" },

    // CCTV
    { nombre: "Cámara Bala", category: "CCTV", sub_category: "Vigilancia Exterior" },
    { nombre: "Cámara Domo", category: "CCTV", sub_category: "Vigilancia Interior" },
    { nombre: "NVR", category: "CCTV", sub_category: "Grabación IP" },
    { nombre: "DVR", category: "CCTV", sub_category: "Grabación Análoga" },

    // PERIPHERAL
    { nombre: "Impresora Térmica", category: "PERIPHERAL", sub_category: "Impresión" },
    { nombre: "Impresora Láser", category: "PERIPHERAL", sub_category: "Impresión" },
    { nombre: "Escáner", category: "PERIPHERAL", sub_category: "Digitalización" },
    { nombre: "UPS / No-Break", category: "PERIPHERAL", sub_category: "Energía" },

    // POS
    { nombre: "Terminal Punto de Venta", category: "POS", sub_category: "Cobro" },
    { nombre: "Cajón de Dinero", category: "POS", sub_category: "Cobro" },

    // AUDIOVISUAL
    { nombre: "Proyector", category: "AUDIOVISUAL", sub_category: "Video" },
    { nombre: "Pantalla / TV", category: "AUDIOVISUAL", sub_category: "Video" },
    { nombre: "Amplificador", category: "AUDIOVISUAL", sub_category: "Audio" }
];

export const seedAndCleanDeviceTypes = async () => {
    console.log("[Aura Seed] Iniciando limpieza y estandarización de DeviceTypes (Sin Iconos)...");

    try {
        // 1. Inserción o Actualización de Tipos Estándar
        for (const item of STANDARD_DEVICE_TYPES) {
            const existing = await db.query.deviceType.findFirst({
                where: eq(deviceType.nombre, item.nombre)
            });

            if (existing) {
                await db.update(deviceType).set({
                    category: item.category as any,
                    sub_category: item.sub_category
                }).where(eq(deviceType.id, existing.id));
            } else {
                await db.insert(deviceType).values({
                    nombre: item.nombre,
                    category: item.category as any,
                    sub_category: item.sub_category
                });
            }
        }

        // 2. Localizar Tipos Huérfanos/Basura
        const allTypes = await db.query.deviceType.findMany();
        const validNames = STANDARD_DEVICE_TYPES.map(t => t.nombre);
        
        const orphanedTypes = allTypes.filter(t => !validNames.includes(t.nombre));

        if (orphanedTypes.length > 0) {
            console.log(`[Aura Seed] Detectados ${orphanedTypes.length} DeviceTypes no estandarizados.`);
            
            const fallbackType = await db.query.deviceType.findFirst({ where: eq(deviceType.nombre, "Desktop") });

            for (const orphan of orphanedTypes) {
                const devicesUsingOrphan = await db.query.devices.findMany({
                    where: eq(devices.tipoId, orphan.id)
                });

                if (devicesUsingOrphan.length > 0 && fallbackType) {
                    console.warn(`[Aura Seed] Reasignando ${devicesUsingOrphan.length} equipos del tipo '${orphan.nombre}' a 'Desktop'.`);
                    const idsToUpdate = devicesUsingOrphan.map(d => d.id);
                    await db.update(devices)
                        .set({ tipoId: fallbackType.id })
                        .where(inArray(devices.id, idsToUpdate));
                }

                await db.delete(deviceType).where(eq(deviceType.id, orphan.id));
                console.log(`[Aura Seed] Tipo huérfano eliminado: ${orphan.nombre}`);
            }
        }

        console.log("[Aura Seed] Estandarización de Taxonomía de Equipos completada.");

    } catch (error) {
        console.error("[Aura Seed] Error crítico limpiando DeviceTypes:", error);
    }
};

seedAndCleanDeviceTypes().then(() => {
    console.log("[Aura Seed] Finalizado con éxito.");
    process.exit(0);
});