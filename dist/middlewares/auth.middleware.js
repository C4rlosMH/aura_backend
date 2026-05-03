"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRole = exports.authenticateJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../core/database");
const auth_model_1 = require("../modules/auth/auth.model");
const constants_js_1 = require("../config/constants.js");
const drizzle_orm_1 = require("drizzle-orm");
const JWT_SECRET = process.env.JWT_SECRET;
const authenticateJWT = async (req, res, next) => {
    const token = req.headers["x-access-token"] || req.headers["authorization"];
    if (!token || typeof token !== 'string') {
        return res.status(403).json({ error: "Aura requiere un token para autenticarse" });
    }
    try {
        const bearerToken = token.startsWith("Bearer ") ? token.slice(7, token.length) : token;
        const decoded = jsonwebtoken_1.default.verify(bearerToken, JWT_SECRET);
        // Obtenemos el usuario de la DB incluyendo sus conexiones de sitio
        const userRow = await database_1.db.query.usersSistema.findFirst({
            where: (0, drizzle_orm_1.eq)(auth_model_1.usersSistema.id, decoded.id),
            with: {
                sitesConnection: {
                    with: { site: true }
                }
            }
        });
        if (!userRow) {
            return res.status(401).json({ error: "Identidad de Aura no encontrada o token inválido." });
        }
        if (userRow.deletedAt) {
            return res.status(401).json({ error: "Cuenta desactivada del sistema Aura." });
        }
        // Mapear los sitios del pivot a la estructura plana esperada
        const mappedSites = (userRow.sitesConnection || []).map((conn) => conn.site);
        const allowedSiteIds = mappedSites.map((conn) => conn.id);
        const userContext = {
            ...userRow,
            sites: mappedSites,
            allowedSites: allowedSiteIds
        };
        const siteHeader = req.headers['x-site-id'];
        if (siteHeader && siteHeader !== 'null' && siteHeader !== 'undefined') {
            const requestedSiteId = Number(siteHeader);
            if (userContext.rol !== constants_js_1.ROLES.AURA_ROOT && userContext.rol !== constants_js_1.ROLES.AURA_SUPPORT && userContext.rol !== constants_js_1.ROLES.CORP_VIEWER && userContext.rol !== constants_js_1.ROLES.CORP_ADMIN) {
                const hasAccess = userContext.allowedSites.includes(requestedSiteId);
                if (!hasAccess) {
                    return res.status(403).json({ error: "Acceso denegado a este entorno de sitio en Aura." });
                }
            }
            userContext.siteId = requestedSiteId;
        }
        req.user = userContext;
        if (process.env.AURA_SKIP_LICENSE === 'true' && req.user) {
            req.user.rol = constants_js_1.ROLES.AURA_ROOT;
        }
        next();
    }
    catch (err) {
        console.error("Auth Middleware Error:", err.message);
        return res.status(401).json({ error: "Sesión expirada o inválida en Aura." });
    }
};
exports.authenticateJWT = authenticateJWT;
const verifyRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.rol)) {
            return res.status(403).json({ error: "No tienes permisos suficientes en Aura para esta acción." });
        }
        next();
    };
};
exports.verifyRole = verifyRole;
