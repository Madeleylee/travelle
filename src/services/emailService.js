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
      from: "Travelle <noreply@yourdomain.com>", // Change to your verified domain in Resend
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