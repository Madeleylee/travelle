/**
 * Email service with fallback for development environment
 * This service handles sending emails for password recovery and notifications
 */

/**
 * Sends a password recovery email
 * @param {string} email - Recipient's email address
 * @param {string} token - Recovery token
 * @returns {Promise<Object>} - Result of the email sending operation
 */
export async function enviarCorreoRecuperacion(email, token) {
  try {
    // Recovery URL with token
    const resetUrl = `${window.location.origin}/reset-password/${token}`

    // Show sending notification
    const sendingNotification = showNotification("Sending email", `Sending recovery email to ${email}...`, "info")

    // In development, create a mock response instead of making an API call
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      console.log("Development environment detected - using mock email service")
      console.log("Would send email to:", email)
      console.log("With reset URL:", resetUrl)

      // Remove sending notification after a delay to simulate network request
      setTimeout(() => {
        if (document.body.contains(sendingNotification)) {
          sendingNotification.remove()
        }

        // Show success notification
        showNotification(
          "Email sent (DEV MODE)",
          `In production, a recovery email would be sent to ${email}`,
          "success",
          5000,
        )
      }, 1500)

      // Return mock success response
      return {
        success: true,
        data: {
          messageId: "mock-message-id-" + Date.now(),
          development: true,
        },
      }
    }

    // For production, make the actual API call
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
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
      }),
    })

    // Remove sending notification
    if (document.body.contains(sendingNotification)) {
      sendingNotification.remove()
    }

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to send email")
    }

    const result = await response.json()

    // Show success notification
    showNotification("Email sent", `A recovery email has been sent to ${email}`, "success", 5000)

    return { success: true, data: result }
  } catch (error) {
    console.error("Error sending recovery email:", error)

    // Show error notification
    showNotification("Error", `Failed to send email: ${error.message}`, "error", 10000)

    return { success: false, error: error.message }
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
    // In development, create a mock response instead of making an API call
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      console.log("Development environment detected - using mock email service")
      console.log("Would send email to:", email)
      console.log("With subject:", subject)
      console.log("With message:", message)

      // Return mock success response
      return {
        success: true,
        data: {
          messageId: "mock-message-id-" + Date.now(),
          development: true,
        },
      }
    }

    // For production, make the actual API call
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: email,
        subject,
        html: `
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
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to send email")
    }

    const result = await response.json()
    return { success: true, data: result }
  } catch (error) {
    console.error("Error sending notification email:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Helper function to show notifications
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, info)
 * @param {number} duration - Duration in milliseconds
 * @returns {HTMLElement} - The notification element
 */
function showNotification(title, message, type = "info", duration = 0) {
  // Create notification element
  const notification = document.createElement("div")
  notification.style.position = "fixed"
  notification.style.top = "20px"
  notification.style.right = "20px"
  notification.style.zIndex = "10000"
  notification.style.maxWidth = "400px"
  notification.style.fontFamily = "Arial, sans-serif"
  notification.style.padding = "15px"
  notification.style.borderRadius = "5px"
  notification.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)"

  // Set colors based on type
  switch (type) {
    case "success":
      notification.style.backgroundColor = "#4CAF50"
      notification.style.color = "white"
      break
    case "error":
      notification.style.backgroundColor = "#f44336"
      notification.style.color = "white"
      break
    case "info":
    default:
      notification.style.backgroundColor = "#2196F3"
      notification.style.color = "white"
  }

  notification.innerHTML = `
    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
      <strong>${title}</strong>
      <span style="cursor: pointer;" onclick="this.parentNode.parentNode.remove()">✕</span>
    </div>
    <p style="margin: 0;">${message}</p>
  `

  document.body.appendChild(notification)

  // Remove notification after specified duration
  if (duration > 0) {
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.remove()
      }
    }, duration)
  }

  return notification
}
