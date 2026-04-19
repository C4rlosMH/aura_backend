import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || "smtp.aura-system.com",
  port: Number(process.env.MAIL_PORT) || 587,
  secure: false, 
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const sendMaintenanceReminder = async (maintenance: any, manager: any, daysLeft: number) => {
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
  } catch (err) {
    console.error("Aura Mail Error:", err);
  }
};
