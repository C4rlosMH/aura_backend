import { Request, Response } from "express";
import { db } from "../../core/database";
import { invoices } from "./invoices.model";
import { devices, supplies } from "./inventory.model";

export const createInvoiceBatch = async (req: Request, res: Response) => {
    try {
        // 1. Extraer datos del cuerpo (venidrán del formulario manual por ahora)
        const { invoiceData, items, type } = req.body; 
        // type: 'DEVICE' o 'SUPPLY'
        // items: un Array con los datos de los 10, 20 o 50 equipos

        // 2. Iniciar Transacción para asegurar integridad
        await db.transaction(async (tx) => {
            
            // A. Insertar la Factura
            const [newInvoice] = await tx.insert(invoices).values({
                folio: invoiceData.folio,
                proveedor: invoiceData.proveedor,
                fechaCompra: new Date(invoiceData.fechaCompra),
                montoTotal: invoiceData.montoTotal,
                siteId: invoiceData.siteId,
                pdfUrl: req.file ? req.file.path : null // Si subió PDF, guardamos la ruta
            });

            const invoiceId = newInvoice.insertId;

            // B. Insertar por Lote (Bulk Insert)
            if (type === 'DEVICE') {
                const devicesToInsert = items.map((item: any) => ({
                    ...item,
                    invoiceId: invoiceId,
                    siteId: invoiceData.siteId
                }));
                await tx.insert(devices).values(devicesToInsert);
            } else {
                const suppliesToInsert = items.map((item: any) => ({
                    ...item,
                    invoiceId: invoiceId,
                    siteId: invoiceData.siteId
                }));
                await tx.insert(supplies).values(suppliesToInsert);
            }
        });

        res.status(201).json({ message: "Factura y lote de equipos registrados con éxito" });

    } catch (error: any) {
        res.status(500).json({ error: "Error en carga por lote", details: error.message });
    }
};