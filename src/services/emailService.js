/**
 * Email service for sending emails
 */

/**
 * Sends an email using the API
 * @param {string} to - Recipient's email address
 * @param {string} subject - Email subject
 * @param {string} html - Email HTML content
 * @returns {Promise<Object>} - Result of the email sending operation
 */
export async function sendEmail(to, subject, html) {
    try {
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to,
                subject,
                html,
            }),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Sends a password recovery email
 * @param {string} email - Recipient's email address
 * @param {string} token - Recovery token
 * @returns {Promise<Object>} - Result of the email sending operation
 */
export async function enviarCorreoRecuperacion(email, token, baseUrl = window.location.origin) {
    // Recovery URL with token
    const resetUrl = `${baseUrl}/reset-password/${token}`;

    try {
        // Verificar si estamos en desarrollo o producción
        if (import.meta.env.DEV) {
            console.log("=== DEVELOPMENT MODE: EMAIL DETAILS ===");
            console.log(`To: ${email}`);
            console.log(`Subject: Password Recovery - Travelle`);
            console.log(`Recovery link: ${resetUrl}`);
            console.log("=======================================");

            return { success: true, dev: true };
        }

        // Crear el cuerpo del correo HTML
        const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #1e3a8a;">Travelle</h1>
        </div>
        
        <h2 style="color: #1e3a8a; text-align: center;">Recuperación de Contraseña</h2>
        
        <p>Hola,</p>
        
        <p>Has solicitado restablecer tu contraseña en Travelle. Haz clic en el botón de abajo para crear una nueva contraseña:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Restablecer Contraseña
          </a>
        </div>
        
        <p>O copia y pega el siguiente enlace en tu navegador:</p>
        <p style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all;">
          ${resetUrl}
        </p>
        
        <p>Este enlace caducará en 1 hora por razones de seguridad.</p>
        
        <p>Si no solicitaste este cambio, puedes ignorar este correo y tu contraseña permanecerá sin cambios.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #777; font-size: 12px;">
          <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
          <p>&copy; ${new Date().getFullYear()} Travelle. Todos los derechos reservados.</p>
        </div>
      </div>
    `;

        // Enviar el correo usando nuestra API
        return await sendEmail(email, "Recuperación de contraseña - Travelle", emailBody);
    } catch (error) {
        console.error("Error al enviar correo de recuperación:", error);
        return { success: false, error: error.message };
    }
}