/**
 * Email service using API endpoint
 */

/**
 * Sends a password recovery email
 * @param {string} email - Recipient's email address
 * @param {string} token - Recovery token
 * @param {string} baseUrl - Base URL of the application
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

      // Mostrar una notificación al usuario con el enlace
      if (typeof window !== "undefined") {
        const notification = document.createElement("div");
        notification.style.position = "fixed";
        notification.style.top = "20px";
        notification.style.right = "20px";
        notification.style.backgroundColor = "#1e3a8a";
        notification.style.color = "white";
        notification.style.padding = "15px";
        notification.style.borderRadius = "5px";
        notification.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
        notification.style.zIndex = "10000";
        notification.style.maxWidth = "400px";
        notification.style.fontFamily = "Arial, sans-serif";

        notification.innerHTML = `
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <strong>Correo de recuperación simulado</strong>
            <span style="cursor: pointer;" onclick="this.parentNode.parentNode.remove()">✕</span>
          </div>
          <p style="margin: 0 0 10px 0;">Se ha generado un enlace de recuperación para: ${email}</p>
          <a href="${resetUrl}" style="color: white; text-decoration: underline; word-break: break-all;">${resetUrl}</a>
        `;

        document.body.appendChild(notification);

        // Eliminar la notificación después de 30 segundos
        setTimeout(() => {
          if (document.body.contains(notification)) {
            notification.remove();
          }
        }, 30000);
      }

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

    // Usar la API para enviar el correo
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        subject: "Recuperación de contraseña - Travelle",
        html: emailBody,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Error al enviar correo');
    }

    return { success: true };
  } catch (error) {
    console.error("Error al enviar correo de recuperación:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Sends a notification email
 * @param {string} email - Recipient's email address
 * @param {string} subject - Email subject
 * @param {string} message - Email message content
 * @returns {Promise<Object>} - Result of the email sending operation
 */
export async function enviarCorreoNotificacion(email, subject, message) {
  try {
    // Verificar si estamos en desarrollo o producción
    if (import.meta.env.DEV) {
      console.log("=== DEVELOPMENT MODE: EMAIL DETAILS ===");
      console.log(`To: ${email}`);
      console.log(`Subject: ${subject}`);
      console.log(`Message: ${message}`);
      console.log("=======================================");

      // Mostrar una notificación al usuario
      if (typeof window !== "undefined") {
        const notification = document.createElement("div");
        notification.style.position = "fixed";
        notification.style.top = "20px";
        notification.style.right = "20px";
        notification.style.backgroundColor = "#4caf50";
        notification.style.color = "white";
        notification.style.padding = "15px";
        notification.style.borderRadius = "5px";
        notification.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
        notification.style.zIndex = "10000";
        notification.style.maxWidth = "400px";
        notification.style.fontFamily = "Arial, sans-serif";

        notification.innerHTML = `
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <strong>Notificación simulada: ${subject}</strong>
            <span style="cursor: pointer;" onclick="this.parentNode.parentNode.remove()">✕</span>
          </div>
          <p style="margin: 0;">Destinatario: ${email}</p>
          <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.3);">
            ${message}
          </div>
        `;

        document.body.appendChild(notification);

        // Eliminar la notificación después de 10 segundos
        setTimeout(() => {
          if (document.body.contains(notification)) {
            notification.remove();
          }
        }, 10000);
      }

      return { success: true, dev: true };
    }

    // Crear el cuerpo del correo HTML
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #1e3a8a;">Travelle</h1>
        </div>
        
        <div style="margin-bottom: 20px;">
          ${message}
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #777; font-size: 12px;">
          <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
          <p>&copy; ${new Date().getFullYear()} Travelle. Todos los derechos reservados.</p>
        </div>
      </div>
    `;

    // Usar la API para enviar el correo
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        subject: subject,
        html: emailBody,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Error al enviar correo');
    }

    return { success: true };
  } catch (error) {
    console.error("Error al enviar correo de notificación:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Utility function to test email sending
 * @returns {Promise<Object>} - Result of the test
 */
export async function testEmailService() {
  try {
    const testEmail = prompt("Ingresa un correo para la prueba:", "");

    if (!testEmail) {
      return { success: false, error: "No se proporcionó un correo de prueba" };
    }

    console.log("Iniciando prueba de envío de correo a:", testEmail);

    const result = await enviarCorreoNotificacion(
      testEmail,
      "Prueba de servicio de correo",
      `<h2>¡Prueba exitosa!</h2>
       <p>Si estás viendo este correo, el servicio de correo de Travelle está funcionando correctamente.</p>
       <p>Fecha y hora de la prueba: ${new Date().toLocaleString()}</p>`
    );

    console.log("Resultado de la prueba:", result);
    return result;
  } catch (error) {
    console.error("Error en la prueba del servicio de correo:", error);
    return { success: false, error: error.message };
  }
}