"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportDisposalsExcel = exports.deleteDisposal = exports.updateDisposal = exports.getDisposal = exports.getDisposals = void 0;
const disposalService = __importStar(require("./disposal.service"));
const deviceService = __importStar(require("./device.service"));
const exceljs_1 = __importDefault(require("exceljs"));
const getDisposals = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || "";
        const skip = (page - 1) * limit;
        const { devices, totalCount } = await disposalService.getInactiveDevices({ skip, take: limit, search }, req.user);
        res.json({
            data: devices,
            totalCount: totalCount,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit)
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getDisposals = getDisposals;
const getDisposal = async (req, res, next) => {
    try {
        const disposal = await deviceService.getDeviceById(String(req.params.id), req.user);
        if (!disposal)
            return res.status(404).json({ error: "Baja no encontrada o sin permisos en tu Aura Tenant" });
        res.json(disposal);
    }
    catch (error) {
        next(error);
    }
};
exports.getDisposal = getDisposal;
const updateDisposal = async (req, res, next) => {
    try {
        const oldDisposal = await deviceService.getDeviceById(String(req.params.id), req.user);
        if (!oldDisposal)
            return res.status(404).json({ message: "Baja no encontrada o sin permisos" });
        const dataToUpdate = { motivo_baja: req.body.motivo_baja, observaciones_baja: req.body.observaciones_baja };
        const disposal = await deviceService.updateDevice(String(req.params.id), dataToUpdate, req.user);
        res.json(disposal);
    }
    catch (error) {
        next(error);
    }
};
exports.updateDisposal = updateDisposal;
const deleteDisposal = async (req, res, next) => {
    try {
        res.status(403).json({ error: "Aura Policy: Las bajas no se pueden eliminar. Es un registro histórico inmutable para la auditoría contable." });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteDisposal = deleteDisposal;
const exportDisposalsExcel = async (req, res, next) => {
    try {
        const { devices } = await disposalService.getInactiveDevices({ skip: 0, take: 999999 }, req.user);
        const workbook = new exceljs_1.default.Workbook();
        const worksheet = workbook.addWorksheet("Bajas de Equipos");
        worksheet.columns = [
            { header: "No", key: "id", width: 10 },
            { header: "Etiqueta", key: "etiqueta", width: 15 },
            { header: "Nombre Equipo", key: "nombre_equipo", width: 25 },
            { header: "Categoría Lenses", key: "categoria", width: 15 },
            { header: "N° Serie", key: "numero_serie", width: 25 },
            { header: "Marca", key: "marca", width: 15 },
            { header: "Modelo", key: "modelo", width: 20 },
            { header: "Usuario Asignado", key: "usuario_nombre", width: 30 },
            { header: "IP", key: "ip_equipo", width: 15 },
            { header: "Tipo", key: "tipo", width: 20 },
            { header: "Motivo", key: "motivo_baja", width: 40 },
            { header: "Observaciones", key: "observaciones_baja", width: 40 }
        ];
        devices.forEach((d) => {
            worksheet.addRow({
                id: d.id,
                etiqueta: d.etiqueta || "N/A",
                nombre_equipo: d.nombre_equipo || "N/A",
                categoria: d.type?.category || "N/A",
                numero_serie: d.numero_serie || "N/A",
                marca: d.marca || "N/A",
                modelo: d.modelo || "N/A",
                usuario_nombre: d.staff?.nombre || "N/A",
                ip_equipo: d.ip_equipo || "N/A",
                tipo: d.type?.nombre || "N/A",
                motivo_baja: d.motivo_baja || "",
                observaciones_baja: d.observaciones_baja || ""
            });
        });
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).alignment = { horizontal: "center" };
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=bajas_aura.xlsx");
        await workbook.xlsx.write(res);
        res.end();
    }
    catch (error) {
        next(error);
    }
};
exports.exportDisposalsExcel = exportDisposalsExcel;
