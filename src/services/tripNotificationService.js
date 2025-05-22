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
    console.error("Error al importar emailServices:", error)
    return {
      enviarCorreoNotificacion: async () => {
        console.error("Función de envío de correo no disponible")
        return { success: false, error: "Servicio de correo no disponible" }
      },
    }
  }
}

// Modificar la función checkTripsAndNotify para mejorar la carga de listas
export async function checkTripsAndNotify() {
  console.log("Iniciando verificación de viajes para notificaciones...")

  // Verificar si el usuario está autenticado
  const { isUserAuthenticated, getUsuarioActual } = useAuth()
  const tripListsInstance = useTripLists() // Move hook call to the top level

  const isAuthenticated = isUserAuthenticated()
  if (!isAuthenticated) {
    console.log("Usuario no autenticado, no se enviarán notificaciones")
    return { success: false, reason: "user-not-authenticated" }
  }

  try {
    const usuario = getUsuarioActual()

    // Verificación más robusta del usuario
    if (!usuario) {
      console.error("Usuario no disponible al verificar notificaciones")
      return { success: false, reason: "user-not-available" }
    }

    // Verificar tanto id como id_usuario
    const userId = usuario.id || usuario.id_usuario

    if (!userId) {
      console.error("ID de usuario no disponible al verificar notificaciones", usuario)
      // Mostrar el objeto usuario completo para depuración
      console.log("Objeto usuario:", JSON.stringify(usuario))
      return { success: false, reason: "user-id-not-available" }
    }

    console.log(`Usuario autenticado con ID: ${userId}, email: ${usuario.email}`)

    // Obtener las listas de viaje - Crear una nueva instancia para evitar problemas de referencia

    // Cargar las listas de viaje - Esperar a que se complete la carga
    console.log("Cargando listas de viaje...")
    const listas = await tripListsInstance.cargarListas()

    // Verificar si hay listas disponibles
    if (!tripListsInstance.listasOrdenadas.value || tripListsInstance.listasOrdenadas.value.length === 0) {
      console.log("No hay listas de viaje disponibles para verificar")
      return { success: true, reason: "no-lists-available" }
    }

    console.log(`Se encontraron ${tripListsInstance.listasOrdenadas.value.length} listas de viaje`)

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
        console.log(`Lista sin fecha de inicio, omitiendo`)
        continue
      }

      console.log(`Verificando lista: ${lista.nombre} - Destino: ${lista.destino} - Fecha: ${lista.fechaInicio}`)

      // Convertir la fecha de inicio a objeto Date y eliminar la hora
      const fechaInicio = new Date(lista.fechaInicio)
      fechaInicio.setHours(0, 0, 0, 0)

      // Calcular la diferencia en días
      const diferenciaDias = Math.floor((fechaInicio - hoy) / (1000 * 60 * 60 * 24))
      console.log(`Diferencia en días: ${diferenciaDias}`)

      // Verificar si es el día del viaje
      const esDiaViaje = diferenciaDias === 0

      // Verificar si es 3 días antes del viaje
      const esTresDiasAntes = diferenciaDias === 3

      // Verificar si es 1 día antes del viaje
      const esUnDiaAntes = diferenciaDias === 1

      // Si es el día del viaje o días previos, verificar el estado de la lista
      if (esDiaViaje || esTresDiasAntes || esUnDiaAntes) {
        console.log(
          `Lista elegible para notificación: ${esDiaViaje ? "Día del viaje" : esUnDiaAntes ? "1 día antes" : "3 días antes"}`,
        )

        // Verificar si la lista tiene items
        if (!lista || !lista.items || !Array.isArray(lista.items)) {
          console.log(`Lista sin items o no es un array, omitiendo`)
          continue
        }

        // Calcular el porcentaje de elementos completados
        const totalItems = lista.items.length
        const itemsCompletados = lista.items.filter((item) => item.completado).length
        const porcentajeCompletado = totalItems > 0 ? (itemsCompletados / totalItems) * 100 : 100

        console.log(
          `Estado de la lista: ${itemsCompletados}/${totalItems} completados (${Math.round(porcentajeCompletado)}%)`,
        )

        // Obtener el servicio de correo
        const emailServices = await importEmailService()

        // Si es el día del viaje
        if (esDiaViaje) {
          if (porcentajeCompletado === 100) {
            // Enviar felicitación por tener todo listo
            try {
              console.log(`Enviando felicitación de viaje a ${usuario.email}`)
              await enviarFelicitacionViaje(emailServices, usuario.email, lista)
              results.congratulationsSent++
            } catch (error) {
              console.error("Error al enviar felicitación de viaje:", error)
              results.errors++
            }
          } else {
            // Enviar recordatorio urgente
            try {
              console.log(`Enviando recordatorio urgente a ${usuario.email}`)
              await enviarRecordatorioUrgente(emailServices, usuario.email, lista, porcentajeCompletado)
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
            console.log(`Enviando recordatorio de un día antes a ${usuario.email}`)
            await enviarRecordatorioUnDiaAntes(emailServices, usuario.email, lista, porcentajeCompletado)
            results.remindersSent++
          } catch (error) {
            console.error("Error al enviar recordatorio de un día antes:", error)
            results.errors++
          }
        }
        // Si es 3 días antes y no está completo
        else if (esTresDiasAntes && porcentajeCompletado < 100) {
          try {
            console.log(`Enviando recordatorio de tres días antes a ${usuario.email}`)
            await enviarRecordatorioTresDiasAntes(emailServices, usuario.email, lista, porcentajeCompletado)
            results.remindersSent++
          } catch (error) {
            console.error("Error al enviar recordatorio de tres días antes:", error)
            results.errors++
          }
        }
      }
    }

    console.log("Verificación de viajes completada", results)
    return {
      success: true,
      results,
      listsChecked: tripListsInstance.listasOrdenadas.value.length,
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
  if (!lista || !lista.destino) {
    console.error("Lista inválida para enviar felicitación")
    return { success: false, error: "Lista inválida" }
  }

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
        <a href="${window.location.origin}/viajes/${lista.id
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
  if (!lista || !lista.items) {
    console.error("Lista inválida para enviar recordatorio urgente")
    return { success: false, error: "Lista inválida" }
  }

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
        <a href="${window.location.origin}/viajes/${lista.id
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
  if (!lista || !lista.items) {
    console.error("Lista inválida para enviar recordatorio de un día antes")
    return { success: false, error: "Lista inválida" }
  }

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
        <a href="${window.location.origin}/viajes/${lista.id
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
  if (!lista || !lista.items) {
    console.error("Lista inválida para enviar recordatorio de tres días antes")
    return { success: false, error: "Lista inválida" }
  }

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
        <a href="${window.location.origin}/viajes/${lista.id
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

// Modificar la función debugListas para mejorar la depuración
export function debugListas() {
  console.log("Iniciando depuración de listas...")

  const { isUserAuthenticated, getUsuarioActual } = useAuth()

  try {
    if (!isUserAuthenticated()) {
      console.log("Usuario no autenticado")
      return { autenticado: false }
    }

    const usuario = getUsuarioActual()

    if (!usuario) {
      console.log("Usuario no disponible")
      return { autenticado: true, usuarioValido: false, error: "usuario-no-disponible" }
    }

    // Verificar tanto id como id_usuario
    const userId = usuario.id || usuario.id_usuario

    if (!userId) {
      console.log("ID de usuario no disponible", usuario)
      // Mostrar el objeto usuario completo para depuración
      console.log("Objeto usuario completo:", JSON.stringify(usuario))
      return {
        autenticado: true,
        usuarioValido: false,
        error: "id-no-disponible",
        usuario: usuario, // Incluir el objeto usuario para depuración
      }
    }

    console.log(`Usuario autenticado con ID: ${userId}, email: ${usuario.email}`)

    // Crear una nueva instancia para evitar problemas de referencia
    const tripListsInstance = useTripLists()

    // Cargar las listas y esperar a que se complete
    console.log("Cargando listas de viaje...")

    // Devolver una promesa para poder usar async/await
    return new Promise((resolve) => {
      tripListsInstance
        .cargarListas()
        .then(() => {
          const listasOrdenadas = tripListsInstance.listasOrdenadas.value
          console.log(`Se encontraron ${listasOrdenadas ? listasOrdenadas.length : 0} listas de viaje`)

          if (listasOrdenadas && listasOrdenadas.length > 0) {
            console.log("Primera lista:", listasOrdenadas[0])
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
          console.error("Error al cargar listas:", error)
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
    console.error("Error en debugListas:", error)
    return { error: error.message }
  }
}

// Añadir una función para verificar y reparar el localStorage
export function verificarYRepararLocalStorage() {
  console.log("Verificando y reparando localStorage...")

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
              console.log(`Datos encontrados en clave: ${clave}`)
              break
            }
          } catch (e) {
            console.log(`Error al parsear datos en clave ${clave}:`, e)
          }
        }
      } catch (e) {
        console.log(`Error al acceder a clave ${clave}:`, e)
      }
    }

    // Si encontramos datos, asegurémonos de que estén en la clave correcta
    if (datosEncontrados && claveEncontrada) {
      const claveCorrecta = `tripLists_${userId}`

      // Si los datos no están en la clave correcta, copiarlos
      if (claveEncontrada !== claveCorrecta) {
        try {
          localStorage.setItem(claveCorrecta, JSON.stringify(datosEncontrados))
          console.log(`Datos copiados de ${claveEncontrada} a ${claveCorrecta}`)
        } catch (e) {
          console.error("Error al copiar datos a la clave correcta:", e)
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
      console.log(`No se encontraron datos. Se creó una estructura vacía en ${claveCorrecta}`)
      return {
        success: true,
        message: "Se creó una estructura vacía",
        clave: claveCorrecta,
      }
    } catch (e) {
      console.error("Error al crear estructura vacía:", e)
      return {
        success: false,
        reason: "error-al-crear-estructura",
        error: e.message,
      }
    }
  } catch (error) {
    console.error("Error en verificarYRepararLocalStorage:", error)
    return {
      success: false,
      reason: "error-general",
      error: error.message,
    }
  }
}
