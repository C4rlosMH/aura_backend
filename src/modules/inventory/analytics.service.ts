import { eq, sql, sum } from "drizzle-orm";
import { db } from "../../core/database";
import { devices, supplyTransactions, supplies } from "./inventory.model";
import { maintenances } from "../maintenance/maintenance.model";

/**
 * Intentar cargar el motor de inteligencia de forma segura
 */
async function getAuraEngine() {
    try {
        return await import("./analytics.secret");
    } catch (e) {
        return null;
    }
}

export const getDeviceTCO = async (deviceId: number) => {
    // 1. Obtener datos del equipo (Usamos 'modelo' en lugar de 'nombre')
    const deviceData = await db.query.devices.findFirst({
        where: eq(devices.id, deviceId),
    });

    if (!deviceData) throw new Error("Equipo no encontrado");

    // 2. Obtener sumatorias (Drizzle devuelve strings para decimales)
    const maintResult = await db.select({ total: sum(maintenances.costoReparacion) })
        .from(maintenances)
        .where(eq(maintenances.deviceId, deviceId));

    const suppliesResult = await db.select({
        total: sql<string>`SUM(${supplyTransactions.cantidad} * ${supplies.costoUnitario})`
    })
    .from(supplyTransactions)
    .innerJoin(supplies, eq(supplyTransactions.supplyId, supplies.id))
    .where(eq(supplyTransactions.deviceId, deviceId));

    // Conversión segura de tipos
    const base = parseFloat(deviceData.precioCompra || "0");
    const maint = parseFloat(maintResult[0].total || "0");
    const supp = parseFloat(suppliesResult[0].total || "0");
    
    // Cálculo de antigüedad (Placeholder para la fórmula)
    const yearsOld = 1; 

    // 3. LA VÍA: Invocación del Secreto Comercial
    const auraEngine = await getAuraEngine();

    if (auraEngine) {
        const advancedTCO = auraEngine.calculateAdvancedTCO({
            basePrice: base,
            maintenanceTotal: maint,
            suppliesTotal: supp,
            yearsOld: yearsOld,
            isHighSalinity: false // Este dato vendrá del 'Site' en el futuro
        });

        return {
            assetTag: deviceData.etiqueta,
            model: deviceData.modelo,
            totalTCO: advancedTCO,
            isPremium: true,
            engineId: auraEngine.SECRET_MODULE_ID
        };
    } else {
        // Modo Básico (Solo suma simple si no hay secreto)
        return {
            assetTag: deviceData.etiqueta,
            model: deviceData.modelo,
            totalTCO: base + maint + supp,
            isPremium: false,
            message: "Algoritmo de predicción financiera no detectado."
        };
    }
};

/**
 * Obtiene el valor total del patrimonio tecnológico de un Sitio
 * ESTA ES LA FUNCIÓN QUE TE MARCABA ERROR
 */
export const getSiteAssetsValue = async (siteId: number) => {
    const result = await db.select({
        totalValue: sum(devices.precioCompra)
    })
    .from(devices)
    .where(eq(devices.siteId, siteId));

    return {
        siteId,
        totalPatrimonio: parseFloat(result[0].totalValue || "0")
    };
};