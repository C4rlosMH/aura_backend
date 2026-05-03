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
exports.importStaff = exports.exportStaff = exports.deleteStaff = exports.updateStaff = exports.createStaff = exports.getStaffMember = exports.getAllStaff = exports.getStaff = void 0;
const staffService = __importStar(require("./staff.service"));
const exceljs_1 = __importDefault(require("exceljs"));
const getStaff = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limitParam = req.query.limit;
        const limit = (limitParam === '0') ? 0 : (parseInt(limitParam) || 10);
        const sortBy = req.query.sortBy || "nombre";
        const order = req.query.order || "asc";
        const skip = (page - 1) * limit;
        if (limit === 0) {
            const { users } = await staffService.getStaffMembers({
                skip: 0,
                sortBy,
                order
            }, req.user);
            return res.json(users);
        }
        const { users, totalCount } = await staffService.getStaffMembers({
            skip,
            take: limit,
            search: req.query.search,
            sortBy,
            order
        }, req.user);
        res.json({
            data: users,
            totalCount: totalCount,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit)
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getStaff = getStaff;
const getAllStaff = async (req, res, next) => {
    try {
        const users = await staffService.getAllStaff(req.user);
        res.json(users);
    }
    catch (error) {
        next(error);
    }
};
exports.getAllStaff = getAllStaff;
const getStaffMember = async (req, res, next) => {
    try {
        const user = await staffService.getStaffById(String(req.params.id), req.user);
        if (!user)
            return res.status(404).json({ message: "Staff not found or access denied in Aura" });
        res.json(user);
    }
    catch (error) {
        next(error);
    }
};
exports.getStaffMember = getStaffMember;
const createStaff = async (req, res, next) => {
    try {
        const user = await staffService.createStaff(req.body, req.user);
        res.status(201).json(user);
    }
    catch (error) {
        next(error);
    }
};
exports.createStaff = createStaff;
const updateStaff = async (req, res, next) => {
    try {
        const user = await staffService.updateStaff(String(req.params.id), req.body, req.user);
        res.json(user);
    }
    catch (error) {
        next(error);
    }
};
exports.updateStaff = updateStaff;
const deleteStaff = async (req, res, next) => {
    try {
        await staffService.deleteStaff(String(req.params.id), req.user);
        res.json({ message: "Staff archived correctly in Aura" });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteStaff = deleteStaff;
const exportStaff = async (req, res, next) => {
    try {
        const { users } = await staffService.getStaffMembers({ skip: 0 }, req.user);
        const workbook = new exceljs_1.default.Workbook();
        const worksheet = workbook.addWorksheet("Aura Staff Roster");
        worksheet.columns = [
            { header: "ID", key: "id", width: 10 },
            { header: "Nombre", key: "nombre", width: 30 },
            { header: "Correo", key: "correo", width: 30 },
            { header: "Área", key: "area", width: 25 },
            { header: "Departamento", key: "departamento", width: 25 },
            { header: "Login Alias", key: "usuario_login", width: 20 },
        ];
        users.forEach((u) => {
            worksheet.addRow({
                id: u.id,
                nombre: u.nombre,
                correo: u.correo,
                area: u.area?.nombre || "N/A",
                departamento: u.area?.departamento?.nombre || "N/A",
                usuario_login: u.usuario_login || "N/A",
            });
        });
        worksheet.getRow(1).font = { bold: true };
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=aura_staff.xlsx");
        await workbook.xlsx.write(res);
        res.end();
    }
    catch (error) {
        next(error);
    }
};
exports.exportStaff = exportStaff;
const importStaff = async (req, res, next) => {
    try {
        if (!req.file)
            return res.status(400).json({ error: "No payload injected" });
        const targetSiteId = req.body.siteId ? Number(req.body.siteId) : null;
        const result = await staffService.importStaffFromExcel(req.file.buffer, req.user, targetSiteId);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.importStaff = importStaff;
