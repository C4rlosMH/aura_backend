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
exports.exportSystemUsers = exports.deleteUser = exports.getUser = exports.getUsers = exports.updatePassword = exports.updateUserController = exports.createUser = exports.login = void 0;
const authService = __importStar(require("./auth.service"));
const exceljs_1 = __importDefault(require("exceljs"));
const sanitizeUsername = (text) => {
    if (!text)
        return "";
    return text.trim().toLowerCase().replace(/\s+/g, '');
};
const login = async (req, res, next) => {
    try {
        const { password, identifier } = req.body;
        const cleanPassword = password ? password.trim() : "";
        const cleanIdentifier = sanitizeUsername(identifier);
        const result = await authService.loginUser({ identifier: cleanIdentifier, password: cleanPassword });
        // Removemos validacion redundante, auth.service ya escupe errores
        res.json({
            message: "Bienvenido a Aura",
            token: result.token,
            user: { ...result.user, password: "" },
        });
    }
    catch (error) {
        if (error.message.includes("identidad") || error.message.includes("Credenciales")) {
            return res.status(401).json({ error: "Credenciales inválidas en Aura." });
        }
        next(error);
    }
};
exports.login = login;
const createUser = async (req, res, next) => {
    try {
        const { nombre, rol, siteIds, email, password, username } = req.body;
        const cleanUsername = sanitizeUsername(username);
        const cleanEmail = email ? email.trim() : "";
        const cleanPassword = password ? password.trim() : "";
        if (cleanUsername.length < 3) {
            return res.status(400).json({ error: "El usuario debe tener al menos 3 caracteres." });
        }
        const createdUser = await authService.registerUser({
            username: cleanUsername,
            email: cleanEmail,
            password: cleanPassword,
            nombre,
            rol,
            siteIds
        }, req.user);
        const { password: _, ...rest } = createdUser;
        res.status(201).json(rest);
    }
    catch (error) {
        if (error.code === 'ER_DUP_ENTRY' || error.message.includes('Duplicate')) {
            return res.status(400).json({ error: "El correo o usuario ya existe en otra identidad de Aura." });
        }
        res.status(400).json({ error: error.message });
    }
};
exports.createUser = createUser;
const updateUserController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const bodyData = {
            ...req.body,
            username: sanitizeUsername(req.body.username),
            email: req.body.email ? req.body.email.trim() : undefined,
        };
        const updatedUser = await authService.updateUser(String(id), bodyData, req.user);
        const { password: _, ...rest } = updatedUser;
        res.json(rest);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.updateUserController = updateUserController;
const updatePassword = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { password } = req.body;
        if (!password || password.trim() === "") {
            return res.status(400).json({ error: "La contraseña es obligatoria en Aura." });
        }
        const requestingUser = req.user;
        const isSelf = requestingUser.id === Number(id);
        const isAdmin = ['AURA_ROOT', 'SITE_ADMIN'].includes(requestingUser.rol);
        if (!isSelf && !isAdmin) {
            return res.status(403).json({ error: "No tienes permiso para alterar credenciales en Aura." });
        }
        await authService.updateUser(String(id), { password }, req.user);
        return res.status(200).json({ message: "Contraseña actualizada en Aura correctamente." });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.updatePassword = updatePassword;
const getUsers = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search = "", sortBy = "nombre", order = "asc" } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const result = await authService.getUsers({
            skip, take: Number(limit), search, sortBy, order
        }, req.user);
        const sanitizedUsers = result.users.map((u) => { const { password, ...rest } = u; return rest; });
        res.json({ data: sanitizedUsers, totalCount: result.totalCount });
    }
    catch (error) {
        next(error);
    }
};
exports.getUsers = getUsers;
const getUser = async (req, res, next) => {
    try {
        const user = await authService.getUserById(String(req.params.id), req.user);
        if (!user)
            return res.status(404).json({ error: "Identidad Aura no encontrada" });
        const { password, ...rest } = user;
        res.json(rest);
    }
    catch (error) {
        next(error);
    }
};
exports.getUser = getUser;
const deleteUser = async (req, res, next) => {
    try {
        await authService.deleteUser(String(req.params.id), req.user);
        res.json({ message: "Identidad revivida de Aura" });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.deleteUser = deleteUser;
const exportSystemUsers = async (req, res, next) => {
    try {
        const result = await authService.getUsers({ skip: 0, take: 100000 }, req.user);
        const workbook = new exceljs_1.default.Workbook();
        const worksheet = workbook.addWorksheet("Aura Identities");
        worksheet.columns = [
            { header: "ID", key: "id" },
            { header: "Nombre", key: "nombre" },
            { header: "Usuario", key: "username" },
            { header: "Rol", key: "rol" }
        ];
        result.users.forEach((u) => worksheet.addRow(u));
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=aura_users.xlsx");
        await workbook.xlsx.write(res);
        res.end();
    }
    catch (error) {
        next(error);
    }
};
exports.exportSystemUsers = exportSystemUsers;
