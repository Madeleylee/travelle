"use client"

import { ref, computed } from "vue"
import { useAuth } from "./useAuth"
import { turso } from "../services/tursoClient"

export function useVisitados() {
    const { isUserAuthenticated, getUsuarioActual } = useAuth()
    const visitados = ref([])
    const isLoading = ref(false)
    const error = ref(null)

    // Obtener todos los lugares visitados del usuario actual
    const fetchVisitados = async () => {
        isLoading.value = true
        error.value = null

        try {
            if (!isUserAuthenticated()) {
                console.log("Usuario no autenticado. No se pueden cargar lugares visitados.")
                visitados.value = []
                isLoading.value = false
                return
            }

            const usuario = getUsuarioActual()
            if (!usuario || !usuario.id_usuario) {
                console.log("No se encontró ID de usuario.")
                visitados.value = []
                isLoading.value = false
                return
            }

            console.log("Cargando lugares visitados para usuario ID:", usuario.id_usuario)

            const result = await turso.execute({
                sql: `
          SELECT v.id_visita, v.fecha_visita, v.notas,
                 l.id_lugar, l.nombre as lugar, l.precio, l.valoracion, 
                 l.imagen1, l.imagen2, l.imagen3,
                 c.nombre as ciudad, p.nombre as pais, p.bandera
          FROM Visitas_Manual v
          JOIN Lugares l ON v.id_lugar = l.id_lugar
          JOIN Ciudades c ON l.id_ciudad = c.id_ciudad
          JOIN Paises p ON c.id_pais = p.id_pais
          WHERE v.id_usuario = ?
          ORDER BY v.fecha_visita DESC
        `,
                args: [usuario.id_usuario],
            })

            console.log("Resultado de la consulta:", result)
            visitados.value = result.rows
            console.log("Lugares visitados cargados:", visitados.value)
        } catch (err) {
            console.error("Error al cargar lugares visitados:", err)
            error.value = "Error al cargar lugares visitados. Por favor, intenta nuevamente."
            visitados.value = []
        } finally {
            isLoading.value = false
        }
    }

    // Verificar si un lugar está marcado como visitado
    const isVisited = async (lugarId) => {
        if (!isUserAuthenticated()) {
            return false
        }

        const usuario = getUsuarioActual()
        if (!usuario || !usuario.id_usuario) return false

        try {
            const result = await turso.execute({
                sql: `SELECT 1 FROM Visitas_Manual WHERE id_usuario = ? AND id_lugar = ?`,
                args: [usuario.id_usuario, lugarId],
            })

            return result.rows.length > 0
        } catch (err) {
            console.error("Error al verificar lugar visitado:", err)
            return false
        }
    }

    // Marcar un lugar como visitado
    const addVisitedPlace = async (lugarId, fecha = null, notas = "") => {
        if (!isUserAuthenticated()) {
            console.log("Usuario no autenticado. No se puede marcar como visitado.")
            return { success: false, requiresAuth: true }
        }

        const usuario = getUsuarioActual()
        if (!usuario || !usuario.id_usuario) {
            console.log("No se encontró ID de usuario.")
            return { success: false }
        }

        try {
            // Si no se proporciona fecha, usar la fecha actual
            const fechaVisita = fecha || new Date().toISOString().split("T")[0]

            console.log(`Marcando lugar ID ${lugarId} como visitado para usuario ID ${usuario.id_usuario}`)

            // Verificar si ya existe
            const checkResult = await turso.execute({
                sql: `SELECT id_visita FROM Visitas_Manual WHERE id_usuario = ? AND id_lugar = ?`,
                args: [usuario.id_usuario, lugarId],
            })

            if (checkResult.rows.length > 0) {
                // Si ya existe, actualizar la fecha y notas
                await turso.execute({
                    sql: `UPDATE Visitas_Manual SET fecha_visita = ?, notas = ? WHERE id_usuario = ? AND id_lugar = ?`,
                    args: [fechaVisita, notas, usuario.id_usuario, lugarId],
                })
            } else {
                // Si no existe, insertar nuevo registro
                await turso.execute({
                    sql: `INSERT INTO Visitas_Manual (id_usuario, id_lugar, fecha_visita, notas) VALUES (?, ?, ?, ?)`,
                    args: [usuario.id_usuario, lugarId, fechaVisita, notas],
                })
            }

            console.log("Lugar marcado como visitado correctamente")
            return { success: true }
        } catch (err) {
            console.error("Error al marcar lugar como visitado:", err)
            error.value = "Error al marcar lugar como visitado"
            return { success: false, error: err.message }
        }
    }

    // Eliminar un lugar de visitados
    const removeVisitedPlace = async (lugarId) => {
        if (!isUserAuthenticated()) {
            return { success: false }
        }

        const usuario = getUsuarioActual()
        if (!usuario || !usuario.id_usuario) {
            return { success: false }
        }

        try {
            console.log(`Eliminando lugar ID ${lugarId} de visitados para usuario ID ${usuario.id_usuario}`)

            await turso.execute({
                sql: `DELETE FROM Visitas_Manual WHERE id_usuario = ? AND id_lugar = ?`,
                args: [usuario.id_usuario, lugarId],
            })

            console.log("Lugar eliminado de visitados correctamente")
            return { success: true }
        } catch (err) {
            console.error("Error al eliminar lugar visitado:", err)
            error.value = "Error al eliminar lugar visitado"
            return { success: false, error: err.message }
        }
    }

    // Toggle visitado (marcar o desmarcar)
    const toggleVisitedPlace = async (lugarId, fecha = null, notas = "") => {
        const esVisitado = await isVisited(lugarId)
        console.log(`Toggle visitado: ${lugarId}, es visitado: ${esVisitado}`)

        if (esVisitado) {
            const result = await removeVisitedPlace(lugarId)
            if (result.success) await fetchVisitados() // Recargar la lista
            return { ...result, isNowVisited: false }
        } else {
            const result = await addVisitedPlace(lugarId, fecha, notas)
            if (result.success) await fetchVisitados() // Recargar la lista
            return { ...result, isNowVisited: true }
        }
    }

    // Agrupar visitados por país
    const visitadosPorPais = computed(() => {
        const porPais = {}

        visitados.value.forEach((visit) => {
            if (!visit.pais) return // Ignorar visitados sin país

            if (!porPais[visit.pais]) {
                porPais[visit.pais] = []
            }
            porPais[visit.pais].push(visit)
        })

        // Ordenar países alfabéticamente
        return Object.keys(porPais)
            .sort()
            .reduce((acc, pais) => {
                acc[pais] = porPais[pais]
                return acc
            }, {})
    })

    // Agrupar visitados por fecha (año y mes)
    const visitadosPorFecha = computed(() => {
        const porFecha = {}

        visitados.value.forEach((visit) => {
            if (!visit.fecha_visita) return // Ignorar visitados sin fecha

            // Extraer año y mes de la fecha
            const fecha = new Date(visit.fecha_visita)
            const yearMonth = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`
            const label = new Intl.DateTimeFormat("es", { year: "numeric", month: "long" }).format(fecha)

            if (!porFecha[yearMonth]) {
                porFecha[yearMonth] = {
                    label,
                    items: [],
                }
            }
            porFecha[yearMonth].items.push(visit)
        })

        // Ordenar por fecha (más reciente primero)
        return Object.keys(porFecha)
            .sort()
            .reverse()
            .reduce((acc, fecha) => {
                acc[fecha] = porFecha[fecha]
                return acc
            }, {})
    })

    return {
        visitados,
        visitadosPorPais,
        visitadosPorFecha,
        isLoading,
        error,
        fetchVisitados,
        isVisited,
        addVisitedPlace,
        removeVisitedPlace,
        toggleVisitedPlace,
    }
}
