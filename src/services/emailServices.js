/**
 * Email service using SMTP.js with Gmail
 * This service handles sending emails for password recovery and notifications
 */

// Configuración de SMTP para Gmail
const SMTP_CONFIG = {
  Host: import.meta.env.VITE_SMTP_HOST || "smtp.gmail.com",
  Username: import.meta.env.VITE_SMTP_USERNAME || "",
  Password: import.meta.env.VITE_SMTP_PASSWORD || "",
  Port: import.meta.env.VITE_SMTP_PORT || 587,
  From: import.meta.env.VITE_SMTP_FROM || "",
  FromName: "Travelle",
}

/**
 * Sends a password recovery email
 * @param {string} email - Recipient's email address
 * @param {string} token - Recovery token
 * @param {string} baseUrl - Base URL of the application
 * @returns {Promise<Object>} - Result of the email sending operation
 */
export async function enviarCorreoRecuperacion(email, token, baseUrl = window.location.origin) {
  // Recovery URL with token
  const resetUrl = `${baseUrl}/reset-password/${token}`

  try {
    console.log(`Sending recovery email to ${email} with reset URL: ${resetUrl}`)

    // Verificar si Email está disponible (SMTP.js)
    if (typeof Email === "undefined") {
      console.error("SMTP.js not loaded. Make sure to include the script in your HTML.")
      return { success: false, error: "SMTP.js not loaded" }
    }

    // Verificar si tenemos las credenciales necesarias
    if (!SMTP_CONFIG.Username || !SMTP_CONFIG.Password) {
      console.error("SMTP credentials not found. Please check your .env file.")

      // Mostrar una notificación de error
      const notification = document.createElement("div")
      notification.style.position = "fixed"
      notification.style.top = "20px"
      notification.style.right = "20px"
      notification.style.backgroundColor = "#f44336"
      notification.style.color = "white"
      notification.style.padding = "15px"
      notification.style.borderRadius = "5px"
      notification.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)"
      notification.style.zIndex = "10000"
      notification.style.maxWidth = "400px"
      notification.style.fontFamily = "Arial, sans-serif"

      notification.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <strong>Error de configuración SMTP</strong>
          <span style="cursor: pointer;" onclick="this.parentNode.parentNode.remove()">✕</span>
        </div>
        <p style="margin: 0;">No se encontraron las credenciales SMTP. Por favor, verifica tu archivo .env</p>
      `

      document.body.appendChild(notification)

      // Eliminar la notificación después de 10 segundos
      setTimeout(() => {
        if (document.body.contains(notification)) {
          notification.remove()
        }
      }, 10000)

      return { success: false, error: "SMTP credentials not found" }
    }

    // Configurar el correo
    const emailConfig = {
      Host: SMTP_CONFIG.Host,
      Username: SMTP_CONFIG.Username,
      Password: SMTP_CONFIG.Password,
      Port: SMTP_CONFIG.Port,
      To: email,
      From: SMTP_CONFIG.From,
      FromName: SMTP_CONFIG.FromName,
      Subject: "Password Recovery - Travelle",
      Body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #1e3a8a;">Travelle</h1>
          </div>
          
          <h2 style="color: #1e3a8a; text-align: center;">Password Recovery</h2>
          
          <p>Hello,</p>
          
          <p>You requested to reset your password on Travelle. Click the button below to create a new password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          
          <p>Or copy and paste the following link in your browser:</p>
          <p style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all;">
            ${resetUrl}
          </p>
          
          <p>This link will expire in 1 hour for security reasons.</p>
          
          <p>If you didn't request this change, you can ignore this email and your password will remain unchanged.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #777; font-size: 12px;">
            <p>This is an automated email, please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} Travelle. All rights reserved.</p>
          </div>
        </div>
      `,
    }

    // Mostrar notificación de envío
    const sendingNotification = document.createElement("div")
    sendingNotification.style.position = "fixed"
    sendingNotification.style.top = "20px"
    sendingNotification.style.right = "20px"
    sendingNotification.style.backgroundColor = "#2196F3"
    sendingNotification.style.color = "white"
    sendingNotification.style.padding = "15px"
    sendingNotification.style.borderRadius = "5px"
    sendingNotification.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)"
    sendingNotification.style.zIndex = "10000"
    sendingNotification.style.maxWidth = "400px"
    sendingNotification.style.fontFamily = "Arial, sans-serif"

    sendingNotification.innerHTML = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
        <strong>Enviando correo</strong>
        <span style="cursor: pointer;" onclick="this.parentNode.parentNode.remove()">✕</span>
      </div>
      <p style="margin: 0;">Enviando correo de recuperación a ${email}...</p>
    `

    document.body.appendChild(sendingNotification)

    // Enviar el correo
    return new Promise((resolve, reject) => {
      if (typeof Email === "undefined") {
        reject({ success: false, error: "SMTP.js not loaded" })
        return
      }
      Email.send(emailConfig).then(
        (message) => {
          console.log("Email sent successfully:", message)

          // Eliminar notificación de envío
          if (document.body.contains(sendingNotification)) {
            sendingNotification.remove()
          }

          // Mostrar notificación de éxito
          const successNotification = document.createElement("div")
          successNotification.style.position = "fixed"
          successNotification.style.top = "20px"
          successNotification.style.right = "20px"
          successNotification.style.backgroundColor = "#4CAF50"
          successNotification.style.color = "white"
          successNotification.style.padding = "15px"
          successNotification.style.borderRadius = "5px"
          successNotification.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)"
          successNotification.style.zIndex = "10000"
          successNotification.style.maxWidth = "400px"
          successNotification.style.fontFamily = "Arial, sans-serif"

          successNotification.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <strong>Correo enviado</strong>
              <span style="cursor: pointer;" onclick="this.parentNode.parentNode.remove()">✕</span>
            </div>
            <p style="margin: 0;">Se ha enviado un correo de recuperación a ${email}</p>
          `

          document.body.appendChild(successNotification)

          // Eliminar la notificación después de 5 segundos
          setTimeout(() => {
            if (document.body.contains(successNotification)) {
              successNotification.remove()
            }
          }, 5000)

          resolve({ success: true, data: message })
        },
        (error) => {
          console.error("Error sending recovery email:", error)

          // Eliminar notificación de envío
          if (document.body.contains(sendingNotification)) {
            sendingNotification.remove()
          }

          // Mostrar notificación de error
          const errorNotification = document.createElement("div")
          errorNotification.style.position = "fixed"
          errorNotification.style.top = "20px"
          errorNotification.style.right = "20px"
          errorNotification.style.backgroundColor = "#f44336"
          errorNotification.style.color = "white"
          errorNotification.style.padding = "15px"
          errorNotification.style.borderRadius = "5px"
          errorNotification.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)"
          errorNotification.style.zIndex = "10000"
          errorNotification.style.maxWidth = "400px"
          errorNotification.style.fontFamily = "Arial, sans-serif"

          errorNotification.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <strong>Error al enviar correo</strong>
              <span style="cursor: pointer;" onclick="this.parentNode.parentNode.remove()">✕</span>
            </div>
            <p style="margin: 0;">Error: ${error}</p>
          `

          document.body.appendChild(errorNotification)

          // Eliminar la notificación después de 10 segundos
          setTimeout(() => {
            if (document.body.contains(errorNotification)) {
              errorNotification.remove()
            }
          }, 10000)

          reject({ success: false, error })
        },
      )
    })
  } catch (error) {
    console.error("Error sending recovery email:", error)
    return { success: false, error }
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
    console.log(`Sending notification email to ${email}`)

    // Verificar si Email está disponible (SMTP.js)
    if (typeof Email === "undefined") {
      console.error("SMTP.js not loaded. Make sure to include the script in your HTML.")
      return { success: false, error: "SMTP.js not loaded" }
    }

    // Verificar si tenemos las credenciales necesarias
    if (!SMTP_CONFIG.Username || !SMTP_CONFIG.Password) {
      console.error("SMTP credentials not found. Please check your .env file.")
      return { success: false, error: "SMTP credentials not found" }
    }

    // Configurar el correo
    const emailConfig = {
      Host: SMTP_CONFIG.Host,
      Username: SMTP_CONFIG.Username,
      Password: SMTP_CONFIG.Password,
      Port: SMTP_CONFIG.Port,
      To: email,
      From: SMTP_CONFIG.From,
      FromName: SMTP_CONFIG.FromName,
      Subject: subject,
      Body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #1e3a8a;">Travelle</h1>
          </div>
          
          <div style="margin-bottom: 20px;">
            ${message}
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #777; font-size: 12px;">
            <p>This is an automated email, please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} Travelle. All rights reserved.</p>
          </div>
        </div>
      `,
    }

    // Enviar el correo
    return new Promise((resolve, reject) => {
      if (typeof Email === "undefined") {
        reject({ success: false, error: "SMTP.js not loaded" })
        return
      }
      Email.send(emailConfig).then(
        (message) => {
          console.log("Email sent successfully:", message)
          resolve({ success: true, data: message })
        },
        (error) => {
          console.error("Error sending notification email:", error)
          reject({ success: false, error })
        },
      )
    })
  } catch (error) {
    console.error("Error sending notification email:", error)
    return { success: false, error }
  }
}
