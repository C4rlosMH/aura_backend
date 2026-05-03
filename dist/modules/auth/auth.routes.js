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
const express_1 = require("express");
const authController = __importStar(require("./auth.controller"));
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const validateHelper_1 = require("../../core/middlewares/validateHelper");
const router = (0, express_1.Router)();
// Rutas Públicas (No requieren Token de Aura)
router.post("/login", authController.login);
// Middlewares Globales
router.use(auth_middleware_1.authenticateJWT);
// Rutas Protegidas
router.get("/", authController.getUsers);
router.get("/export", (0, auth_middleware_1.verifyRole)(['AURA_ROOT', 'AURA_SUPPORT', 'SITE_ADMIN']), authController.exportSystemUsers);
router.get("/:id", validateHelper_1.validateId, authController.getUser);
// Solo ROOT o ADMIN pueden crear usuarios en Aura
router.post("/", (0, auth_middleware_1.verifyRole)(['AURA_ROOT', 'SITE_ADMIN']), authController.createUser);
router.put("/:id/password", validateHelper_1.validateId, authController.updatePassword);
router.put("/:id", validateHelper_1.validateId, (0, auth_middleware_1.verifyRole)(['AURA_ROOT', 'SITE_ADMIN']), authController.updateUserController);
// Solo ROOT o CORP pueden eliminar cuentas enteras
router.delete("/:id", validateHelper_1.validateId, (0, auth_middleware_1.verifyRole)(['AURA_ROOT', 'AURA_SUPPORT']), authController.deleteUser);
exports.default = router;
