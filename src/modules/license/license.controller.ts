import { Request, Response, NextFunction } from "express";
import * as licenseService from "../../core/security/license.service";

export const activateLicense = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const activationKey = (req.body as any).activationKey;
        if (!activationKey) {
            return res.status(400).json({ error: "Inserta la Key de activación provista por Aura Core." });
        }
        
        const result = await licenseService.activateAura(activationKey);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
