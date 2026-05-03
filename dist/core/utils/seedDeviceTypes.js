"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedAndCleanDeviceTypes = void 0;
require("dotenv/config");
const database_1 = require("../../core/database");
const inventory_model_1 = require("../../modules/inventory/inventory.model");
const drizzle_orm_1 = require("drizzle-orm");
const STANDARD_DEVICE_TYPES = [
    // COMPUTING
    { nombre: "Laptop", category: "COMPUTING", sub_category: "Portátil", icon_id: "lucide-laptop" },
    { nombre: "Desktop", category: "COMPUTING", sub_category: "Estación de Trabajo", icon_id: "lucide-monitor" },
    { nombre: "Servidor", category: "COMPUTING", sub_category: "Infraestructura", icon_id: "lucide-server" },
    { nombre: "Tablet", category: "COMPUTING", sub_category: "Móvil", icon_id: "lucide-tablet" },
    // NETWORK
    { nombre: "Switch", category: "NETWORK", sub_category: "Distribución", icon_id: "lucide-network" },
    { nombre: "Access Point", category: "NETWORK", sub_category: "Inalámbrico", icon_id: "lucide-wifi" },
    { nombre: "Router", category: "NETWORK", sub_category: "Enrutamiento", icon_id: "lucide-router" },
    { nombre: "Patch Panel", category: "NETWORK", sub_category: "Infraestructura", icon_id: "lucide-server" },
    // CCTV
    { nombre: "Cámara Bala", category: "CCTV", sub_category: "Vigilancia Exterior", icon_id: "lucide-cctv" },
    { nombre: "Cámara Domo", category: "CCTV", sub_category: "Vigilancia Interior", icon_id: "lucide-cctv" },
    { nombre: "NVR", category: "CCTV", sub_category: "Grabación IP", icon_id: "lucide-hard-drive" },
    { nombre: "DVR", category: "CCTV", sub_category: "Grabación Análoga", icon_id: "lucide-hard-drive" },
    // PERIPHERAL
    { nombre: "Impresora Térmica", category: "PERIPHERAL", sub_category: "Impresión", icon_id: "lucide-printer" },
    { nombre: "Impresora Láser", category: "PERIPHERAL", sub_category: "Impresión", icon_id: "lucide-printer" },
    { nombre: "Escáner", category: "PERIPHERAL", sub_category: "Digitalización", icon_id: "lucide-scan" },
    { nombre: "UPS / No-Break", category: "PERIPHERAL", sub_category: "Energía", icon_id: "lucide-battery-charging" },
    // POS
    { nombre: "Terminal Punto de Venta", category: "POS", sub_category: "Cobro", icon_id: "lucide-credit-card" },
    { nombre: "Cajón de Dinero", category: "POS", sub_category: "Cobro", icon_id: "lucide-banknote" },
    // AUDIOVISUAL
    { nombre: "Proyector", category: "AUDIOVISUAL", sub_category: "Video", icon_id: "lucide-projector" },
    { nombre: "Pantalla / TV", category: "AUDIOVISUAL", sub_category: "Video", icon_id: "lucide-tv" },
    { nombre: "Amplificador", category: "AUDIOVISUAL", sub_category: "Audio", icon_id: "lucide-speaker" }
];
const seedAndCleanDeviceTypes = async () => {
    console.log("[Aura Seed] Iniciando limpieza y estandarización de DeviceTypes...");
    try {
        // 1. Inserción o Actualización de Tipos Estándar
        for (const item of STANDARD_DEVICE_TYPES) {
            const existing = await database_1.db.query.deviceType.findFirst({
                where: (0, drizzle_orm_1.eq)(inventory_model_1.deviceType.nombre, item.nombre)
            });
            if (existing) {
                await database_1.db.update(inventory_model_1.deviceType).set({
                    category: item.category,
                    sub_category: item.sub_category,
                    icon_id: item.icon_id
                }).where((0, drizzle_orm_1.eq)(inventory_model_1.deviceType.id, existing.id));
            }
            else {
                await database_1.db.insert(inventory_model_1.deviceType).values({
                    nombre: item.nombre,
                    category: item.category,
                    sub_category: item.sub_category,
                    icon_id: item.icon_id
                });
            }
        }
        // 2. Localizar Tipos Huérfanos/Basura (que no están en la lista estándar)
        const allTypes = await database_1.db.query.deviceType.findMany();
        const validNames = STANDARD_DEVICE_TYPES.map(t => t.nombre);
        const orphanedTypes = allTypes.filter(t => !validNames.includes(t.nombre));
        if (orphanedTypes.length > 0) {
            console.log(`[Aura Seed] Detectados ${orphanedTypes.length} DeviceTypes no estandarizados.`);
            const fallbackType = await database_1.db.query.deviceType.findFirst({ where: (0, drizzle_orm_1.eq)(inventory_model_1.deviceType.nombre, "Desktop") });
            for (const orphan of orphanedTypes) {
                // Verificar si hay dispositivos usando este tipo huérfano
                const devicesUsingOrphan = await database_1.db.query.devices.findMany({
                    where: (0, drizzle_orm_1.eq)(inventory_model_1.devices.tipoId, orphan.id)
                });
                if (devicesUsingOrphan.length > 0 && fallbackType) {
                    console.warn(`[Aura Seed] Reasignando ${devicesUsingOrphan.length} equipos del tipo '${orphan.nombre}' a 'Desktop'.`);
                    // Migrar los equipos a un tipo válido para no romper la integridad referencial antes de eliminar
                    const idsToUpdate = devicesUsingOrphan.map(d => d.id);
                    await database_1.db.update(inventory_model_1.devices)
                        .set({ tipoId: fallbackType.id })
                        .where((0, drizzle_orm_1.inArray)(inventory_model_1.devices.id, idsToUpdate));
                }
                // Finalmente, eliminar el tipo basura generado por el legacy
                await database_1.db.delete(inventory_model_1.deviceType).where((0, drizzle_orm_1.eq)(inventory_model_1.deviceType.id, orphan.id));
                console.log(`[Aura Seed] Tipo huérfano eliminado: ${orphan.nombre}`);
            }
        }
        console.log("[Aura Seed] Estandarización de Taxonomía de Equipos completada.");
    }
    catch (error) {
        console.error("[Aura Seed] Error crítico limpiando DeviceTypes:", error);
    }
};
exports.seedAndCleanDeviceTypes = seedAndCleanDeviceTypes;
// Ejecutar el script directamente
(0, exports.seedAndCleanDeviceTypes)().then(() => {
    console.log("[Aura Seed] Finalizado con éxito.");
    process.exit(0);
});
