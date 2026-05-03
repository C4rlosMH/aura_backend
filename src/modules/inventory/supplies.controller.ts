import { Request, Response } from "express";
import * as suppliesService from "./supplies.service";

export const createSupply = async (req: Request, res: Response) => {
    try {
        const supplyId = await suppliesService.createSupply(req.body);
        res.status(201).json({ message: "Insumo creado con éxito", supplyId });
    } catch (error: any) {
        res.status(500).json({ error: "Error al crear el insumo", details: error.message });
    }
};

export const getSuppliesBySite = async (req: Request, res: Response) => {
    try {
        // Añadimos 'as string' para asegurar el tipo a parseInt
        const siteId = parseInt(req.params.siteId as string);
        const supplies = await suppliesService.getSuppliesBySite(siteId);
        res.status(200).json(supplies);
    } catch (error: any) {
        res.status(500).json({ error: "Error al obtener los insumos", details: error.message });
    }
};

export const addStock = async (req: Request, res: Response) => {
    try {
        // Añadimos 'as string' aquí también
        const supplyId = parseInt(req.params.id as string);
        const { cantidad, userId, notas } = req.body;
        
        await suppliesService.addStock(supplyId, cantidad, userId, notas);
        res.status(200).json({ message: "Stock agregado correctamente" });
    } catch (error: any) {
        res.status(500).json({ error: "Error al agregar stock", details: error.message });
    }
};

export const consumeStock = async (req: Request, res: Response) => {
    try {
        // Y aquí también para mantener la consistencia
        const supplyId = parseInt(req.params.id as string);
        const { cantidad, userId, deviceId, notas } = req.body;
        
        await suppliesService.consumeStock(supplyId, cantidad, userId, deviceId, notas);
        res.status(200).json({ message: "Stock consumido y registrado correctamente" });
    } catch (error: any) {
        res.status(400).json({ error: "Error al consumir stock", details: error.message });
    }
};