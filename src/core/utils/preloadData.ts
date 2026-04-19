import { db } from "../../core/database";
import { usersSistema } from "../../modules/auth/auth.model";
import bcrypt from "bcryptjs";

export const STANDARD_STRUCTURE_TEMPLATE = [
    { depto: "Gerencia", areas: ["Oficina Gral", "Junta"] },
    { depto: "Sistemas", areas: ["Site Principal", "Taller"] }
];

export const preloadMasterData = async () => {
    const count = await db.query.usersSistema.findMany({ columns: { id: true } });
    if (count.length > 0) return;

    console.log("Iniciando inyección de Root Master de Aura...");
    const hashedPassword = await bcrypt.hash("Aura123!", 10);
    
    await db.insert(usersSistema).values({
        nombre: "Aura System Root",
        username: "aura-root",
        email: "root@aura-system.com",
        password: hashedPassword,
        rol: "AURA_ROOT"
    });
    console.log("Aura Master System Inicializado.");
};
