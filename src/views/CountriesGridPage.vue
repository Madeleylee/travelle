<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getPaisesConCiudades } from '@/composables/useDatabase';

// Inicialización del router para la navegación
const router = useRouter();

// Variables reactivas
const paises = ref([]); // Almacena todos los países obtenidos de la base de datos
const searchText = ref(''); // Texto de búsqueda ingresado por el usuario
const selectedContinent = ref('all'); // Continente seleccionado para filtrar
const isLoading = ref(true); // Controla el estado de carga

// Lista de continentes disponibles para filtrar
const continents = [
    { value: 'all', label: 'All' },
    { value: 'europe', label: 'Europe' },
    { value: 'america', label: 'America' },
    { value: 'asia', label: 'Asia' },
    { value: 'africa', label: 'Africa' },
    { value: 'oceania', label: 'Oceania' }
];

// Mapeo de países a continentes (simplificado)
// Esto permite filtrar países por continente
const countryToContinent = {
    'Spain': 'europe',
    'Italy': 'europe',
    'France': 'europe',
    'Germany': 'europe',
    'United Kingdom': 'europe',
    'Portugal': 'europe',
    'Greece': 'europe',
    'United States': 'america',
    'Canada': 'america',
    'Mexico': 'america',
    'Brazil': 'america',
    'Argentina': 'america',
    'Chile': 'america',
    'Japan': 'asia',
    'China': 'asia',
    'India': 'asia',
    'Thailand': 'asia',
    'Egypt': 'africa',
    'Morocco': 'africa',
    'South Africa': 'africa',
    'Australia': 'oceania',
    'New Zealand': 'oceania',
    // Añadir más países según sea necesario
};

// Función para obtener el icono correspondiente a cada continente
function getContinentIcon(continent) {
    switch (continent) {
        case 'all':
            return 'bi bi-globe'; // Icono de globo para "Todos"
        case 'europe':
            return 'bi bi-building'; // Icono de edificio para Europa
        case 'america':
            return 'bi bi-tree'; // Icono de árbol para América
        case 'asia':
            return 'bi bi-sun'; // Icono de sol para Asia
        case 'africa':
            return 'bi bi-brightness-high'; // Icono de brillo para África
        case 'oceania':
            return 'bi bi-water'; // Icono de agua para Oceanía
        default:
            return 'bi bi-geo-alt'; // Icono de ubicación por defecto
    }
}

// Propiedad computada que filtra los países según el texto de búsqueda y el continente seleccionado
const filteredCountries = computed(() => {
    let result = paises.value;

    // Filtrar por texto de búsqueda
    if (searchText.value) {
        const searchTerm = searchText.value.toLowerCase().trim();
        result = result.filter(pais =>
            pais.nombre.toLowerCase().includes(searchTerm)
        );
    }

    // Filtrar por continente seleccionado
    if (selectedContinent.value !== 'all') {
        result = result.filter(pais =>
            countryToContinent[pais.nombre] === selectedContinent.value
        );
    }

    return result;
});

// Manejar errores de carga de imágenes de banderas
function handleFlagError(e) {
    // Usar una imagen de marcador de posición en caso de error
    e.target.src = 'https://res.cloudinary.com/dxhxsxijx/image/upload/v1747436853/Travelle/banderas/placeholder-flag.jpg';
}

// Navegar a la página de detalles del país
function navigateToCountry(nombrePais) {
    router.push({ name: 'Pais', params: { nombrePais } });
}

// Cargar los países al montar el componente
onMounted(async () => {
    try {
        isLoading.value = true;
        paises.value = await getPaisesConCiudades();
        console.log('Países cargados:', paises.value);
    } catch (error) {
        console.error('Error al cargar países:', error);
        paises.value = [];
    } finally {
        isLoading.value = false;
    }
});
</script>

<template>
    <div class="countries-page">
        <div class="container py-4">
            <!-- Cabecera de la página con título y contador de países -->
            <div class="countries-header">
                <h1>Explore by Country</h1>
                <p v-if="filteredCountries.length > 0">Discover {{ filteredCountries.length }} countries around the
                    world</p>
            </div>

            <!-- Sección de filtros -->
            <div class="favorites-filters">
                <!-- Buscador de países -->
                <div class="search-filter">
                    <i class="bi bi-search"></i>
                    <input type="text" v-model="searchText" placeholder="Search by country name..."
                        class="form-control" />
                </div>

                <!-- Filtro por continente -->
                <div class="continent-filters">
                    <span class="filter-label">Filter by continent:</span>
                    <div class="continent-buttons">
                        <!-- Botones para cada continente con iconos -->
                        <button v-for="continent in continents" :key="continent.value" class="continent-btn"
                            :class="{ active: selectedContinent === continent.value }"
                            @click="selectedContinent = continent.value">
                            <i :class="getContinentIcon(continent.value)"></i>
                            {{ continent.label }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Indicador de carga mientras se obtienen los países -->
            <div v-if="isLoading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading countries...</span>
                </div>
                <p class="mt-3">Loading countries...</p>
            </div>

            <!-- Cuadrícula de países (se muestra solo si hay países filtrados) -->
            <div v-else-if="filteredCountries.length > 0" class="countries-grid">
                <!-- Tarjeta para cada país -->
                <div v-for="pais in filteredCountries" :key="pais.id_pais" class="country-card"
                    @click="navigateToCountry(pais.nombre)">
                    <div class="card h-100 border-0 shadow-sm">
                        <!-- Bandera del país -->
                        <div class="country-flag">
                            <img :src="pais.bandera" :alt="`Flag of ${pais.nombre}`" class="flag-img"
                                @error="handleFlagError" />
                        </div>
                        <!-- Información del país -->
                        <div class="card-body">
                            <h5 class="card-title">{{ pais.nombre }}</h5>
                            <p class="card-text text-muted">{{ pais.ciudades.length }} {{ pais.ciudades.length === 1 ?
                                'city' : 'cities' }}</p>
                        </div>
                        <!-- Botón para explorar el país -->
                        <div class="card-footer bg-transparent border-0">
                            <button class="explore-btn">
                                <span>Explore</span>
                                <i class="bi bi-arrow-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Mensaje cuando no hay resultados de búsqueda -->
            <div v-else class="no-results text-center py-5">
                <i class="bi bi-search display-1 text-muted"></i>
                <h3 class="mt-3">No countries found</h3>
                <p class="text-muted">Try a different search or filter</p>
            </div>
        </div>
    </div>
</template>



<style scoped>
/* Estilos para la página de países */
.countries-page {
    min-height: 100vh;
}

/* Estilos para la cuadrícula de países */
.countries-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1.5rem;
}

/* Estilos para las tarjetas de países */
.country-card {
    cursor: pointer;
    transition: transform 0.3s ease;
}

/* Efecto de elevación al pasar el cursor sobre la tarjeta */
.country-card:hover {
    transform: translateY(-5px);
}

/* Contenedor para la bandera del país */
.country-flag {
    height: 120px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f8f9fa;
    border-top-left-radius: 0.375rem;
    border-top-right-radius: 0.375rem;
}

/* Estilos para la imagen de la bandera */
.flag-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

/* Estilos para el título de la tarjeta */
.card-title {
    font-weight: 600;
    color: var(--color-text);
}

/* Estilos para el mensaje de no resultados */
.no-results {
    color: var(--color-text);
}

/* Estilos para la cabecera de la página */
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
    border-radius: 2px;
}

/* Estilos para el párrafo de la cabecera */
.countries-header p {
    color: #6c757d;
    font-size: 1.1rem;
    margin-top: 1rem;
}

/* Estilos para el contenedor de filtros */
.favorites-filters {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    margin-bottom: 2rem;
    background-color: #f8f9fa;
    padding: 1.25rem;
    border-radius: 12px;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
}

/* Estilos para el filtro de búsqueda */
.search-filter {
    flex: 1;
    position: relative;
}

/* Posicionamiento del icono de búsqueda */
.search-filter i {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: #6c757d;
}

/* Estilos para el campo de búsqueda */
.search-filter input {
    padding: 0.75rem 1rem 0.75rem 40px;
    border-radius: 30px;
    border: 1px solid #e0e0e0;
    width: 100%;
    font-size: 0.95rem;
    transition: all 0.3s ease;
}

/* Estilos para el campo de búsqueda cuando está enfocado */
.search-filter input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(58, 80, 107, 0.1);
}

/* Estilos para los filtros de continente */
.continent-filters {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

/* Etiqueta para el filtro de continentes */
.filter-label {
    font-size: 0.9rem;
    color: #6c757d;
    font-weight: 500;
}

/* Contenedor para los botones de continente */
.continent-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

/* Estilos para los botones de continente */
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

/* Estilos para los iconos en los botones de continente */
.continent-btn i {
    font-size: 0.85rem;
}

/* Efecto hover para los botones de continente */
.continent-btn:hover {
    background-color: #f0f0f0;
    border-color: #d0d0d0;
}

/* Estilos para el botón de continente activo/seleccionado */
.continent-btn.active {
    background-color: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
}

/* Estilos para el footer de la tarjeta donde está el botón Explore */
.card-footer {
    padding: 0.75rem;
    display: flex;
    justify-content: center;
}

/* Estilos para el botón Explore */
.explore-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.6rem 1rem;
    border: none;
    border-radius: 25px;
    background: var(--color-primary);
    color: white;
    font-weight: 500;
    font-size: 0.9rem;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    position: relative;
    overflow: hidden;
}

/* Efecto hover para el botón Explore */
.explore-btn:hover {
  background-color: var(--color-accent);
}


/* Estilos responsivos para pantallas medianas */
@media (max-width: 767.98px) {
    .countries-grid {
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 1rem;
    }

    .country-flag {
        height: 100px;
    }

    .card-body {
        padding: 0.75rem;
    }

    .card-title {
        font-size: 1rem;
    }

    .card-footer {
        padding: 0.5rem 0.75rem;
    }

    .continent-btn {
        padding: 0.4rem 0.8rem;
        font-size: 0.85rem;
    }

    .explore-btn {
        padding: 0.5rem 0.75rem;
        font-size: 0.85rem;
    }
}

/* Estilos responsivos para pantallas pequeñas */
@media (max-width: 576px) {
    .countries-container {
        padding: 1.5rem 0.75rem;
    }

    .countries-header h1 {
        font-size: 1.8rem;
    }

    .countries-header p {
        font-size: 1rem;
    }

    .favorites-filters {
        padding: 1rem;
    }

    .continent-buttons {
        gap: 0.4rem;
    }

    .continent-btn {
        padding: 0.35rem 0.7rem;
        font-size: 0.8rem;
    }

    .explore-btn {
        padding: 0.4rem 0.7rem;
        font-size: 0.8rem;
    }
}
</style>
