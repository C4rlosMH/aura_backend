import { validationResult, param } from "express-validator";
import { Request, Response, NextFunction } from "express";

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: "Error de validación en Aura", details: errors.array() });
    }
    next();
};

export const validateId = [
    param("id").isNumeric().withMessage("Id debe ser numerico"),
    validateRequest
];
