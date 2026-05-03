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
exports.deleteArea = exports.updateArea = exports.createArea = exports.getArea = exports.getAreas = void 0;
const areaService = __importStar(require("./area.service"));
const getAreas = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortBy = req.query.sortBy || "nombre";
        const order = req.query.order || "asc";
        const skip = (page - 1) * limit;
        if (isNaN(limit) || limit === 0 || req.query.limit === undefined || req.query.limit === '0') {
            const areas = await areaService.getAllAreas(req.user);
            return res.json(areas);
        }
        const { areas, totalCount } = await areaService.getAreas({ skip, take: limit, sortBy, order }, req.user);
        res.json({ data: areas, totalCount: totalCount, currentPage: page, totalPages: Math.ceil(totalCount / limit) });
    }
    catch (error) {
        next(error);
    }
};
exports.getAreas = getAreas;
const getArea = async (req, res, next) => {
    try {
        const area = await areaService.getAreaById(String(req.params.id), req.user);
        if (!area)
            return res.status(404).json({ message: "Area not found" });
        res.json(area);
    }
    catch (error) {
        next(error);
    }
};
exports.getArea = getArea;
const createArea = async (req, res, next) => {
    try {
        const area = await areaService.createArea(req.body, req.user);
        res.status(201).json(area);
    }
    catch (error) {
        next(error);
    }
};
exports.createArea = createArea;
const updateArea = async (req, res, next) => {
    try {
        const area = await areaService.updateArea(String(req.params.id), req.body, req.user);
        res.json(area);
    }
    catch (error) {
        next(error);
    }
};
exports.updateArea = updateArea;
const deleteArea = async (req, res, next) => {
    try {
        const result = await areaService.deleteArea(String(req.params.id), req.user);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.deleteArea = deleteArea;
