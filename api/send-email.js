// api/send-email.js
import nodemailer from "nodemailer"

export default async function handler(req, res) {
    // Set CORS headers to allow requests from any origin
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")

    // Handle OPTIONS request (preflight)
    if (req.method === "OPTIONS") {
        return res.status(200).end()
    }

    // Only allow POST method
    if (req.method !== "POST") {
        return res.status(405).json({ success: false, error: "Method not allowed" })
    }

    try {
        const { to, subject, html } = req.body

        // Validate required fields
        if (!to || !subject || !html) {
            return res.status(400).json({ success: false, error: "Missing required fields" })
        }

        // Configure Nodemailer transporter
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: Number.parseInt(process.env.SMTP_PORT || "587"),
            secure: process.env.SMTP_SECURE === "true",
            auth: {
                user: process.env.SMTP_USERNAME,
                pass: process.env.SMTP_PASSWORD,
            },
        })

        // Configure email
        const mailOptions = {
            from: `"Travelle" <${process.env.SMTP_USERNAME}>`,
            to,
            subject,
            html,
        }

        // Send email
        const info = await transporter.sendMail(mailOptions)

        return res.status(200).json({
            success: true,
            messageId: info.messageId,
        })
    } catch (error) {
        console.error("Error sending email:", error)
        return res.status(500).json({
            success: false,
            error: error.message || "Error sending email",
        })
    }
}
