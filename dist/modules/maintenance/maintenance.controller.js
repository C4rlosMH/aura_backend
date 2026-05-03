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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMaintenance = exports.updateMaintenance = exports.createMaintenance = exports.getMaintenance = exports.getMaintenances = void 0;
const maintenanceService = __importStar(require("./maintenance.service"));
const getMaintenances = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const { maintenances, totalCount } = await maintenanceService.getMaintenances({ skip, take: limit, sortBy: req.query.sortBy, order: req.query.order }, req.user);
        res.json({ data: maintenances, totalCount, currentPage: page, totalPages: Math.ceil(totalCount / limit) });
    }
    catch (error) {
        next(error);
    }
};
exports.getMaintenances = getMaintenances;
const getMaintenance = async (req, res, next) => {
    try {
        const m = await maintenanceService.getMaintenanceById(String(req.params.id), req.user);
        if (!m)
            return res.status(404).json({ error: "No encontrado" });
        res.json(m);
    }
    catch (error) {
        next(error);
    }
};
exports.getMaintenance = getMaintenance;
const createMaintenance = async (req, res, next) => {
    try {
        res.status(201).json(await maintenanceService.createMaintenance(req.body, req.user));
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
exports.createMaintenance = createMaintenance;
const updateMaintenance = async (req, res, next) => {
    try {
        res.json(await maintenanceService.updateMaintenance(String(req.params.id), req.body, req.user));
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
exports.updateMaintenance = updateMaintenance;
const deleteMaintenance = async (req, res, next) => {
    try {
        res.json(await maintenanceService.deleteMaintenance(String(req.params.id), req.user));
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
exports.deleteMaintenance = deleteMaintenance;
