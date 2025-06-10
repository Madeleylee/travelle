<script setup>
// Importaciones necesarias
import { ref, computed, onMounted, watch } from 'vue'; // Funciones de composición de Vue
import { useRoute, useRouter } from 'vue-router'; // Hooks para acceder a la ruta y el router
import DestinosPorCiudad from '@/components/DestinosPorCiudad.vue'; // Componente para mostrar destinos por ciudad
import { getPaisesConCiudades, getLugaresPorCiudad } from '@/composables/useDatabase'; // Funciones para obtener datos

// Inicialización de router y route para navegación y acceso a parámetros
const route = useRoute();
const router = useRouter();

// Variables reactivas (estado del componente)
const nombrePais = computed(() => route.params.nombrePais); // Nombre del país obtenido de los parámetros de la URL
const pais = ref(null); // Almacena los datos del país seleccionado
const ciudadSeleccionada = ref(null); // Ciudad actualmente seleccionada en los filtros
const lugarSeleccionado = ref(null); // Lugar específico seleccionado (si lo hay)
const ciudadesConLugares = ref([]); // Array de ciudades con sus lugares correspondientes
const loading = ref(true); // Controla el estado de carga
const error = ref(null); // Almacena mensajes de error
const searchTerm = ref(''); // Término de búsqueda para filtrar destinos

/**
 * Carga todas las ciudades y sus lugares para un país específico
 * @param {Object} paisActual - Objeto con datos del país
 */
async function cargarCiudadesConLugares(paisActual) {
    try {
        loading.value = true; // Activar indicador de carga
        error.value = null; // Limpiar errores previos
        ciudadesConLugares.value = []; // Reiniciar el array de ciudades


        // Verificar si el país tiene ciudades
        if (!paisActual.ciudades || !Array.isArray(paisActual.ciudades)) {
            error.value = 'No cities found for this country';
            return;
        }

        // Iterar sobre cada ciudad del país
        for (const ciudad of paisActual.ciudades) {
            // Obtener el ID de la ciudad
            const ciudadId = ciudad.id_ciudad;

            if (!ciudadId) { 
                continue; // Saltar esta ciudad si no tiene ID
            }

            // Obtener los lugares para esta ciudad
            const lugares = await getLugaresPorCiudad(ciudadId);

            // Añadir la ciudad con sus lugares al array
            ciudadesConLugares.value.push({
                nombre: ciudad.nombre,
                lugares: lugares || [] // Si no hay lugares, usar array vacío
            });
        }

    } catch (err) {
        // Manejar errores
        error.value = 'Error loading destinations';
    } finally {
        // Desactivar indicador de carga al finalizar
        loading.value = false;
    }
}

/**
 * Filtra lugares por el término de búsqueda
 * @param {Array} lugares - Array de lugares a filtrar
 * @returns {Array} - Array de lugares filtrados
 */
const filtrarLugaresPorBusqueda = (lugares) => {
    // Si no hay término de búsqueda, devolver todos los lugares
    if (!searchTerm.value.trim()) return lugares;

    // Filtrar lugares que coincidan con el término de búsqueda
    const termino = searchTerm.value.toLowerCase().trim();
    return lugares.filter(lugar =>
        lugar.nombre.toLowerCase().includes(termino) ||
        (lugar.descripcion && lugar.descripcion.toLowerCase().includes(termino))
    );
};

/**
 * Computed: Obtiene los lugares filtrados para la ciudad seleccionada
 * Aplica filtros por término de búsqueda y lugar seleccionado
 */
const lugaresFiltrados = computed(() => {
    // Si no hay ciudad seleccionada, devolver array vacío
    if (!ciudadSeleccionada.value) return [];

    // Encontrar la ciudad seleccionada en el array de ciudades
    const ciudad = ciudadesConLugares.value.find(c => c.nombre === ciudadSeleccionada.value);
    if (!ciudad) return [];

    // Obtener lugares de la ciudad
    let lugares = ciudad.lugares || [];

    // Filtrar por lugar específico si está seleccionado
    if (lugarSeleccionado.value) {
        lugares = lugares.filter(lugar => lugar.nombre === lugarSeleccionado.value);
    }

    // Aplicar filtro de búsqueda
    return filtrarLugaresPorBusqueda(lugares);
});

/**
 * Computed: Obtiene todas las ciudades con sus lugares filtrados por búsqueda
 * Útil cuando no hay ciudad seleccionada y se quieren mostrar todas
 */
const ciudadesConLugaresFiltrados = computed(() => {
    // Si no hay término de búsqueda, devolver todas las ciudades
    if (searchTerm.value.trim() === '') return ciudadesConLugares.value;

    // Filtrar lugares de cada ciudad por término de búsqueda
    return ciudadesConLugares.value.map(ciudad => {
        const lugaresFiltrados = filtrarLugaresPorBusqueda(ciudad.lugares || []);
        return {
            ...ciudad,
            lugares: lugaresFiltrados
        };
        // Eliminar ciudades que no tienen lugares después del filtrado
    }).filter(ciudad => ciudad.lugares.length > 0);
});

/**
 * Computed: Calcula el total de destinos filtrados
 * Útil para mostrar el contador en el encabezado
 */
const totalDestinosFiltrados = computed(() => {
    // Si hay una ciudad seleccionada, contar sus lugares filtrados
    if (ciudadSeleccionada.value) {
        return lugaresFiltrados.value.length;
    } else {
        // Si no hay ciudad seleccionada, sumar lugares de todas las ciudades filtradas
        return ciudadesConLugaresFiltrados.value.reduce(
            (total, ciudad) => total + (ciudad.lugares?.length || 0), 0
        );
    }
});

/**
 * Selecciona una ciudad para filtrar
 * @param {String|null} ciudad - Nombre de la ciudad o null para mostrar todas
 */
function selectCiudad(ciudad) {
    ciudadSeleccionada.value = ciudad;
    lugarSeleccionado.value = null; // Resetear lugar seleccionado
    updateRouteQuery(); // Actualizar parámetros de URL
}

/**
 * Actualiza los parámetros de consulta en la URL
 * Útil para mantener el estado en la URL y permitir compartir enlaces
 */
function updateRouteQuery() {
    router.replace({
        query: {
            ...(ciudadSeleccionada.value && { ciudad: ciudadSeleccionada.value }),
            ...(lugarSeleccionado.value && { lugar: lugarSeleccionado.value })
        }
    });
}

/**
 * Limpia el término de búsqueda
 * Útil para el botón "Clear search"
 */
function clearSearch() {
    searchTerm.value = '';
}

/**
 * Hook de ciclo de vida: Se ejecuta cuando el componente se monta
 * Carga los datos iniciales
 */
onMounted(async () => {
    try {
        // Obtener todos los países con sus ciudades
        const paises = await getPaisesConCiudades();

        // Encontrar el país actual por su nombre
        pais.value = paises.find(p => p.nombre === nombrePais.value);

        if (pais.value) {
            // Cargar ciudades y lugares para el país
            await cargarCiudadesConLugares(pais.value);

            // Restaurar filtros desde la URL si existen
            ciudadSeleccionada.value = route.query.ciudad || null;
            lugarSeleccionado.value = route.query.lugar || null;
        } else {
            // Manejar caso de país no encontrado
            error.value = 'Country not found';
        }
    } catch (err) {
        // Manejar errores
        error.value = 'Error loading data';
    } finally {
        // Desactivar indicador de carga
        loading.value = false;
    }
});

/**
 * Watcher: Observa cambios en el parámetro nombrePais de la URL
 * Recarga los datos cuando cambia el país
 */
watch(() => route.params.nombrePais, async () => {
    try {
        loading.value = true; // Activar indicador de carga

        // Obtener países y encontrar el actual
        const paises = await getPaisesConCiudades();
        pais.value = paises.find(p => p.nombre === nombrePais.value);

        if (pais.value) {
            // Cargar ciudades y lugares para el nuevo país
            await cargarCiudadesConLugares(pais.value);

            // Restaurar filtros desde la URL
            ciudadSeleccionada.value = route.query.ciudad || null;
            lugarSeleccionado.value = route.query.lugar || null;
        } else {
            // Manejar caso de país no encontrado
            error.value = 'Country not found';
            ciudadesConLugares.value = [];
        }
    } catch (err) {
        // Manejar errores
        error.value = 'Error loading data';
        ciudadesConLugares.value = [];
    } finally {
        // Desactivar indicador de carga
        loading.value = false;
    }
});
</script>

<template>
    <!-- Contenedor principal de la página -->
    <div class="countries-page">
        <div class="container py-4">
            <!-- SECCIÓN: ESTADO DE CARGA -->
            <!-- Se muestra mientras se cargan los datos -->
            <div v-if="loading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading destinations...</span>
                </div>
                <p class="mt-3">Loading destinations...</p>
            </div>

            <!-- SECCIÓN: MENSAJE DE ERROR -->
            <!-- Se muestra cuando ocurre un error -->
            <div v-else-if="error" class="text-center py-5">
                <p class="text-muted">{{ error }}</p>
                <button @click="$router.go(0)" class="explore-btn mt-3">Try again</button>
            </div>

            <!-- SECCIÓN: CONTENIDO PRINCIPAL -->
            <!-- Se muestra cuando se han cargado los datos correctamente -->
            <template v-else-if="pais">
                <!-- Cabecera con título y contador de destinos -->
                <div class="countries-header">
                    <h1>Destinations in {{ nombrePais }}</h1>
                    <p v-if="ciudadesConLugares.length > 0">
                        {{ totalDestinosFiltrados }} destinations to explore
                    </p>
                </div>

                <!-- Sección de filtros: búsqueda y filtro por ciudad -->
                <div class="favorites-filters">
                    <!-- Buscador de destinos -->
                    <div class="search-filter">
                        <i class="bi bi-search"></i>
                        <input type="text" v-model="searchTerm" placeholder="Search destinations..."
                            class="form-control">
                    </div>

                    <!-- Filtro por ciudad con botones -->
                    <div class="continent-filters">
                        <span class="filter-label">Filter by city:</span>
                        <div class="continent-buttons">
                            <!-- Botón para mostrar todas las ciudades -->
                            <button @click="selectCiudad(null)" class="continent-btn"
                                :class="{ active: !ciudadSeleccionada }">
                                <i class="bi bi-globe"></i>
                                All
                            </button>
                            <!-- Botones para cada ciudad disponible -->
                            <button v-for="ciudad in ciudadesConLugares" :key="ciudad.nombre" class="continent-btn"
                                :class="{ active: ciudadSeleccionada === ciudad.nombre }"
                                @click="selectCiudad(ciudad.nombre)">
                                <i class="bi bi-building"></i>
                                {{ ciudad.nombre }}
                            </button>
                        </div>
                    </div>
                </div>

                <!-- SECCIÓN: NO HAY CIUDADES -->
                <!-- Se muestra cuando el país no tiene ciudades -->
                <div v-if="ciudadesConLugares.length === 0" class="no-results text-center py-5">
                    <i class="bi bi-search display-1 text-muted"></i>
                    <h3 class="mt-3">No cities found</h3>
                    <p class="text-muted">This country doesn't have any registered cities</p>
                </div>

                <!-- SECCIÓN: NO HAY RESULTADOS DE BÚSQUEDA -->
                <!-- Se muestra cuando la búsqueda no encuentra resultados -->
                <div v-else-if="searchTerm && (ciudadSeleccionada ? lugaresFiltrados.length === 0 : ciudadesConLugaresFiltrados.length === 0)"
                    class="no-results text-center py-5">
                    <i class="bi bi-search display-1 text-muted"></i>
                    <h3 class="mt-3">No results found</h3>
                    <p class="text-muted">Try different search terms or filters</p>
                    <button @click="clearSearch" class="explore-btn mt-3">
                        <i class="bi bi-arrow-counterclockwise"></i>
                        Clear search
                    </button>
                </div>

                <!-- SECCIÓN: RESULTADOS -->
                <!-- Se muestra cuando hay resultados para mostrar -->
                <template v-else>
                    <!-- Vista cuando hay una ciudad seleccionada -->
                    <div v-if="ciudadSeleccionada" class="city-destinations">
                        <!-- Componente que muestra los destinos de una ciudad -->
                        <DestinosPorCiudad :nombrePais="nombrePais" :nombreCiudad="ciudadSeleccionada"
                            :lugares="lugaresFiltrados" />
                    </div>

                    <!-- Vista cuando se muestran todas las ciudades -->
                    <template v-else>
                        <!-- Iteración por cada ciudad con lugares filtrados -->
                        <div v-for="ciudad in ciudadesConLugaresFiltrados" :key="ciudad.nombre" class="ciudad-section">
                            <h2 class="ciudad-titulo">{{ ciudad.nombre }}</h2>
                            <!-- Mostrar destinos si la ciudad tiene lugares -->
                            <div v-if="ciudad.lugares && ciudad.lugares.length > 0">
                                <DestinosPorCiudad :nombrePais="nombrePais" :nombreCiudad="ciudad.nombre"
                                    :lugares="ciudad.lugares" />
                            </div>
                            <!-- Mensaje cuando la ciudad no tiene destinos -->
                            <div v-else class="no-results text-center py-4">
                                <p class="text-muted">No destinations available for this city.</p>
                            </div>
                        </div>
                    </template>
                </template>
            </template>

            <!-- SECCIÓN: PAÍS NO ENCONTRADO -->
            <!-- Se muestra cuando el país no existe en la base de datos -->
            <div v-else class="no-results text-center py-5">
                <i class="bi bi-geo-alt display-1 text-muted"></i>
                <h3 class="mt-3">Country not found</h3>
                <p class="text-muted">The country you're looking for doesn't exist in our database</p>
                <button @click="$router.push('/')" class="explore-btn mt-3">Back to home</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Contenedor principal de la página */
.countries-page {
    min-height: 100vh;
    /* Asegura que la página ocupe al menos toda la altura de la ventana */
}

/* Estilos para la cabecera con el título y contador */
.countries-header {
    margin-bottom: 2.5rem;
    text-align: center;
    position: relative;
}

/* Estilos para el título principal */
.countries-header h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    color: var(--color-primary);
    /* Color principal definido en variables CSS */
    font-weight: 700;
    position: relative;
    display: inline-block;
}

/* Línea decorativa debajo del título */
.countries-header h1::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 4px;
    background-color: var(--color-accent);
    /* Color de acento definido en variables CSS */
    border-radius: 2px;
}

/* Estilos para el contador de destinos */
.countries-header p {
    color: #6c757d;
    /* Gris para texto secundario */
    font-size: 1.1rem;
    margin-top: 1rem;
}

/* Contenedor de filtros (búsqueda y filtro por ciudad) */
.favorites-filters {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    margin-bottom: 2rem;
    background-color: #f8f9fa;
    /* Fondo gris claro */
    padding: 1.25rem;
    border-radius: 12px;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
    /* Sombra sutil */
}

/* Contenedor del campo de búsqueda */
.search-filter {
    flex: 1;
    position: relative;
}

/* Icono de búsqueda */
.search-filter i {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: #6c757d;
    /* Gris para el icono */
}

/* Campo de entrada de búsqueda */
.search-filter input {
    padding: 0.75rem 1rem 0.75rem 40px;
    /* Espacio para el icono */
    border-radius: 30px;
    border: 1px solid #e0e0e0;
    width: 100%;
    font-size: 0.95rem;
    transition: all 0.3s ease;
}

/* Estilo cuando el campo de búsqueda está enfocado */
.search-filter input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(58, 80, 107, 0.1);
    /* Sombra sutil al enfocar */
}

/* Contenedor de filtros por ciudad */
.continent-filters {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

/* Etiqueta para el filtro de ciudades */
.filter-label {
    font-size: 0.9rem;
    color: #6c757d;
    font-weight: 500;
}

/* Contenedor de botones de filtro */
.continent-buttons {
    display: flex;
    flex-wrap: wrap;
    /* Permite que los botones se envuelvan en múltiples líneas */
    gap: 0.5rem;
}

/* Botones de filtro por ciudad */
.continent-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    border: 1px solid #e0e0e0;
    background-color: white;
    color: #6c757d;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

/* Icono dentro del botón de filtro */
.continent-btn i {
    font-size: 0.85rem;
}

/* Efecto hover para los botones de filtro */
.continent-btn:hover {
    background-color: #f0f0f0;
    border-color: #d0d0d0;
}

/* Estilo para el botón de filtro activo/seleccionado */
.continent-btn.active {
    background-color: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
}

/* Contenedor para cada sección de ciudad */
.ciudad-section {
    margin-bottom: 3rem;
}

/* Título de cada ciudad */
.ciudad-titulo {
    color: var(--color-primary);
    font-size: 1.8rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #f0f0f0;
    /* Línea separadora sutil */
}

/* Estilos para el mensaje de no resultados */
.no-results {
    color: var(--color-text);
    /* Color de texto definido en variables CSS */
}

/* Botón de explorar y otros botones de acción */
.explore-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.6rem 1.5rem;
    border: none;
    border-radius: 25px;
    background: var(--color-primary);
    color: white;
    font-weight: 500;
    font-size: 0.9rem;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    /* Sombra para efecto elevado */
    cursor: pointer;
}

/* Efecto hover para el botón de explorar */
.explore-btn:hover {
    background-color: var(--color-accent);
}

/* Media queries para responsividad en pantallas medianas */
@media (max-width: 767.98px) {
    .countries-header h1 {
        font-size: 2rem;
        /* Título más pequeño en pantallas medianas */
    }

    .continent-btn {
        padding: 0.4rem 0.8rem;
        /* Botones más compactos */
        font-size: 0.85rem;
    }

    .explore-btn {
        padding: 0.5rem 0.75rem;
        /* Botón más compacto */
        font-size: 0.85rem;
    }
}

/* Media queries para responsividad en pantallas pequeñas */
@media (max-width: 576px) {
    .countries-header h1 {
        font-size: 1.8rem;
        /* Título aún más pequeño en móviles */
    }

    .countries-header p {
        font-size: 1rem;
    }

    .favorites-filters {
        padding: 1rem;
        /* Menos padding en móviles */
    }

    .continent-buttons {
        gap: 0.4rem;
        /* Menos espacio entre botones */
    }

    .continent-btn {
        padding: 0.35rem 0.7rem;
        /* Botones más pequeños */
        font-size: 0.8rem;
    }

    .explore-btn {
        padding: 0.4rem 0.7rem;
        /* Botón más pequeño */
        font-size: 0.8rem;
    }
}
</style>
