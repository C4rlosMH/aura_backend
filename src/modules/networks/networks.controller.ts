import { Request, Response } from "express";
import { NetworksService } from "./networks.service";
import { asc } from "drizzle-orm";

const networksService = new NetworksService();

export class NetworksController {
    
    // 1. Crear una nueva VLAN / Segmento de red
    async createVlan(req: Request, res: Response) {
        try {
            // El body debe traer: vlanNumber, name, networkSegment, gateway, siteId
            const vlanData = req.body;
            const newVlan = await networksService.createVlan(vlanData);
            
            res.status(201).json({
                success: true,
                message: "VLAN creada exitosamente",
                data: newVlan
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: "Error al crear la VLAN",
                error: error.message
            });
        }
    }

    // 2. Asignar una IP a un dispositivo (La decisión final del técnico)
    async assignIp(req: Request, res: Response) {
        try {
            // El body debe traer: ipAddress, deviceId, vlanId y opcionalmente portNumber
            const assignmentData = req.body;
            const result = await networksService.assignIp(assignmentData);

            res.status(201).json({
                success: true,
                message: "IP asignada exitosamente",
                data: result
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: "Error al asignar la IP",
                error: error.message
            });
        }
    }

    // 3. El Copiloto: Sugerir IP libre
    async suggestIp(req: Request, res: Response) {
        try {
            // Recibimos el vlanId por la URL (ej. /api/networks/vlan/5/suggest)
            const vlanId = parseInt(req.params.vlanId as string);
            
            if (isNaN(vlanId)) {
                return res.status(400).json({ success: false, message: "ID de VLAN inválido" });
            }

            const suggestedIp = await networksService.suggestNextFreeIp(vlanId);

            res.status(200).json({
                success: true,
                data: {
                    suggestedIp: suggestedIp
                }
            });
        } catch (error: any) {
            res.status(404).json({
                success: false,
                message: "No se pudo sugerir una IP",
                error: error.message
            });
        }
    }

    // 4. Obtener el mapa de IPs ocupadas por Site
    async getIpsBySite(req: Request, res: Response) {
        try {
            const siteId = parseInt(req.params.siteId as string);

            if (isNaN(siteId)) {
                return res.status(400).json({ success: false, message: "ID de Site inválido" });
            }

            const ips = await networksService.getIpsBySite(siteId);

            res.status(200).json({
                success: true,
                data: ips
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: "Error al consultar las IPs",
                error: error.message
            });
        }
    }
}