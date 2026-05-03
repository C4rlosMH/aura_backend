import jwt from "jsonwebtoken";
import { Response, NextFunction } from "express";
import { db } from "../core/database";
import { usersSistema } from "../modules/auth/auth.model";
import { ROLES } from "../config/constants.js";
import { AuthRequest } from "../modules/auth/auth.types";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET!;

export const authenticateJWT = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers["x-access-token"] || req.headers["authorization"];

  if (!token || typeof token !== 'string') {
    return res.status(403).json({ error: "Aura requiere un token para autenticarse" });
  }

  try {
    const bearerToken = token.startsWith("Bearer ") ? token.slice(7, token.length) : token;
    const decoded = jwt.verify(bearerToken, JWT_SECRET) as any;
    
    // Obtenemos el usuario de la DB incluyendo sus conexiones de sitio
    const userRow = await db.query.usersSistema.findFirst({
        where: eq(usersSistema.id, decoded.id),
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
    const mappedSites = (userRow.sitesConnection || []).map((conn: any) => conn.site);
    
    const allowedSiteIds = mappedSites.map((conn: any) => conn.id);
    
    const userContext = {
       ...userRow,
       sites: mappedSites,
       allowedSites: allowedSiteIds
    };

    const siteHeader = req.headers['x-site-id'];

    if (siteHeader && siteHeader !== 'null' && siteHeader !== 'undefined') {
        const requestedSiteId = Number(siteHeader);

        if (userContext.rol !== ROLES.AURA_ROOT && userContext.rol !== ROLES.AURA_SUPPORT && userContext.rol !== ROLES.CORP_VIEWER && userContext.rol !== ROLES.CORP_ADMIN) {
            const hasAccess = userContext.allowedSites.includes(requestedSiteId);
            if (!hasAccess) {
                return res.status(403).json({ error: "Acceso denegado a este entorno de sitio en Aura." });
            }
        }

        (userContext as any).siteId = requestedSiteId;
    }

    req.user = userContext as any;
    
    if (process.env.AURA_SKIP_LICENSE === 'true' && req.user) {
        (req.user as any).rol = ROLES.AURA_ROOT;
    }

    next();
  } catch (err: any) {
    console.error("Auth Middleware Error:", err.message);
    return res.status(401).json({ error: "Sesión expirada o inválida en Aura." });
  }
};

export const verifyRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({ error: "No tienes permisos suficientes en Aura para esta acción." });
    }
    next();
  };
};
