import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createInvoiceBatch } from "./invoice.controller";
import { authenticateJWT, verifyRole } from "../../middlewares/auth.middleware";
import { ROLES } from "../../config/constants.js";

const router = Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = "uploads/facturas/";
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 } 
});

const canModifyInvoices = [
    ROLES.AURA_ROOT, ROLES.CORP_ADMIN, ROLES.SITE_ADMIN, 
    ROLES.SITE_STAFF, ROLES.SITE_AUX, ROLES.AURA_SUPPORT
];
router.post("/batch", 
    authenticateJWT, 
    verifyRole(canModifyInvoices), 
    upload.single("pdf"), 
    createInvoiceBatch
);

export default router;