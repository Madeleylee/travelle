<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import data from '../assets/data/data.json';
import SearchIcon from './icons/SearchIcon.vue';

// Inicialización de Vue Router para manejar la navegación
const route = useRoute();
const router = useRouter();

// Variables reactivas para manejar el estado de la aplicación
const paises = ref(data.paises); // Almacena los datos de los países
const searchQuery = ref(''); // Almacena la consulta de búsqueda ingresada por el usuario
const searchResults = ref([]); // Almacena los resultados de la búsqueda
const isHidden = ref(false); // Controla la visibilidad de la barra de navegación
const lastScrollPosition = ref(0); // Almacena la última posición de desplazamiento
const navbar = ref(null); // Referencia al elemento de la barra de navegación
const showResults = ref(false); // Nueva variable para controlar la visibilidad de los resultados

/**
 * Función para buscar destinos basados en la consulta de búsqueda.
 * Filtra ciudades y lugares que coincidan con la consulta.
 */
function searchDestinos() {
    // Si la consulta es menor a 2 caracteres, limpia los resultados
    if (searchQuery.value.length < 2) {
        searchResults.value = [];
        showResults.value = false;
        return;
    }

    const results = [];
    paises.value.forEach(pais => {
        Object.keys(pais.ciudades).forEach(nombreCiudad => {
            // Busca ciudades que coincidan con la consulta
            if (nombreCiudad.toLowerCase().includes(searchQuery.value.toLowerCase())) {
                results.push({
                    id: `ciudad-${pais.name}-${nombreCiudad}`,
                    nombre: nombreCiudad,
                    tipo: 'ciudad',
                    pais: pais.name
                });
            }

            // Busca lugares dentro de las ciudades que coincidan con la consulta
            pais.ciudades[nombreCiudad].lugares.forEach(lugar => {
                if (lugar.nombre.toLowerCase().includes(searchQuery.value.toLowerCase())) {
                    results.push({
                        id: `lugar-${pais.name}-${nombreCiudad}-${lugar.nombre}`,
                        nombre: lugar.nombre,
                        tipo: 'lugar',
                        pais: pais.name,
                        ciudad: nombreCiudad
                    });
                }
            });
        });
    });

    // Limita los resultados a los primeros 5
    searchResults.value = results.slice(0, 5);
    showResults.value = true;
}

/**
 * Función para navegar a un resultado de búsqueda.
 * Utiliza Vue Router para navegar a la ruta correspondiente.
 */
function navigateToResult(result) {
    if (result.tipo === 'ciudad') {
        router.push({
            name: 'Pais',
            params: { nombrePais: result.pais },
            query: { ciudad: result.nombre }
        });
    } else {
        router.push({
            name: 'Pais',
            params: { nombrePais: result.pais },
            query: { ciudad: result.ciudad, lugar: result.nombre }
        });
    }
    // Limpia la consulta y los resultados de búsqueda
    searchQuery.value = '';
    searchResults.value = [];
    showResults.value = false;
}

/**
 * Función para manejar la búsqueda al presionar Enter.
 * Navega al primer resultado de la búsqueda si existe.
 */
function handleSearch() {
    if (searchResults.value.length > 0) {
        navigateToResult(searchResults.value[0]);
    }
}

/**
 * Función para verificar si un país está activo.
 * Compara el nombre del país con el parámetro de la ruta actual.
 */
function isActiveCountry(countryName) {
    return route.params.nombrePais === countryName;
}

/**
 * Función para manejar el evento de desplazamiento.
 * Oculta o muestra la barra de navegación según la dirección del desplazamiento.
 */
function onScroll() {
    const currentScrollPosition = window.scrollY || document.documentElement.scrollTop;
    if (currentScrollPosition < 0) {
        return;
    }

    if (Math.abs(currentScrollPosition - lastScrollPosition.value) < 60) {
        return;
    }

    isHidden.value = currentScrollPosition > lastScrollPosition.value;
    lastScrollPosition.value = currentScrollPosition;
}

/**
 * Función para cerrar los resultados de búsqueda cuando se hace clic fuera del buscador
 */
function closeResults(event) {
    if (!event.target.closest('.search-container')) {
        showResults.value = false;
    }
}

// Hook del ciclo de vida que se ejecuta al montar el componente
onMounted(() => {
    window.addEventListener('scroll', onScroll);
    window.addEventListener('click', closeResults);
});

// Hook del ciclo de vida que se ejecuta al desmontar el componente
onUnmounted(() => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('click', closeResults);
});
</script>

<template>
    <!-- Barra de navegación con clases dinámicas para ocultar/mostrar -->
    <header class="navbar" :class="{ 'navbar-hidden': isHidden, 'navbar-visible': !isHidden }" ref="navbar">
        <div class="nav-content">
            <!-- Parte superior de la barra de navegación -->
            <div class="nav-top">
                <!-- Logo centrado en la parte superior -->
                <div class="nav-logo">
                    <router-link to="/" class="logo-link">
                        <img src="../assets/img/logo.png" alt="Travelle Logo" class="logo">
                    </router-link>
                </div>
                <!-- Buscador en la parte superior derecha -->
                <div class="nav-search">
                    <div class="search-container">
                        <SearchIcon :width="24" :height="24" />
                        <input v-model="searchQuery" @input="searchDestinos" @keyup.enter="handleSearch"
                            @focus="showResults = true" type="text" placeholder="Buscar destino o ciudad..."
                            class="search-input">
                        <ul v-if="showResults && searchQuery.length >= 2" class="search-results">
                            <li v-if="searchResults.length === 0" class="no-results">No se encuentran resultados</li>
                            <li v-else v-for="result in searchResults" :key="result.id">
                                <a @click="navigateToResult(result)">
                                    {{ result.nombre }} ({{ result.tipo === 'ciudad' ? 'Ciudad' : 'Lugar' }}, {{
                                        result.pais
                                    }})
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <!-- Navegación de países en la parte inferior -->
            <nav class="nav-contries">
                <ul class="nav-list">
                    <li v-for="pais in paises" :key="pais.id" class="nav-item">
                        <router-link :to="{ name: 'Pais', params: { nombrePais: pais.name } }" class="nav-link"
                            :class="{ active: isActiveCountry(pais.name) }">
                            {{ pais.name.toUpperCase() }}
                        </router-link>
                    </li>
                </ul>
            </nav>
        </div>
    </header>
</template>

<style scoped>
/* Estilos específicos para la barra de navegación */
.navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    background-color: var(--color-primary);
    color: var(--color-textWhite);
    font-family: 'Playfair Display', serif;
    transition: transform 0.3s ease-in-out;
}

/* Clase para ocultar la barra de navegación */
.navbar-hidden {
    transform: translateY(-100%);
}

/* Clase para mostrar la barra de navegación */
.navbar-visible {
    transform: translateY(0);
}

/* Contenedor de contenido de la barra de navegación */
.nav-content {
    display: grid;
    align-items: center;
    padding: 1rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
    grid-template-rows: 1fr auto;
}

/* Parte superior de la barra de navegación */
.nav-top {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    width: 100%;
    margin-bottom: 1rem;
    gap: 15rem;
}

/* Logo centrado en la parte superior */
.nav-logo {
    grid-column: 2;
    display: flex;
    justify-content: center;
}

/* Estilo para el enlace del logo */
.logo-link {
    display: flex;
    align-items: center;
}

/* Estilo del logo */
.logo {
    height: 100px;
    width: auto;
}


/* Estilos para la lista de navegación de países */
.nav-list {
    display: flex;
    justify-content: center;
    gap: 2rem;
    list-style-type: none;
}

/* Estilo de los enlaces de navegación */
.nav-link {
    color: var(--color-textWhite);
    text-decoration: none;
    padding: 0.5rem 1rem;
    transition: background-color 0.3s, color 0.3s;
    font-weight: 600;
    font-size: 1.2rem;
    border-radius: 4px;
}

/* Estilo de los enlaces de navegación al hacer hover o cuando están activos */
.nav-link:hover,
.nav-link.active {
    background-color: var(--color-accent);
    color: var(--color-primary);
}

/* Contenedor del buscador */
.nav-search {
    grid-column: 3;
    justify-self: self-end;
}

/* Contenedor de búsqueda */
.search-container {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

/* Estilo del campo de entrada de búsqueda */
.search-input {
    padding: 0.5rem 1rem;
    border: 1px solid var(--color-textWhite);
    border-radius: 4px;
    background-color: rgba(255, 255, 255, 0.1);
    color: var(--color-textWhite);
    width: 250px;
}

/* Estilo del placeholder del campo de entrada de búsqueda */
.search-input::placeholder {
    color: rgba(255, 255, 255, 0.7);
}

/* Estilo de los resultados de búsqueda */
.search-results {
    position: absolute;
    top: 100%;
    background-color: var(--color-background);
    border: 1px solid var(--color-primary);
    border-top: none;
    z-index: 10;
    width: 100%;
    max-height: 200px;
    overflow-y: auto;
}

/* Estilo de los enlaces de los resultados de búsqueda */
.search-results a {
    display: block;
    padding: 0.5rem;
    color: var(--color-text);
    text-decoration: none;
}

/* Estilo de los enlaces de los resultados de búsqueda al hacer hover */
.search-results a:hover {
    background-color: var(--color-background);
}

/* Estilo para el mensaje de "No se encuentra" */
.no-results {
    padding: 0.5rem;
    color: var(--color-text);
    font-style: italic;
}

/* Media queries para ajustar el diseño en pantallas más pequeñas */
@media (max-width: 1024px) {
    .nav-top {
        grid-template-columns: 1fr;
        gap: 1rem;
        justify-items: center;
    }

    .nav-logo {
        grid-column: 1;
    }

    .nav-search {
        grid-column: 1;
        justify-self: center;
    }

    .search-container {
        width: 100%;
        max-width: 300px;
    }

    .search-input {
        width: 100%;
    }

    .nav-list {
        flex-wrap: wrap;
        gap: 1rem;
    }

    .logo {
        height: 100px;
    }
}

@media (max-width: 768px) {
    .logo {
        height: 80px;
    }

    .nav-link {
        font-size: 0.9rem;
    }
}
</style>