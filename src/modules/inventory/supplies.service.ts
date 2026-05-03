import { eq, sql } from "drizzle-orm";
import { db } from "../../core/database";
import { supplies, supplyTransactions } from "./inventory.model";

// 1. Crear un nuevo material en el catálogo (Ej: "Bobina UTP Cat 6")
export const createSupply = async (data: typeof supplies.$inferInsert) => {
    const [result] = await db.insert(supplies).values(data);
    return result.insertId;
};

// 2. Ver el inventario de una sucursal/sitio específico
export const getSuppliesBySite = async (siteId: number) => {
    return await db.query.supplies.findMany({
        where: eq(supplies.siteId, siteId)
    });
};

// 3. Ingresar Stock (Cuando llega mercancía nueva)
export const addStock = async (supplyId: number, cantidad: number, userId: number, notas?: string) => {
    // Registramos el movimiento de entrada (IN)
    await db.insert(supplyTransactions).values({
        supplyId,
        tipo: 'IN',
        cantidad: cantidad.toString(),
        userId,
        notas
    });

    // Sumamos la cantidad al stock actual de manera atómica
    await db.update(supplies)
        .set({ cantidad: sql`${supplies.cantidad} + ${cantidad}` })
        .where(eq(supplies.id, supplyId));

    return true;
};

// 4. Consumir Stock (Cuando un técnico gasta material)
export const consumeStock = async (supplyId: number, cantidad: number, userId: number, deviceId?: number, notas?: string) => {
    // Verificamos si hay suficiente material antes de dejarlo sacar
    const current = await db.query.supplies.findFirst({ 
        where: eq(supplies.id, supplyId) 
    });

    if (!current || parseFloat(current.cantidad as string) < cantidad) {
        throw new Error("Stock insuficiente para realizar esta operación.");
    }

    // Registramos la salida (OUT), vinculándolo al dispositivo si aplica
    await db.insert(supplyTransactions).values({
        supplyId,
        tipo: 'OUT',
        cantidad: cantidad.toString(),
        userId,
        deviceId, // <--- Aquí empieza la magia del cálculo TCO (Costo Total de Propiedad)
        notas
    });

    // Restamos la cantidad del stock
    await db.update(supplies)
        .set({ cantidad: sql`${supplies.cantidad} - ${cantidad}` })
        .where(eq(supplies.id, supplyId));

    return true;
};