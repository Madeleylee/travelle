"use client"

/**
 * Servicio de notificaciones para viajes
 * Gestiona el envío de recordatorios y felicitaciones para viajes
 */

import { useTripLists } from "@/composables/useTripLists"
import { useAuth } from "@/composables/useAuth"

// Importación dinámica para evitar problemas de SSR/CSR
const importEmailService = async () => {
  try {
    return await import("@/services/emailServices")
  } catch (error) {

    return {
      enviarCorreoNotificacion: async () => {

        return { success: false, error: "Servicio de correo no disponible" }
      },
    }
  }
}

// Modificar la función checkTripsAndNotify para mejorar la carga de listas
export async function checkTripsAndNotify() {


  // Verificar si el usuario está autenticado
  const { isUserAuthenticated, getUsuarioActual } = useAuth()
  const tripListsInstance = useTripLists() // Move hook call to the top level

  const isAuthenticated = isUserAuthenticated()
  if (!isAuthenticated) {
    return { success: false, reason: "user-not-authenticated" }
  }

  try {
    const usuario = getUsuarioActual()

    // Verificación más robusta del usuario
    if (!usuario) {
      return { success: false, reason: "user-not-available" }
    }

    // Verificar tanto id como id_usuario
    const userId = usuario.id || usuario.id_usuario

    if (!userId) {
      // Mostrar el objeto usuario completo para depuración
      return { success: false, reason: "user-id-not-available" }
    }



    // Obtener las listas de viaje - Crear una nueva instancia para evitar problemas de referencia

    // Cargar las listas de viaje - Esperar a que se complete la carga

    const listas = await tripListsInstance.cargarListas()

    // Verificar si hay listas disponibles
    if (!tripListsInstance.listasOrdenadas.value || tripListsInstance.listasOrdenadas.value.length === 0) {
      return { success: true, reason: "no-lists-available" }
    }

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
    for (const lista of tripListsInstance.listasOrdenadas.value) {
      // Verificar si la lista tiene fechaInicio
      if (!lista || !lista.fechaInicio) {
        continue
      }

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

        // Verificar si la lista tiene items
        if (!lista || !lista.items || !Array.isArray(lista.items)) {
          continue
        }

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
              await enviarFelicitacionViaje(emailServices, usuario.email, lista)
              results.congratulationsSent++
            } catch (error) {
              results.errors++
            }
          } else {
            // Enviar recordatorio urgente
            try {
              await enviarRecordatorioUrgente(emailServices, usuario.email, lista, porcentajeCompletado)
              results.remindersSent++
            } catch (error) {
              results.errors++
            }
          }
        }
        // Si es 1 día antes y no está completo
        else if (esUnDiaAntes && porcentajeCompletado < 100) {
          try {
            await enviarRecordatorioUnDiaAntes(emailServices, usuario.email, lista, porcentajeCompletado)
            results.remindersSent++
          } catch (error) {
            results.errors++
          }
        }
        // Si es 3 días antes y no está completo
        else if (esTresDiasAntes && porcentajeCompletado < 100) {
          try {
            await enviarRecordatorioTresDiasAntes(emailServices, usuario.email, lista, porcentajeCompletado)
            results.remindersSent++
          } catch (error) {
            results.errors++
          }
        }
      }
    }

    return {
      success: true,
      results,
      listsChecked: tripListsInstance.listasOrdenadas.value.length,
    }
  } catch (error) {
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
  if (!lista || !lista.destino) {
    return { success: false, error: "Lista inválida" }
  }

  const subject = `Happy trip to ${lista.destino}! 🎉✈️`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #1e3a8a;">Travelle</h1>
      </div>
      
      <h2 style="color: #1e3a8a; text-align: center;">Happy trip to ${lista.destino}! 🎉✈️</h2>
      
      <p>Today is the big day! Your trip to ${lista.destino} starts today.</p>
      
      <p>We're glad to see that you have everything ready for your adventure. You've completed all the items on your trip list.</p>
      
      <div style="background-color: #f0f7ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0; font-weight: bold;">Trip details:</p>
        <p style="margin: 5px 0;">🌍 Destination: ${lista.destino}</p>
        <p style="margin: 5px 0;">📅 Dates: ${formatearFecha(lista.fechaInicio)} - ${formatearFecha(
    lista.fechaFin,
  )}</p>
      </div>
      
      <p>We wish you an amazing trip full of wonderful experiences. Enjoy every moment!</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${window.location.origin}/viajes/${lista.id
    }" style="background-color: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          View my trip list
        </a>
      </div>
      
      <p>Have a great trip!</p>
      <p>The Travelle Team</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #777; font-size: 12px;">
        <p>This is an automated email, please do not reply to this message.</p>
        <p>&copy; ${new Date().getFullYear()} Travelle. All rights reserved.</p>
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
  if (!lista || !lista.items) {
    return { success: false, error: "Lista inválida" }
  }

  const itemsPendientes = lista.items.filter((item) => !item.completado)
  const subject = `URGENT! Pending items for your trip to ${lista.destino} TODAY ⚠️`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #1e3a8a;">Travelle</h1>
      </div>
      
      <h2 style="color: #e53e3e; text-align: center;">Your trip to ${lista.destino} is TODAY!</h2>
      
      <p>Today is the day of your trip to ${lista.destino}! However, we noticed that you still have pending items on your list.</p>
      
      <div style="background-color: #fff5f5; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #e53e3e;">
        <p style="margin: 0; font-weight: bold;">List status:</p>
        <p style="margin: 5px 0;">✅ Completed: ${Math.round(porcentajeCompletado)}%</p>
        <p style="margin: 5px 0;">⏰ Pending items: ${itemsPendientes.length}</p>
      </div>
      
      <p style="font-weight: bold;">Pending items:</p>
      <ul style="background-color: #f7fafc; padding: 15px; border-radius: 5px;">
        ${itemsPendientes
      .slice(0, 5)
      .map((item) => `<li>${item.texto}</li>`)
      .join("")}
        ${itemsPendientes.length > 5 ? `<li>... and ${itemsPendientes.length - 5} more items</li>` : ""}
      </ul>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${window.location.origin}/viajes/${lista.id
    }" style="background-color: #e53e3e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Complete my list now
        </a>
      </div>
      
      <p>We wish you an excellent trip!</p>
      <p>The Travelle Team</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #777; font-size: 12px;">
        <p>This is an automated email, please do not reply to this message.</p>
        <p>&copy; ${new Date().getFullYear()} Travelle. All rights reserved.</p>
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
  if (!lista || !lista.items) {
    return { success: false, error: "Lista inválida" }
  }

  const itemsPendientes = lista.items.filter((item) => !item.completado)
  const subject = `Reminder: Your trip to ${lista.destino} is TOMORROW 🧳`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #1e3a8a;">Travelle</h1>
      </div>
      
      <h2 style="color: #dd6b20; text-align: center;">Your trip to ${lista.destino} is TOMORROW!</h2>
      
      <p>Only one day left until your trip to ${lista.destino
    }! We've noticed that you still have pending items on your list.</p>
      
      <div style="background-color: #fffaf0; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dd6b20;">
        <p style="margin: 0; font-weight: bold;">List status:</p>
        <p style="margin: 5px 0;">✅ Completed: ${Math.round(porcentajeCompletado)}%</p>
        <p style="margin: 5px 0;">⏰ Pending items: ${itemsPendientes.length}</p>
      </div>
      
      <p style="font-weight: bold;">Pending items:</p>
      <ul style="background-color: #f7fafc; padding: 15px; border-radius: 5px;">
        ${itemsPendientes
      .slice(0, 5)
      .map((item) => `<li>${item.texto}</li>`)
      .join("")}
        ${itemsPendientes.length > 5 ? `<li>... and ${itemsPendientes.length - 5} more items</li>` : ""}
      </ul>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${window.location.origin}/viajes/${lista.id
    }" style="background-color: #dd6b20; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Complete my list now
        </a>
      </div>
      
      <p>We wish you an excellent trip!</p>
      <p>The Travelle Team</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #777; font-size: 12px;">
        <p>This is an automated email, please do not reply to this message.</p>
        <p>&copy; ${new Date().getFullYear()} Travelle. All rights reserved.</p>
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
  if (!lista || !lista.items) {
    return { success: false, error: "Lista inválida" }
  }

  const itemsPendientes = lista.items.filter((item) => !item.completado)
  const subject = `Reminder: 3 days until your trip to ${lista.destino} 📝`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #1e3a8a;">Travelle</h1>
      </div>
      
      <h2 style="color: #3182ce; text-align: center;">3 days until your trip to ${lista.destino}!</h2>
      
      <p>Your trip to ${lista.destino
    } is getting closer. We've noticed that you still have pending items on your list.</p>
      
      <div style="background-color: #ebf8ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3182ce;">
        <p style="margin: 0; font-weight: bold;">List status:</p>
        <p style="margin: 5px 0;">✅ Completed: ${Math.round(porcentajeCompletado)}%</p>
        <p style="margin: 5px 0;">⏰ Pending items: ${itemsPendientes.length}</p>
      </div>
      
      <p style="font-weight: bold;">Pending items:</p>
      <ul style="background-color: #f7fafc; padding: 15px; border-radius: 5px;">
        ${itemsPendientes
      .slice(0, 5)
      .map((item) => `<li>${item.texto}</li>`)
      .join("")}
        ${itemsPendientes.length > 5 ? `<li>... and ${itemsPendientes.length - 5} more items</li>` : ""}
      </ul>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${window.location.origin}/viajes/${lista.id
    }" style="background-color: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Complete my list now
        </a>
      </div>
      
      <p>We wish you an excellent trip!</p>
      <p>The Travelle Team</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #777; font-size: 12px;">
        <p>This is an automated email, please do not reply to this message.</p>
        <p>&copy; ${new Date().getFullYear()} Travelle. All rights reserved.</p>
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
  return new Date(fecha).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

// Modificar la función debugListas para mejorar la depuración
export function debugListas() {

  const { isUserAuthenticated, getUsuarioActual } = useAuth()
  const tripListsInstance = useTripLists() // Move hook call to the top level

  try {
    if (!isUserAuthenticated()) {

      return { autenticado: false }
    }

    const usuario = getUsuarioActual()

    if (!usuario) {

      return { autenticado: true, usuarioValido: false, error: "usuario-no-disponible" }
    }

    // Verificar tanto id como id_usuario
    const userId = usuario.id || usuario.id_usuario

    if (!userId) {
      // Mostrar el objeto usuario completo para depuración
      return {
        autenticado: true,
        usuarioValido: false,
        error: "id-no-disponible",
        usuario: usuario, // Incluir el objeto usuario para depuración
      }
    }


    // Crear una nueva instancia para evitar problemas de referencia


    // Devolver una promesa para poder usar async/await
    return new Promise((resolve) => {
      tripListsInstance
        .cargarListas()
        .then(() => {
          const listasOrdenadas = tripListsInstance.listasOrdenadas.value

          if (listasOrdenadas && listasOrdenadas.length > 0) {

          }

          resolve({
            autenticado: true,
            usuarioValido: true,
            usuario: usuario,
            userId: userId,
            listas: listasOrdenadas,
            totalListas: listasOrdenadas ? listasOrdenadas.length : 0,
            // Incluir información sobre localStorage
            localStorage: {
              key: `tripLists_${userId}`,
              disponible: typeof localStorage !== "undefined",
              valor: typeof localStorage !== "undefined" ? localStorage.getItem(`tripLists_${userId}`) : null,
            },
          })
        })
        .catch((error) => {
          resolve({
            autenticado: true,
            usuarioValido: true,
            usuario: usuario,
            userId: userId,
            error: error.message,
            listas: [],
          })
        })
    })
  } catch (error) {
    return { error: error.message }
  }
}

// Añadir una función para verificar y reparar el localStorage
export function verificarYRepararLocalStorage() {

  const { isUserAuthenticated, getUsuarioActual } = useAuth()

  try {
    if (!isUserAuthenticated()) {
      return { success: false, reason: "usuario-no-autenticado" }
    }

    const usuario = getUsuarioActual()
    if (!usuario) {
      return { success: false, reason: "usuario-no-disponible" }
    }

    const userId = usuario.id || usuario.id_usuario
    if (!userId) {
      return { success: false, reason: "id-usuario-no-disponible" }
    }

    // Verificar todas las posibles claves
    const posiblesClaves = [
      `tripLists_${userId}`,
      `tripLists_${usuario.id}`,
      `tripLists_${usuario.id_usuario}`,
      `tripLists_${usuario.email}`,
    ]

    let datosEncontrados = null
    let claveEncontrada = null

    // Buscar datos en todas las posibles claves
    for (const clave of posiblesClaves) {
      try {
        const datos = localStorage.getItem(clave)
        if (datos) {
          try {
            const parsedData = JSON.parse(datos)
            if (Array.isArray(parsedData) && parsedData.length > 0) {
              datosEncontrados = parsedData
              claveEncontrada = clave
              break
            }
          } catch (e) {
          }
        }
      } catch (e) {
      }
    }

    // Si encontramos datos, asegurémonos de que estén en la clave correcta
    if (datosEncontrados && claveEncontrada) {
      const claveCorrecta = `tripLists_${userId}`

      // Si los datos no están en la clave correcta, copiarlos
      if (claveEncontrada !== claveCorrecta) {
        try {
          localStorage.setItem(claveCorrecta, JSON.stringify(datosEncontrados))
        } catch (e) {
          return {
            success: false,
            reason: "error-al-copiar-datos",
            claveOriginal: claveEncontrada,
            claveDestino: claveCorrecta,
            error: e.message,
          }
        }
      }

      return {
        success: true,
        message: "Datos encontrados y verificados",
        clave: claveCorrecta,
        totalListas: datosEncontrados.length,
      }
    }

    // Si no encontramos datos, crear una estructura vacía
    const claveCorrecta = `tripLists_${userId}`
    try {
      localStorage.setItem(claveCorrecta, JSON.stringify([]))
      return {
        success: true,
        message: "Se creó una estructura vacía",
        clave: claveCorrecta,
      }
    } catch (e) {
      return {
        success: false,
        reason: "error-al-crear-estructura",
        error: e.message,
      }
    }
  } catch (error) {
    return {
      success: false,
      reason: "error-general",
      error: error.message,
    }
  }
}