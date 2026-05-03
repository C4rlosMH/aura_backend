"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMaintenanceReminder = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    host: process.env.MAIL_HOST || "smtp.aura-system.com",
    port: Number(process.env.MAIL_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});
const sendMaintenanceReminder = async (maintenance, manager, daysLeft) => {
    const mailOptions = {
        from: '"Aura Automated Assistant" <system@aura-system.com>',
        to: manager.correo,
        subject: `[Aura Alert] Mantenimiento en ${daysLeft} días - ${maintenance.device?.nombre_equipo}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #2b3a4a;">Notificación Aura</h2>
        <p>El equipo <strong>${maintenance.device?.nombre_equipo}</strong> tiene un mantenimiento programado dentro de <strong>${daysLeft} días</strong>.</p>
      </div>
    `
    };
    try {
        await transporter.sendMail(mailOptions);
    }
    catch (err) {
        console.error("Aura Mail Error:", err);
    }
};
exports.sendMaintenanceReminder = sendMaintenanceReminder;
