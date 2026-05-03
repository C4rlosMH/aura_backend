"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    console.error("Aura Core Error:", err);
    if (err.name === 'ValidationError') {
        return res.status(400).json({ error: Object.values(err.errors).map((e) => e.message) });
    }
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({ error: "No autorizado en Aura." });
    }
    res.status(500).json({ error: "Aura System Failure: " + (err.message || "Error Interno del Servidor") });
};
exports.errorHandler = errorHandler;
