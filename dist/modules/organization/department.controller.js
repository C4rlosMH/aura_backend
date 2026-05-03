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
exports.deleteDepartment = exports.updateDepartment = exports.createDepartment = exports.getDepartment = exports.getDepartments = void 0;
const departmentService = __importStar(require("./department.service"));
const getDepartments = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortBy = req.query.sortBy || "nombre";
        const order = req.query.order || "asc";
        const skip = (page - 1) * limit;
        if (isNaN(limit) || limit === 0 || req.query.limit === undefined || req.query.limit === '0') {
            const departments = await departmentService.getAllDepartments(req.user);
            return res.json(departments);
        }
        const { departments, totalCount } = await departmentService.getDepartments({ skip, take: limit, sortBy, order }, req.user);
        res.json({ data: departments, totalCount: totalCount, currentPage: page, totalPages: Math.ceil(totalCount / limit) });
    }
    catch (error) {
        next(error);
    }
};
exports.getDepartments = getDepartments;
const getDepartment = async (req, res, next) => {
    try {
        const department = await departmentService.getDepartmentById(String(req.params.id), req.user);
        if (!department)
            return res.status(404).json({ message: "Department not found" });
        res.json(department);
    }
    catch (error) {
        next(error);
    }
};
exports.getDepartment = getDepartment;
const createDepartment = async (req, res, next) => {
    try {
        const department = await departmentService.createDepartment(req.body, req.user);
        res.status(201).json(department);
    }
    catch (error) {
        next(error);
    }
};
exports.createDepartment = createDepartment;
const updateDepartment = async (req, res, next) => {
    try {
        const department = await departmentService.updateDepartment(String(req.params.id), req.body, req.user);
        res.json(department);
    }
    catch (error) {
        next(error);
    }
};
exports.updateDepartment = updateDepartment;
const deleteDepartment = async (req, res, next) => {
    try {
        const result = await departmentService.deleteDepartment(String(req.params.id), req.user);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.deleteDepartment = deleteDepartment;
