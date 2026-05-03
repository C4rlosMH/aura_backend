import { db } from "../../core/database";
import { auraVlans, ipAssignments } from "./networks.model";
import { eq } from "drizzle-orm";
import { Address4 } from "ip-address";
// ¡Adiós a la importación de uuid!

export class NetworksService {
    // 1. Crear una nueva VLAN / Segmento
    async createVlan(data: any) {
        // Ya no enviamos el 'id', dejamos que MySQL use el autoincrement
        await db.insert(auraVlans).values(data);
        return data; 
    }

    // 2. Asignar una IP a un dispositivo con VALIDACIÓN
    // Cambiamos deviceId y vlanId a 'number'
    async assignIp(data: { ipAddress: string, deviceId: number, vlanId: number, portNumber?: number }) {
        
        // Obtener los datos del segmento (VLAN)
        const [vlan] = await db.select()
            .from(auraVlans)
            .where(eq(auraVlans.id, data.vlanId)); // ¡El error rojo desaparecerá aquí!

        if (!vlan) throw new Error("La VLAN seleccionada no existe.");

        // VALIDACIÓN TÉCNICA: ¿La IP pertenece al segmento?
        const block = new Address4(vlan.networkSegment); // Ej: 10.20.80.0/24
        const addr = new Address4(data.ipAddress);      // Ej: 10.20.80.45

        if (!addr.isInSubnet(block)) {
            throw new Error(`La IP ${data.ipAddress} no pertenece al segmento ${vlan.networkSegment} de la VLAN ${vlan.vlanNumber}.`);
        }

        // Proceder con la asignación (sin generar id manual)
        await db.insert(ipAssignments).values(data);
        return data;
    }

    // 3. Consultar IPs ocupadas de un sitio
    async getIpsBySite(siteId: number) { // siteId ahora es number
        return await db.select()
            .from(ipAssignments)
            .innerJoin(auraVlans, eq(ipAssignments.vlanId, auraVlans.id))
            .where(eq(auraVlans.siteId, siteId));
    }

    // Convierte una IP ("10.20.80.4") a un número entero seguro para matemáticas
    private ipToInt(ip: string): number {
        return ip.split('.').reduce((int, octet) => (int << 8) + parseInt(octet, 10), 0) >>> 0;
    }

    // Convierte un número entero de vuelta a formato IP ("10.20.80.4")
    private intToIp(int: number): string {
        return [ (int >>> 24) & 255, (int >>> 16) & 255, (int >>> 8) & 255, int & 255 ].join('.');
    }

    // --- 🧠 EL COPILOTO: Sugiere la siguiente IP libre ---
    async suggestNextFreeIp(vlanId: number): Promise<string> {
        // 1. Obtener los datos del segmento
        const [vlan] = await db.select()
            .from(auraVlans)
            .where(eq(auraVlans.id, vlanId));

        if (!vlan) throw new Error("VLAN no encontrada");

        // 2. Obtener todas las IPs que YA están ocupadas
        const assignedRecords = await db.select({ ipAddress: ipAssignments.ipAddress })
            .from(ipAssignments)
            .where(eq(ipAssignments.vlanId, vlanId));
        
        const occupiedIps = new Set(assignedRecords.map(r => r.ipAddress));

        // 3. Analizar el bloque de red usando la librería solo para obtener inicio y fin
        const block = new Address4(vlan.networkSegment);
        const startIpString = block.startAddress().correctForm(); // Ej: "10.20.80.0"
        const endIpString = block.endAddress().correctForm();     // Ej: "10.20.80.255"
        
        // Evitamos la red (.0), el gateway y el broadcast (.255)
        const gateway = vlan.gateway || startIpString; 
        occupiedIps.add(startIpString); 
        occupiedIps.add(gateway); 
        occupiedIps.add(endIpString); 

        // 4. Matemáticas de red (¡Sin BigInt y sin errores de TS!)
        const startInt = this.ipToInt(startIpString);
        const endInt = this.ipToInt(endIpString);

        // 5. Buscar la primera IP libre iterando matemáticamente
        for (let i = startInt + 1; i < endInt; i++) {
            const currentIp = this.intToIp(i);
            
            if (!occupiedIps.has(currentIp)) {
                // ¡Encontramos un hueco!
                return currentIp;
            }
        }

        throw new Error("El segmento de red está completamente lleno. No hay IPs libres.");
    }
}