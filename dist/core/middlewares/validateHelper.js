"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateId = exports.validateRequest = void 0;
const express_validator_1 = require("express-validator");
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: "Error de validación en Aura", details: errors.array() });
    }
    next();
};
exports.validateRequest = validateRequest;
exports.validateId = [
    (0, express_validator_1.param)("id").isNumeric().withMessage("Id debe ser numerico"),
    exports.validateRequest
];
