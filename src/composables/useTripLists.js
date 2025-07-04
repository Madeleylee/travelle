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
        { id: "electronica", nombre: "Electrónica", icon: "mobile-alt" },
        { id: "higiene", nombre: "Higiene", icon: "droplet" },
        { id: "medicamentos", nombre: "Medicamentos", icon: "pills" },
        { id: "otros", nombre: "Otros", icon: "box" },
    ]

    // Cargar listas del localStorage
    const cargarListas = () => {
        isLoading.value = true
        error.value = null

        return new Promise((resolve) => {
            try {
                if (!isUserAuthenticated()) {
                    tripLists.value = []
                    isLoading.value = false
                    resolve([])
                    return
                }

                const usuario = getUsuarioActual()

                if (!usuario) {
                    error.value = "No se pudo acceder a la información del usuario"
                    tripLists.value = []
                    isLoading.value = false
                    resolve([])
                    return
                }

                // Verificar tanto id como id_usuario
                const userId = usuario.id || usuario.id_usuario

                if (!userId) {
                    error.value = "ID de usuario no disponible"
                    tripLists.value = []
                    isLoading.value = false
                    resolve([])
                    return
                }

                const key = `tripLists_${userId}`

                try {
                    const storedLists = localStorage.getItem(key)

                    if (storedLists) {
                        try {
                            const parsedLists = JSON.parse(storedLists)
                            if (Array.isArray(parsedLists)) {
                                tripLists.value = parsedLists
                            } else {
                                tripLists.value = []
                            }
                        } catch (parseError) {
                            tripLists.value = []
                        }
                    } else {
                        tripLists.value = []
                    }
                } catch (storageError) {
                    tripLists.value = []
                }
            } catch (err) {
                error.value = "No se pudieron cargar las listas de viaje"
                tripLists.value = []
            } finally {
                isLoading.value = false
                resolve(tripLists.value)
            }
        })
    }

    // Guardar listas en localStorage
    const guardarListas = () => {
        if (!isUserAuthenticated()) {
            return false
        }

        try {
            const usuario = getUsuarioActual()

            if (!usuario) {
                error.value = "No se pudo acceder a la información del usuario"
                return false
            }

            // Verificar tanto id como id_usuario
            const userId = usuario.id || usuario.id_usuario

            if (!userId) {
                error.value = "ID de usuario no disponible"
                return false
            }

            const key = `tripLists_${userId}`

            try {
                // Verificar que tripLists.value sea un array
                if (!Array.isArray(tripLists.value)) {
                    error.value = "Error al guardar: formato de datos incorrecto"
                    return false
                }

                // Guardar en localStorage
                localStorage.setItem(key, JSON.stringify(tripLists.value))
                return true
            } catch (storageError) {
                error.value = "Error al guardar en almacenamiento local"
                return false
            }
        } catch (err) {
            error.value = "No se pudieron guardar los cambios"
            return false
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

        const usuario = getUsuarioActual()

        if (!usuario) {
            error.value = "No se pudo acceder a la información del usuario"
            return null
        }

        // Verificar tanto id como id_usuario
        const userId = usuario.id || usuario.id_usuario

        if (!userId) {
            error.value = "ID de usuario no disponible"
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
        guardarListas() // Guardar inmediatamente después de crear
        return nuevaLista
    }

    // Obtener una lista por su ID
    const obtenerLista = (id) => {
        if (!Array.isArray(tripLists.value)) {
            return null
        }

        const lista = tripLists.value.find((lista) => lista.id === id)
        if (!lista) {
        }
        return lista || null
    }

    // Actualizar una lista existente
    const actualizarLista = (id, datos) => {
        if (!Array.isArray(tripLists.value)) {
            error.value = "Error al actualizar: formato de datos incorrecto"
            return false
        }

        const index = tripLists.value.findIndex((lista) => lista.id === id)
        if (index === -1) {
            error.value = "Lista no encontrada"
            return false
        }

        tripLists.value[index] = {
            ...tripLists.value[index],
            ...datos,
        }

        guardarListas() // Guardar inmediatamente después de actualizar
        return true
    }

    // Eliminar una lista
    const eliminarLista = (id) => {
        if (!Array.isArray(tripLists.value)) {
            error.value = "Error al eliminar: formato de datos incorrecto"
            return false
        }

        const index = tripLists.value.findIndex((lista) => lista.id === id)
        if (index === -1) {
            error.value = "Lista no encontrada"
            return false
        }

        tripLists.value.splice(index, 1)
        guardarListas() // Guardar inmediatamente después de eliminar
        return true
    }

    // Añadir un elemento a una lista
    const agregarItem = (listaId, texto, categoria = "otros", prioridad = 2, notas = "") => {
        const lista = obtenerLista(listaId)
        if (!lista) {
            error.value = "Lista no encontrada"
            return false
        }

        // Asegurarse de que lista.items sea un array
        if (!Array.isArray(lista.items)) {
            lista.items = []
        }

        const nuevoItem = {
            id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            texto,
            completado: false,
            categoria, // ✅ Garantiza que siempre tenga valor
            prioridad,
            notas,
            createdAt: new Date().toISOString(),
        }

        lista.items.push(nuevoItem)
        guardarListas() // Guardar inmediatamente después de agregar
        return nuevoItem
    }

    // Actualizar un elemento
    const actualizarItem = (listaId, itemId, datos) => {
        const lista = obtenerLista(listaId)
        if (!lista) {
            error.value = "Lista no encontrada"
            return false
        }

        // Asegurarse de que lista.items sea un array
        if (!Array.isArray(lista.items)) {
            error.value = "Formato de datos incorrecto"
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

        guardarListas() // Guardar inmediatamente después de actualizar
        return true
    }

    // Eliminar un elemento
    const eliminarItem = (listaId, itemId) => {
        const lista = obtenerLista(listaId)
        if (!lista) {
            error.value = "Lista no encontrada"
            return false
        }

        // Asegurarse de que lista.items sea un array
        if (!Array.isArray(lista.items)) {
            error.value = "Formato de datos incorrecto"
            return false
        }

        const index = lista.items.findIndex((item) => item.id === itemId)
        if (index === -1) {
            error.value = "Elemento no encontrado"
            return false
        }

        lista.items.splice(index, 1)
        guardarListas() // Guardar inmediatamente después de eliminar
        return true
    }

    // Marcar un elemento como completado o no completado
    const toggleCompletado = (listaId, itemId) => {
        const lista = obtenerLista(listaId)
        if (!lista) {
            error.value = "Lista no encontrada"
            return false
        }

        // Asegurarse de que lista.items sea un array
        if (!Array.isArray(lista.items)) {
            error.value = "Formato de datos incorrecto"
            return false
        }

        const item = lista.items.find((item) => item.id === itemId)
        if (!item) {
            error.value = "Elemento no encontrado"
            return false
        }

        item.completado = !item.completado
        guardarListas() // Guardar inmediatamente después de toggle
        return true
    }

    // Obtener listas ordenadas por fecha de inicio (más próximas primero)
    const listasOrdenadas = computed(() => {
        if (!Array.isArray(tripLists.value)) {
            return []
        }

        return [...tripLists.value].sort((a, b) => {
            return new Date(a.fechaInicio) - new Date(b.fechaInicio)
        })
    })

    // Obtener listas próximas (en los próximos 30 días)
    const listasProximas = computed(() => {
        if (!Array.isArray(tripLists.value)) {
            return []
        }

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
        return categorias.find((cat) => cat.id === id) || { id: "otros", nombre: "Sin categoría", icon: "package" }
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
