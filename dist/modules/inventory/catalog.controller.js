"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOperatingSystems = exports.getDeviceStatuses = exports.getDeviceTypes = void 0;
const database_1 = require("../../core/database");
const inventory_model_1 = require("./inventory.model");
const drizzle_orm_1 = require("drizzle-orm");
const getDeviceTypes = async (req, res, next) => {
    try {
        const list = await database_1.db.query.deviceType.findMany({ where: (0, drizzle_orm_1.isNull)(inventory_model_1.deviceType.deletedAt) });
        res.json(list);
    }
    catch (e) {
        next(e);
    }
};
exports.getDeviceTypes = getDeviceTypes;
const getDeviceStatuses = async (req, res, next) => {
    try {
        const list = await database_1.db.query.deviceStatus.findMany({ where: (0, drizzle_orm_1.isNull)(inventory_model_1.deviceStatus.deletedAt) });
        res.json(list);
    }
    catch (e) {
        next(e);
    }
};
exports.getDeviceStatuses = getDeviceStatuses;
const getOperatingSystems = async (req, res, next) => {
    try {
        const list = await database_1.db.query.operatingSystem.findMany({ where: (0, drizzle_orm_1.isNull)(inventory_model_1.operatingSystem.deletedAt) });
        res.json(list);
    }
    catch (e) {
        next(e);
    }
};
exports.getOperatingSystems = getOperatingSystems;
