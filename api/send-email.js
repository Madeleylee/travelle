// api/send-email.js
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    // Solo permitir método POST
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    try {
        const { to, subject, html } = req.body;

        // Validar campos requeridos
        if (!to || !subject || !html) {
            return res.status(400).json({ success: false, error: "Missing required fields" });
        }

        // Configurar el transporter de Nodemailer
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: parseInt(process.env.SMTP_PORT || "587"),
            secure: process.env.SMTP_SECURE === "true",
            auth: {
                user: process.env.SMTP_USERNAME,
                pass: process.env.SMTP_PASSWORD,
            },
        });

        // Configurar el correo
        const mailOptions = {
            from: `"Travelle" <${process.env.SMTP_USERNAME}>`,
            to,
            subject,
            html,
        };

        // Enviar el correo
        const info = await transporter.sendMail(mailOptions);

        return res.status(200).json({
            success: true,
            messageId: info.messageId,
        });
    } catch (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Error sending email",
        });
    }
}