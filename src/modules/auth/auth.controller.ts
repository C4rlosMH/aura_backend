import { Response, NextFunction } from "express";
import bcrypt from "bcryptjs"; 
import * as authService from "./auth.service";
import { AuthRequest } from "./auth.types";
import ExcelJS from "exceljs";

const sanitizeUsername = (text: string) => {
    if (!text) return "";
    return text.trim().toLowerCase().replace(/\s+/g, '');
};

export const login = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
  } catch (error: any) {
    if (error.message.includes("identidad") || error.message.includes("Credenciales")) {
        return res.status(401).json({ error: "Credenciales inválidas en Aura." });
    }
    next(error);
  }
};

export const createUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
    }, req.user!);

    const { password: _, ...rest } = createdUser as any;
    res.status(201).json(rest);
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY' || error.message.includes('Duplicate')) {
        return res.status(400).json({ error: "El correo o usuario ya existe en otra identidad de Aura." });
    }
    res.status(400).json({ error: error.message });
  }
};

export const updateUserController = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const bodyData = {
           ...req.body,
           username: sanitizeUsername(req.body.username),
           email: req.body.email ? req.body.email.trim() : undefined,
        };

        const updatedUser = await authService.updateUser(String(id), bodyData, req.user!);
        
        const { password: _, ...rest } = updatedUser as any;
        res.json(rest);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export const updatePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.trim() === "") {
      return res.status(400).json({ error: "La contraseña es obligatoria en Aura." });
    }

    const requestingUser = req.user!; 
    const isSelf = requestingUser.id === Number(id);
    const isAdmin = ['AURA_ROOT', 'SITE_ADMIN'].includes(requestingUser.rol);

    if (!isSelf && !isAdmin) {
        return res.status(403).json({ error: "No tienes permiso para alterar credenciales en Aura." });
    }

    await authService.updateUser(String(id), { password }, req.user!);
    return res.status(200).json({ message: "Contraseña actualizada en Aura correctamente." });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, search = "", sortBy = "nombre", order = "asc" } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    const result = await authService.getUsers({
       skip, take: Number(limit), search, sortBy, order
    }, req.user!);

    const sanitizedUsers = result.users.map((u: any) => { const { password, ...rest } = u; return rest; });
    res.json({ data: sanitizedUsers, totalCount: result.totalCount });
  } catch (error) { next(error); }
};

export const getUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const user = await authService.getUserById(String(req.params.id), req.user!);
        if(!user) return res.status(404).json({error: "Identidad Aura no encontrada"});
        const { password, ...rest } = user as any;
        res.json(rest);
    } catch (error) { next(error); }
}

export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try { 
        await authService.deleteUser(String(req.params.id), req.user!); 
        res.json({ message: "Identidad revivida de Aura" }); 
    } catch (error: any) { 
        res.status(400).json({ error: error.message }); 
    }
}

export const exportSystemUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const result = await authService.getUsers({ skip: 0, take: 100000 }, req.user!);
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Aura Identities");
        worksheet.columns = [
          { header: "ID", key: "id" }, 
          { header: "Nombre", key: "nombre" }, 
          { header: "Usuario", key: "username" },
          { header: "Rol", key: "rol" }
        ];
        
        result.users.forEach((u: any) => worksheet.addRow(u));
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=aura_users.xlsx");
        await workbook.xlsx.write(res); res.end();
    } catch (error) { next(error); }
};


