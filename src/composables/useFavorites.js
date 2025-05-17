"use client"

import { ref, computed } from "vue"
import { useAuth } from "@/composables/useAuth"
import { turso } from "@/services/tursoClient"

export function useFavorites() {
    const { isUserAuthenticated, getUsuarioActual } = useAuth()
    const favoritos = ref([])
    const isLoading = ref(false)
    const error = ref(null)

    // Obtener todos los favoritos del usuario actual
    const fetchFavoritos = async () => {
        isLoading.value = true
        error.value = null

        try {
            if (!isUserAuthenticated()) {
                console.log("Usuario no autenticado. No se pueden cargar favoritos.")
                favoritos.value = []
                isLoading.value = false
                return
            }

            const usuario = getUsuarioActual()
            if (!usuario || !usuario.id) {
                console.log("No se encontró ID de usuario.")
                favoritos.value = []
                isLoading.value = false
                return
            }

            console.log("Cargando favoritos para usuario ID:", usuario.id)

            const result = await turso.execute({
                sql: `
          SELECT l.id_lugar as id, l.nombre as lugar, c.nombre as ciudad, p.nombre as pais, 
                 l.precio, l.valoracion, l.imagen1, l.imagen2, l.imagen3
          FROM Favoritos f
          JOIN Lugares l ON f.id_lugar = l.id_lugar
          JOIN Ciudades c ON l.id_ciudad = c.id_ciudad
          JOIN Paises p ON c.id_pais = p.id_pais
          WHERE f.id_usuario = ?
          ORDER BY l.nombre
        `,
                args: [usuario.id],
            })

            console.log("Resultado de la consulta:", result)
            favoritos.value = result.rows
            console.log("Favoritos cargados:", favoritos.value)
        } catch (err) {
            console.error("Error al cargar favoritos:", err)
            error.value = "Error al cargar favoritos. Por favor, intenta nuevamente."
            favoritos.value = []
        } finally {
            isLoading.value = false
        }
    }

    // Verificar si un lugar está en favoritos
    const isFavorite = async (lugarId) => {
        if (!isUserAuthenticated()) {
            return false
        }

        const usuario = getUsuarioActual()
        if (!usuario || !usuario.id) return false

        try {
            const result = await turso.execute({
                sql: `SELECT 1 FROM Favoritos WHERE id_usuario = ? AND id_lugar = ?`,
                args: [usuario.id, lugarId],
            })

            return result.rows.length > 0
        } catch (err) {
            console.error("Error al verificar favorito:", err)
            return false
        }
    }

    // Agregar un lugar a favoritos
    const addFavorite = async (lugarId) => {
        if (!isUserAuthenticated()) {
            console.log("Usuario no autenticado. No se puede agregar a favoritos.")
            return false
        }

        const usuario = getUsuarioActual()
        if (!usuario || !usuario.id) {
            console.log("No se encontró ID de usuario.")
            return false
        }

        try {
            console.log(`Agregando lugar ID ${lugarId} a favoritos para usuario ID ${usuario.id}`)

            await turso.execute({
                sql: `INSERT OR IGNORE INTO Favoritos (id_usuario, id_lugar) VALUES (?, ?)`,
                args: [usuario.id, lugarId],
            })

            console.log("Lugar agregado a favoritos correctamente")
            return true
        } catch (err) {
            console.error("Error al agregar favorito:", err)
            error.value = "Error al agregar favorito"
            return false
        }
    }

    // Eliminar un lugar de favoritos
    const removeFavorite = async (lugarId) => {
        if (!isUserAuthenticated()) {
            return false
        }

        const usuario = getUsuarioActual()
        if (!usuario || !usuario.id) {
            return false
        }

        try {
            console.log(`Eliminando lugar ID ${lugarId} de favoritos para usuario ID ${usuario.id}`)

            await turso.execute({
                sql: `DELETE FROM Favoritos WHERE id_usuario = ? AND id_lugar = ?`,
                args: [usuario.id, lugarId],
            })

            console.log("Lugar eliminado de favoritos correctamente")
            return true
        } catch (err) {
            console.error("Error al eliminar favorito:", err)
            error.value = "Error al eliminar favorito"
            return false
        }
    }

    // Toggle favorito (agregar o eliminar)
    const toggleFavorite = async (lugarId) => {
        const esFavorito = await isFavorite(lugarId)
        console.log(`Toggle favorito: ${lugarId}, es favorito: ${esFavorito}`)

        if (esFavorito) {
            const result = await removeFavorite(lugarId)
            if (result) await fetchFavoritos() // Recargar la lista
            return result
        } else {
            const result = await addFavorite(lugarId)
            if (result) await fetchFavoritos() // Recargar la lista
            return result
        }
    }

    // Agrupar favoritos por país
    const favoritosPorPais = computed(() => {
        const porPais = {}

        favoritos.value.forEach((fav) => {
            if (!fav.pais) return // Ignorar favoritos sin país

            if (!porPais[fav.pais]) {
                porPais[fav.pais] = []
            }
            porPais[fav.pais].push(fav)
        })

        // Ordenar países alfabéticamente
        return Object.keys(porPais)
            .sort()
            .reduce((acc, pais) => {
                acc[pais] = porPais[pais]
                return acc
            }, {})
    })

    return {
        favoritos,
        favoritosPorPais,
        isLoading,
        error,
        fetchFavoritos,
        isFavorite,
        addFavorite,
        removeFavorite,
        toggleFavorite,
    }
}
