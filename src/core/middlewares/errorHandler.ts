import { Request, Response, NextFunction } from "express";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Aura Core Error:", err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: Object.values(err.errors).map((e: any) => e.message) });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: "No autorizado en Aura." });
  }

  res.status(500).json({ error: "Aura System Failure: " + (err.message || "Error Interno del Servidor") });
};
