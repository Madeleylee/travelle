"use client"

import { ref, computed, watch } from "vue"
import { useAuth } from "./useAuth"

export function useTripLists() {
    const { isUserAuthenticated, getUsuarioActual } = useAuth()
    const tripLists = ref([])
    const isLoading = ref(true)
    const error = ref(null)

    // Categorías predefinidas para los elementos de la lista
    const categorias = [
        { id: "documentos", nombre: "Documentos", icon: "file-text" },
        { id: "ropa", nombre: "Ropa", icon: "shirt" },
        { id: "electronica", nombre: "Electrónica", icon: "smartphone" },
        { id: "higiene", nombre: "Higiene", icon: "droplet" },
        { id: "medicamentos", nombre: "Medicamentos", icon: "pill" },
        { id: "otros", nombre: "Otros", icon: "package" },
    ]

    // Cargar listas del localStorage
    const cargarListas = () => {
        isLoading.value = true
        error.value = null

        try {
            if (!isUserAuthenticated()) {
                tripLists.value = []
                return
            }

            const usuario = getUsuarioActual()
            const key = `tripLists_${usuario.id}`
            const storedLists = localStorage.getItem(key)

            if (storedLists) {
                tripLists.value = JSON.parse(storedLists)
            } else {
                tripLists.value = []
            }
        } catch (err) {
            console.error("Error al cargar las listas de viaje:", err)
            error.value = "No se pudieron cargar las listas de viaje"
            tripLists.value = []
        } finally {
            isLoading.value = false
        }
    }

    // Guardar listas en localStorage
    const guardarListas = () => {
        if (!isUserAuthenticated()) return

        try {
            const usuario = getUsuarioActual()
            const key = `tripLists_${usuario.id}`
            localStorage.setItem(key, JSON.stringify(tripLists.value))
        } catch (err) {
            console.error("Error al guardar las listas de viaje:", err)
            error.value = "No se pudieron guardar los cambios"
        }
    }

    // Observar cambios en las listas para guardar automáticamente
    watch(
        tripLists,
        () => {
            guardarListas()
        },
        { deep: true },
    )

    // Crear una nueva lista de viaje
    const crearLista = (nombre, destino, fechaInicio, fechaFin) => {
        if (!isUserAuthenticated()) {
            error.value = "Debes iniciar sesión para crear una lista"
            return null
        }

        const nuevaLista = {
            id: `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            nombre,
            destino,
            fechaInicio,
            fechaFin,
            items: [],
            createdAt: new Date().toISOString(),
        }

        tripLists.value.push(nuevaLista)
        return nuevaLista
    }

    // Obtener una lista por su ID
    const obtenerLista = (id) => {
        return tripLists.value.find((lista) => lista.id === id) || null
    }

    // Actualizar una lista existente
    const actualizarLista = (id, datos) => {
        const index = tripLists.value.findIndex((lista) => lista.id === id)
        if (index === -1) {
            error.value = "Lista no encontrada"
            return false
        }

        tripLists.value[index] = {
            ...tripLists.value[index],
            ...datos,
        }
        return true
    }

    // Eliminar una lista
    const eliminarLista = (id) => {
        const index = tripLists.value.findIndex((lista) => lista.id === id)
        if (index === -1) {
            error.value = "Lista no encontrada"
            return false
        }

        tripLists.value.splice(index, 1)
        return true
    }

    // Añadir un elemento a una lista
    const agregarItem = (listaId, texto, categoria = "otros", prioridad = 2) => {
        const lista = obtenerLista(listaId)
        if (!lista) {
            error.value = "Lista no encontrada"
            return false
        }

        const nuevoItem = {
            id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            texto,
            completado: false,
            categoria,
            prioridad,
            createdAt: new Date().toISOString(),
        }

        lista.items.push(nuevoItem)
        return nuevoItem
    }

    // Actualizar un elemento
    const actualizarItem = (listaId, itemId, datos) => {
        const lista = obtenerLista(listaId)
        if (!lista) {
            error.value = "Lista no encontrada"
            return false
        }

        const index = lista.items.findIndex((item) => item.id === itemId)
        if (index === -1) {
            error.value = "Elemento no encontrado"
            return false
        }

        lista.items[index] = {
            ...lista.items[index],
            ...datos,
        }
        return true
    }

    // Eliminar un elemento
    const eliminarItem = (listaId, itemId) => {
        const lista = obtenerLista(listaId)
        if (!lista) {
            error.value = "Lista no encontrada"
            return false
        }

        const index = lista.items.findIndex((item) => item.id === itemId)
        if (index === -1) {
            error.value = "Elemento no encontrado"
            return false
        }

        lista.items.splice(index, 1)
        return true
    }

    // Marcar un elemento como completado o no completado
    const toggleCompletado = (listaId, itemId) => {
        const lista = obtenerLista(listaId)
        if (!lista) {
            error.value = "Lista no encontrada"
            return false
        }

        const item = lista.items.find((item) => item.id === itemId)
        if (!item) {
            error.value = "Elemento no encontrado"
            return false
        }

        item.completado = !item.completado
        return true
    }

    // Obtener listas ordenadas por fecha de inicio (más próximas primero)
    const listasOrdenadas = computed(() => {
        return [...tripLists.value].sort((a, b) => {
            return new Date(a.fechaInicio) - new Date(b.fechaInicio)
        })
    })

    // Obtener listas próximas (en los próximos 30 días)
    const listasProximas = computed(() => {
        const hoy = new Date()
        const treintaDiasDespues = new Date()
        treintaDiasDespues.setDate(hoy.getDate() + 30)

        return listasOrdenadas.value.filter((lista) => {
            const fechaInicio = new Date(lista.fechaInicio)
            return fechaInicio >= hoy && fechaInicio <= treintaDiasDespues
        })
    })

    // Obtener categoría por ID
    const obtenerCategoria = (id) => {
        return categorias.find((cat) => cat.id === id) || categorias[5] // Default a "otros"
    }

    // Inicializar cargando las listas
    cargarListas()

    return {
        tripLists,
        listasOrdenadas,
        listasProximas,
        isLoading,
        error,
        categorias,
        cargarListas,
        crearLista,
        obtenerLista,
        actualizarLista,
        eliminarLista,
        agregarItem,
        actualizarItem,
        eliminarItem,
        toggleCompletado,
        obtenerCategoria,
    }
}
