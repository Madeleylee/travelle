import { Resend } from "resend"

// Initialize Resend with the API key from environment variables
const resendApiKey = import.meta.env.VITE_RESEND_API_KEY
const resend = new Resend(resendApiKey)

/**
 * Sends a notification email
 * @param {string} email - Recipient's email address
 * @param {string} subject - Email subject
 * @param {string} message - Email message content
 * @returns {Promise<Object>} - Result of the email sending operation
 */
export async function enviarCorreoNotificacion(email, subject, message) {
  try {
    console.log(`Sending notification email to ${email} with subject: ${subject}`)

    // If no API key is set, log a message and return success for development
    if (!resendApiKey) {
      console.warn("No Resend API key found. In production, set the VITE_RESEND_API_KEY environment variable.")
      console.info(`[DEV MODE] Notification email would be sent to ${email}`)
      console.info(`Subject: ${subject}`)
      console.info(`Message: ${message}`)
      return { success: true, dev: true }
    }

    const { data, error } = await resend.emails.send({
      from: "Travelle <onboarding@resend.dev>", // Dominio compartido de Resend
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #1e3a8a;">Travelle</h1>
          </div>
          
          <h2 style="color: #1e3a8a; text-align: center;">${subject}</h2>
          
          <div style="padding: 15px; background-color: #f5f5f5; border-radius: 4px; margin: 20px 0;">
            ${message}
          </div>
          
          <p>If you did not perform this action, please contact our support team immediately.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #777; font-size: 12px;">
            <p>This is an automated email, please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} Travelle. All rights reserved.</p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error("Error sending notification email with Resend:", error)
      return { success: false, error }
    }

    console.log("Notification email sent successfully:", data)
    return { success: true, data }
  } catch (error) {
    console.error("Error sending notification email:", error)
    return { success: false, error }
  }
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

    // If no API key is set, log a message and return success for development
    if (!resendApiKey) {
      console.warn("No Resend API key found. In production, set the VITE_RESEND_API_KEY environment variable.")
      console.info(`[DEV MODE] Recovery link: ${resetUrl}`)
      return { success: true, dev: true }
    }

    const { data, error } = await resend.emails.send({
      from: "Travelle <onboarding@resend.dev>", // Dominio compartido de Resend
      to: email,
      subject: "Password Recovery - Travelle",
      html: `
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
    })

    if (error) {
      console.error("Error sending email with Resend:", error)
      return { success: false, error }
    }

    console.log("Email sent successfully:", data)
    return { success: true, data }
  } catch (error) {
    console.error("Error sending recovery email:", error)
    return { success: false, error }
  }
}