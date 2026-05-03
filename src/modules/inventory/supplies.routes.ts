import { Router } from "express";
import { createSupply, getSuppliesBySite, addStock, consumeStock } from "./supplies.controller";

const router = Router();

// Crear un nuevo insumo en el catálogo
router.post("/", createSupply);

// Ver el catálogo de insumos de un sitio
router.get("/site/:siteId", getSuppliesBySite);

// Agregar más stock a un insumo existente
router.post("/:id/add", addStock);

// Consumir stock de un insumo (El técnico saca material)
router.post("/:id/consume", consumeStock);

export default router;