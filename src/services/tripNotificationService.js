"use client"

/**
 * Servicio de notificaciones para viajes
 * Gestiona el envío de recordatorios y felicitaciones para viajes
 */

import { useTripLists } from "@/composables/useTripLists"
import { useAuth } from "@/composables/useAuth"
import { ref } from "vue"

// Importación dinámica para evitar problemas de SSR/CSR
const importEmailService = async () => {
    return await import("@/services/emailServices")
}

/**
 * Verifica las listas de viaje y envía notificaciones según corresponda
 * @returns {Promise<Object>} Resultado de la verificación
 */
export async function checkTripsAndNotify() {
    try {
        // Verificar si el usuario está autenticado
        const isAuthenticated = ref(false)
        const user = ref(null)
        const { isUserAuthenticated, getUsuarioActual } = useAuth()

        isAuthenticated.value = isUserAuthenticated()

        if (!isAuthenticated.value) {
            return { success: false, reason: "user-not-authenticated" }
        }

        user.value = getUsuarioActual()
        const { listasOrdenadas, cargarListas } = useTripLists()

        // Cargar las listas de viaje
        await cargarListas()

        // Obtener la fecha actual (sin hora)
        const hoy = new Date()
        hoy.setHours(0, 0, 0, 0)

        // Resultados de las notificaciones
        const results = {
            remindersSent: 0,
            congratulationsSent: 0,
            errors: 0,
        }

        // Verificar cada lista
        for (const lista of listasOrdenadas.value) {
            // Convertir la fecha de inicio a objeto Date y eliminar la hora
            const fechaInicio = new Date(lista.fechaInicio)
            fechaInicio.setHours(0, 0, 0, 0)

            // Calcular la diferencia en días
            const diferenciaDias = Math.floor((fechaInicio - hoy) / (1000 * 60 * 60 * 24))

            // Verificar si es el día del viaje
            const esDiaViaje = diferenciaDias === 0

            // Verificar si es 3 días antes del viaje
            const esTresDiasAntes = diferenciaDias === 3

            // Verificar si es 1 día antes del viaje
            const esUnDiaAntes = diferenciaDias === 1

            // Si es el día del viaje o días previos, verificar el estado de la lista
            if (esDiaViaje || esTresDiasAntes || esUnDiaAntes) {
                // Calcular el porcentaje de elementos completados
                const totalItems = lista.items.length
                const itemsCompletados = lista.items.filter((item) => item.completado).length
                const porcentajeCompletado = totalItems > 0 ? (itemsCompletados / totalItems) * 100 : 100

                // Obtener el servicio de correo
                const emailServices = await importEmailService()

                // Si es el día del viaje
                if (esDiaViaje) {
                    if (porcentajeCompletado === 100) {
                        // Enviar felicitación por tener todo listo
                        try {
                            await enviarFelicitacionViaje(emailServices, user.value.email, lista)
                            results.congratulationsSent++
                        } catch (error) {
                            console.error("Error al enviar felicitación de viaje:", error)
                            results.errors++
                        }
                    } else {
                        // Enviar recordatorio urgente
                        try {
                            await enviarRecordatorioUrgente(emailServices, user.value.email, lista, porcentajeCompletado)
                            results.remindersSent++
                        } catch (error) {
                            console.error("Error al enviar recordatorio urgente:", error)
                            results.errors++
                        }
                    }
                }
                // Si es 1 día antes y no está completo
                else if (esUnDiaAntes && porcentajeCompletado < 100) {
                    try {
                        await enviarRecordatorioUnDiaAntes(emailServices, user.value.email, lista, porcentajeCompletado)
                        results.remindersSent++
                    } catch (error) {
                        console.error("Error al enviar recordatorio de un día antes:", error)
                        results.errors++
                    }
                }
                // Si es 3 días antes y no está completo
                else if (esTresDiasAntes && porcentajeCompletado < 100) {
                    try {
                        await enviarRecordatorioTresDiasAntes(emailServices, user.value.email, lista, porcentajeCompletado)
                        results.remindersSent++
                    } catch (error) {
                        console.error("Error al enviar recordatorio de tres días antes:", error)
                        results.errors++
                    }
                }
            }
        }

        return {
            success: true,
            results,
        }
    } catch (error) {
        console.error("Error al verificar viajes y enviar notificaciones:", error)
        return {
            success: false,
            error: error.message,
        }
    }
}

/**
 * Envía un correo de felicitación por tener todo listo para el viaje
 * @param {Object} emailServices - Servicios de correo electrónico
 * @param {string} email - Correo electrónico del destinatario
 * @param {Object} lista - Datos de la lista de viaje
 * @returns {Promise<Object>} - Resultado del envío
 */
async function enviarFelicitacionViaje(emailServices, email, lista) {
    const subject = `¡Feliz viaje a ${lista.destino}! 🎉✈️`
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #1e3a8a;">Travelle</h1>
      </div>
      
      <h2 style="color: #1e3a8a; text-align: center;">¡Feliz viaje a ${lista.destino}! 🎉✈️</h2>
      
      <p>¡Hoy es el gran día! Tu viaje a ${lista.destino} comienza hoy.</p>
      
      <p>Nos alegra ver que tienes todo listo para tu aventura. Has completado todos los elementos de tu lista de viaje.</p>
      
      <div style="background-color: #f0f7ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0; font-weight: bold;">Detalles del viaje:</p>
        <p style="margin: 5px 0;">🌍 Destino: ${lista.destino}</p>
        <p style="margin: 5px 0;">📅 Fechas: ${formatearFecha(lista.fechaInicio)} - ${formatearFecha(
        lista.fechaFin,
    )}</p>
      </div>
      
      <p>Te deseamos un viaje increíble lleno de experiencias maravillosas. ¡Disfruta cada momento!</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${window.location.origin}/trip-lists/${lista.id
        }" style="background-color: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Ver mi lista de viaje
        </a>
      </div>
      
      <p>¡Buen viaje!</p>
      <p>El equipo de Travelle</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #777; font-size: 12px;">
        <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
        <p>&copy; ${new Date().getFullYear()} Travelle. Todos los derechos reservados.</p>
      </div>
    </div>
  `

    return await emailServices.enviarCorreoNotificacion(email, subject, html)
}

/**
 * Envía un recordatorio urgente el día del viaje
 * @param {Object} emailServices - Servicios de correo electrónico
 * @param {string} email - Correo electrónico del destinatario
 * @param {Object} lista - Datos de la lista de viaje
 * @param {number} porcentajeCompletado - Porcentaje de elementos completados
 * @returns {Promise<Object>} - Resultado del envío
 */
async function enviarRecordatorioUrgente(emailServices, email, lista, porcentajeCompletado) {
    const itemsPendientes = lista.items.filter((item) => !item.completado)
    const subject = `¡URGENTE! Elementos pendientes para tu viaje a ${lista.destino} HOY ⚠️`
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #1e3a8a;">Travelle</h1>
      </div>
      
      <h2 style="color: #e53e3e; text-align: center;">¡Tu viaje a ${lista.destino} es HOY!</h2>
      
      <p>¡Hoy es el día de tu viaje a ${lista.destino}! Sin embargo, notamos que aún tienes elementos pendientes en tu lista.</p>
      
      <div style="background-color: #fff5f5; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #e53e3e;">
        <p style="margin: 0; font-weight: bold;">Estado de tu lista:</p>
        <p style="margin: 5px 0;">✅ Completado: ${Math.round(porcentajeCompletado)}%</p>
        <p style="margin: 5px 0;">⏰ Elementos pendientes: ${itemsPendientes.length}</p>
      </div>
      
      <p style="font-weight: bold;">Elementos pendientes:</p>
      <ul style="background-color: #f7fafc; padding: 15px; border-radius: 5px;">
        ${itemsPendientes
            .slice(0, 5)
            .map((item) => `<li>${item.texto}</li>`)
            .join("")}
        ${itemsPendientes.length > 5 ? `<li>... y ${itemsPendientes.length - 5} elementos más</li>` : ""}
      </ul>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${window.location.origin}/trip-lists/${lista.id
        }" style="background-color: #e53e3e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Completar mi lista ahora
        </a>
      </div>
      
      <p>¡Te deseamos un excelente viaje!</p>
      <p>El equipo de Travelle</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #777; font-size: 12px;">
        <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
        <p>&copy; ${new Date().getFullYear()} Travelle. Todos los derechos reservados.</p>
      </div>
    </div>
  `

    return await emailServices.enviarCorreoNotificacion(email, subject, html)
}

/**
 * Envía un recordatorio un día antes del viaje
 * @param {Object} emailServices - Servicios de correo electrónico
 * @param {string} email - Correo electrónico del destinatario
 * @param {Object} lista - Datos de la lista de viaje
 * @param {number} porcentajeCompletado - Porcentaje de elementos completados
 * @returns {Promise<Object>} - Resultado del envío
 */
async function enviarRecordatorioUnDiaAntes(emailServices, email, lista, porcentajeCompletado) {
    const itemsPendientes = lista.items.filter((item) => !item.completado)
    const subject = `Recordatorio: Tu viaje a ${lista.destino} es MAÑANA 🧳`
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #1e3a8a;">Travelle</h1>
      </div>
      
      <h2 style="color: #dd6b20; text-align: center;">¡Tu viaje a ${lista.destino} es MAÑANA!</h2>
      
      <p>¡Solo falta un día para tu viaje a ${lista.destino
        }! Hemos notado que aún tienes elementos pendientes en tu lista.</p>
      
      <div style="background-color: #fffaf0; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dd6b20;">
        <p style="margin: 0; font-weight: bold;">Estado de tu lista:</p>
        <p style="margin: 5px 0;">✅ Completado: ${Math.round(porcentajeCompletado)}%</p>
        <p style="margin: 5px 0;">⏰ Elementos pendientes: ${itemsPendientes.length}</p>
      </div>
      
      <p style="font-weight: bold;">Elementos pendientes:</p>
      <ul style="background-color: #f7fafc; padding: 15px; border-radius: 5px;">
        ${itemsPendientes
            .slice(0, 5)
            .map((item) => `<li>${item.texto}</li>`)
            .join("")}
        ${itemsPendientes.length > 5 ? `<li>... y ${itemsPendientes.length - 5} elementos más</li>` : ""}
      </ul>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${window.location.origin}/trip-lists/${lista.id
        }" style="background-color: #dd6b20; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Completar mi lista ahora
        </a>
      </div>
      
      <p>¡Te deseamos un excelente viaje!</p>
      <p>El equipo de Travelle</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #777; font-size: 12px;">
        <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
        <p>&copy; ${new Date().getFullYear()} Travelle. Todos los derechos reservados.</p>
      </div>
    </div>
  `

    return await emailServices.enviarCorreoNotificacion(email, subject, html)
}

/**
 * Envía un recordatorio tres días antes del viaje
 * @param {Object} emailServices - Servicios de correo electrónico
 * @param {string} email - Correo electrónico del destinatario
 * @param {Object} lista - Datos de la lista de viaje
 * @param {number} porcentajeCompletado - Porcentaje de elementos completados
 * @returns {Promise<Object>} - Resultado del envío
 */
async function enviarRecordatorioTresDiasAntes(emailServices, email, lista, porcentajeCompletado) {
    const itemsPendientes = lista.items.filter((item) => !item.completado)
    const subject = `Recordatorio: Faltan 3 días para tu viaje a ${lista.destino} 📝`
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #1e3a8a;">Travelle</h1>
      </div>
      
      <h2 style="color: #3182ce; text-align: center;">¡Faltan 3 días para tu viaje a ${lista.destino}!</h2>
      
      <p>Tu viaje a ${lista.destino
        } está cada vez más cerca. Hemos notado que aún tienes elementos pendientes en tu lista.</p>
      
      <div style="background-color: #ebf8ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3182ce;">
        <p style="margin: 0; font-weight: bold;">Estado de tu lista:</p>
        <p style="margin: 5px 0;">✅ Completado: ${Math.round(porcentajeCompletado)}%</p>
        <p style="margin: 5px 0;">⏰ Elementos pendientes: ${itemsPendientes.length}</p>
      </div>
      
      <p style="font-weight: bold;">Elementos pendientes:</p>
      <ul style="background-color: #f7fafc; padding: 15px; border-radius: 5px;">
        ${itemsPendientes
            .slice(0, 5)
            .map((item) => `<li>${item.texto}</li>`)
            .join("")}
        ${itemsPendientes.length > 5 ? `<li>... y ${itemsPendientes.length - 5} elementos más</li>` : ""}
      </ul>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${window.location.origin}/trip-lists/${lista.id
        }" style="background-color: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Completar mi lista ahora
        </a>
      </div>
      
      <p>¡Te deseamos un excelente viaje!</p>
      <p>El equipo de Travelle</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #777; font-size: 12px;">
        <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
        <p>&copy; ${new Date().getFullYear()} Travelle. Todos los derechos reservados.</p>
      </div>
    </div>
  `

    return await emailServices.enviarCorreoNotificacion(email, subject, html)
}

/**
 * Formatea una fecha para mostrarla en formato legible
 * @param {string} fecha - Fecha en formato ISO
 * @returns {string} - Fecha formateada
 */
function formatearFecha(fecha) {
    if (!fecha) return ""
    return new Date(fecha).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    })
}
