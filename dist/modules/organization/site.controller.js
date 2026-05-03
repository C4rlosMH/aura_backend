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
exports.deleteSite = exports.updateSite = exports.createSite = exports.getAllSitesAdmin = exports.getAvailableSites = void 0;
const siteService = __importStar(require("./site.service"));
const constants_js_1 = require("../../config/constants.js");
const getAvailableSites = async (req, res, next) => {
    try {
        const user = req.user;
        if (user.rol === constants_js_1.ROLES.AURA_ROOT || user.rol === constants_js_1.ROLES.AURA_SUPPORT) {
            const sites = await siteService.getAllSites(user);
            return res.json(sites.map(h => ({ id: h.id, nombre: h.nombre, codigo: h.codigo })));
        }
        if (user.sites && user.sites.length > 0) {
            return res.json(user.sites);
        }
        return res.json([]);
    }
    catch (error) {
        next(error);
    }
};
exports.getAvailableSites = getAvailableSites;
const getAllSitesAdmin = async (req, res, next) => {
    try {
        const sites = await siteService.getAllSites(req.user);
        res.json(sites);
    }
    catch (error) {
        console.error("Error en getAllSitesAdmin:", error);
        next(error);
    }
};
exports.getAllSitesAdmin = getAllSitesAdmin;
const createSite = async (req, res, next) => {
    try {
        const site = await siteService.createSite(req.body, req.user);
        res.status(201).json(site);
    }
    catch (error) {
        next(error);
    }
};
exports.createSite = createSite;
const updateSite = async (req, res, next) => {
    try {
        const site = await siteService.updateSite(String(req.params.id), req.body, req.user);
        res.json(site);
    }
    catch (error) {
        next(error);
    }
};
exports.updateSite = updateSite;
const deleteSite = async (req, res, next) => {
    try {
        await siteService.deleteSite(String(req.params.id), req.user);
        res.json({ message: "Site eliminado correctamente" });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteSite = deleteSite;
