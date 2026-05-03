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
exports.deleteDevice = exports.updateDevice = exports.createDevice = exports.getDevice = exports.getDevices = void 0;
const deviceService = __importStar(require("./device.service"));
const getDevices = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const typeIds = req.query.typeIds ? String(req.query.typeIds).split(',').map(Number) : undefined;
        const { devices, totalCount } = await deviceService.getActiveDevices({
            skip, take: limit, search: req.query.search, filter: req.query.filter, sortBy: req.query.sortBy, order: req.query.order, typeIds
        }, req.user);
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
exports.getDevices = getDevices;
const getDevice = async (req, res, next) => {
    try {
        const device = await deviceService.getDeviceById(String(req.params.id), req.user);
        if (!device)
            return res.status(404).json({ error: "Dispositivo no localizado en tu entorno Aura." });
        res.json(device);
    }
    catch (error) {
        next(error);
    }
};
exports.getDevice = getDevice;
const createDevice = async (req, res, next) => {
    try {
        const device = await deviceService.createDevice(req.body, req.user);
        res.status(201).json(device);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.createDevice = createDevice;
const updateDevice = async (req, res, next) => {
    try {
        const device = await deviceService.updateDevice(String(req.params.id), req.body, req.user);
        res.json(device);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.updateDevice = updateDevice;
const deleteDevice = async (req, res, next) => {
    try {
        const r = await deviceService.deleteDevice(String(req.params.id), req.user);
        res.json(r);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.deleteDevice = deleteDevice;
