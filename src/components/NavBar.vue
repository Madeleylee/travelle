<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getPaisesConCiudades, buscarTodo } from '@/composables/useDatabase';
import { useAuth } from '@/composables/useAuth';
import AuthModal from '@/components/AuthModal.vue';

const route = useRoute();
const router = useRouter();
const { isUserAuthenticated, getUsuarioActual, logoutUsuario } = useAuth();

const paises = ref([]);
const isHidden = ref(false);
const lastScrollPosition = ref(0);
const navbar = ref(null);

const searchText = ref('');
const selectedCountry = ref('');
const selectedCity = ref('');
const mostrarModal = ref(false);
const showUserMenu = ref(false);
const showSearchPanel = ref(false);
const showCountriesMenu = ref(false);
const searchSuggestions = ref([]);
const isSearching = ref(false);
const showSuggestions = ref(false);

const usuarioActual = computed(() => {
    return getUsuarioActual();
});

const ciudadesDelPais = computed(() => {
    if (!selectedCountry.value) return [];
    const pais = paises.value.find(
        (p) => p.nombre.trim().toLowerCase() === selectedCountry.value.trim().toLowerCase()
    );
    return pais ? pais.ciudades.map((c) => c.nombre) : [];
});

// Observar cambios en el texto de búsqueda para mostrar sugerencias
watch(searchText, async (newValue) => {
    if (newValue.trim().length >= 2) {
        await buscarSugerencias(newValue);
    } else {
        searchSuggestions.value = [];
        showSuggestions.value = false;
    }
});

// Función para buscar sugerencias mientras el usuario escribe
async function buscarSugerencias(texto) {
    if (!texto || texto.trim().length < 2) return;

    isSearching.value = true;
    try {
        // Buscar en todos los lugares disponibles
        const resultados = await buscarTodo(texto.trim().toLowerCase());
        searchSuggestions.value = resultados.slice(0, 5); // Limitar a 5 resultados
        showSuggestions.value = resultados.length > 0;
    } catch (error) {
        console.error('Error al buscar sugerencias:', error);
        searchSuggestions.value = [];
    } finally {
        isSearching.value = false;
    }
}

// Función para seleccionar una sugerencia
function seleccionarSugerencia(sugerencia) {
    router.push({
        name: 'Pais',
        params: { nombrePais: sugerencia.pais },
        query: {
            ...(sugerencia.ciudad && { ciudad: sugerencia.ciudad }),
            ...(sugerencia.lugar && { lugar: sugerencia.lugar })
        }
    });

    limpiarFiltros();
    cerrarPanelBusqueda();
}

// Función para navegar a la vista de un país específico
function navigateToCountry(nombrePais) {
    router.push({ name: 'Pais', params: { nombrePais } });
    showCountriesMenu.value = false; // Cerrar el menú después de seleccionar
}

async function buscarPorFiltros() {
    const texto = searchText.value.trim().toLowerCase();
    const pais = selectedCountry.value;
    const ciudad = selectedCity.value;

    if (texto) {
        let r = null;
        const resultados = await buscarTodo(texto);
        if (resultados.length > 0) {
            r = resultados[0];
            router.push({
                name: 'Pais',
                params: { nombrePais: r.pais },
                query: {
                    ...(r.ciudad && { ciudad: r.ciudad }),
                    ...(r.lugar && { lugar: r.lugar })
                }
            });
            limpiarFiltros();
            cerrarPanelBusqueda();
            return;
        }
    }

    if (pais && ciudad) {
        router.push({ name: 'Pais', params: { nombrePais: pais }, query: { ciudad } });
    } else if (pais) {
        router.push({ name: 'Pais', params: { nombrePais: pais } });
    }

    limpiarFiltros();
    cerrarPanelBusqueda();
}

function limpiarFiltros() {
    searchText.value = '';
    selectedCountry.value = '';
    selectedCity.value = '';
    searchSuggestions.value = [];
    showSuggestions.value = false;
}

// Función para abrir el panel de búsqueda
function abrirPanelBusqueda() {
    showSearchPanel.value = true;
    // Enfoque automático en el campo de búsqueda
    setTimeout(() => {
        const searchInput = document.getElementById('destinoInput');
        if (searchInput) searchInput.focus();
    }, 100);
}

// Función para cerrar el panel de búsqueda
function cerrarPanelBusqueda() {
    showSearchPanel.value = false;
    searchSuggestions.value = [];
    showSuggestions.value = false;
}

// Función para mostrar/ocultar el menú de países
function toggleCountriesMenu() {
    showCountriesMenu.value = !showCountriesMenu.value;
}

function onScroll() {
    const currentScrollPosition = window.scrollY || document.documentElement.scrollTop;
    if (currentScrollPosition < 0) return;
    if (Math.abs(currentScrollPosition - lastScrollPosition.value) < 60) return;
    isHidden.value = currentScrollPosition > lastScrollPosition.value;
    lastScrollPosition.value = currentScrollPosition;
}

// Función para cerrar sesión
function cerrarSesion() {
    logoutUsuario();
    showUserMenu.value = false;

    // Mostrar notificación de cierre de sesión exitoso
    mostrarNotificacion('Has cerrado sesión correctamente');

    // Opcional: redirigir a la página principal
    router.push('/');
}

// Función para mostrar/ocultar el menú de usuario
function toggleUserMenu() {
    if (isUserAuthenticated()) {
        showUserMenu.value = !showUserMenu.value;
    } else {
        mostrarModal.value = true;
    }
}

// Función para mostrar notificaciones
function mostrarNotificacion(mensaje) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = mensaje;
    document.body.appendChild(notification);

    // Eliminar notificación después de 3 segundos
    setTimeout(() => {
        notification.classList.add('notification-hide');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Función para manejar el inicio de sesión exitoso
function handleLoginSuccess(user) {
    mostrarNotificacion(`¡Bienvenido ${user.nombre}!`);
}

// Función para manejar el registro exitoso
function handleRegisterSuccess(user) {
    mostrarNotificacion(`¡Registro exitoso! Bienvenido ${user.nombre}`);
}

onMounted(async () => {
    window.addEventListener('scroll', onScroll);
    try {
        paises.value = await getPaisesConCiudades();
    } catch (error) {
        console.error('Error al cargar países:', error);
        paises.value = []; // Asegurar que paises sea un array vacío en caso de error
    }

    // Cerrar los menús al hacer clic fuera de ellos
    document.addEventListener('click', (e) => {
        // Cerrar el menú de usuario
        const userMenuContainer = document.querySelector('.user-menu-container');
        if (showUserMenu.value && userMenuContainer && !userMenuContainer.contains(e.target)) {
            showUserMenu.value = false;
        }

        // Cerrar el menú de países
        const countriesMenuBtn = document.querySelector('.countries-menu-btn');
        if (showCountriesMenu.value &&
            countriesMenuBtn &&
            !countriesMenuBtn.contains(e.target) &&
            !e.target.closest('.countries-dropdown')) {
            showCountriesMenu.value = false;
        }

        // Cerrar el panel de búsqueda
        const searchPanel = document.querySelector('.search-panel');
        const searchIcon = document.querySelector('.search-icon');
        if (showSearchPanel.value &&
            searchPanel &&
            !searchPanel.contains(e.target) &&
            searchIcon &&
            !searchIcon.contains(e.target)) {
            cerrarPanelBusqueda();
        }
    });

    // Cerrar el panel de búsqueda al presionar Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (showSearchPanel.value) {
                cerrarPanelBusqueda();
            }
            if (showCountriesMenu.value) {
                showCountriesMenu.value = false;
            }
            if (showSuggestions.value) {
                showSuggestions.value = false;
            }
        }
    });
});

onUnmounted(() => {
    window.removeEventListener('scroll', onScroll);
    document.removeEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (showSearchPanel.value) {
                cerrarPanelBusqueda();
            }
            if (showCountriesMenu.value) {
                showCountriesMenu.value = false;
            }
            if (showSuggestions.value) {
                showSuggestions.value = false;
            }
        }
    });
});
</script>

<template>
    <header class="navbar" :class="{ 'navbar-hidden': isHidden, 'navbar-visible': !isHidden }" ref="navbar">
        <div class="nav-container container">

            <div class="nav-user position-absolute top-0 end-0 p-3">
                <div class="user-menu-container">
                    <button class="text-white fs-4 btn p-0 border-0 bg-transparent" @click="toggleUserMenu">
                        <font-awesome-icon :icon="isUserAuthenticated() ? 'user-check' : 'user'" />
                    </button>

                    <!-- Menú desplegable para usuarios autenticados -->
                    <div v-if="showUserMenu && isUserAuthenticated()" class="user-dropdown">
                        <div class="user-info">
                            <p class="user-name">{{ usuarioActual?.nombre || 'Usuario' }}</p>
                            <p class="user-email">{{ usuarioActual?.email || '' }}</p>
                        </div>
                        <div class="dropdown-divider"></div>
                        <button class="dropdown-item" @click="cerrarSesion">
                            <font-awesome-icon icon="sign-out-alt" /> Cerrar sesión
                        </button>
                    </div>
                </div>
            </div>

            <div class="nav-logo text-center my-3">
                <router-link to="/" class="d-inline-block">
                    <img src="../assets/img/logo.png" alt="Travelle Logo" class="logo img-fluid" />
                </router-link>
            </div>

            <div>
                <ul class="nav-list d-flex justify-content-center gap-3 fs-5">
                    <!-- Menú desplegable de países -->
                    <li class="text-white countries-menu-container">
                        <button
                            class="text-white text-decoration-none bg-transparent border-0 d-flex align-items-center countries-menu-btn"
                            @click.stop="toggleCountriesMenu">
                            Paises
                            <font-awesome-icon icon="chevron-down" class="ms-1 small" />
                        </button>

                        <!-- Menú desplegable con la lista de países -->
                        <div v-if="showCountriesMenu" class="countries-dropdown">
                            <div class="countries-list">
                                <div v-if="paises.length === 0" class="p-3 text-center text-muted">
                                    Cargando países...
                                </div>
                                <button v-for="pais in paises" :key="pais.nombre" class="country-item"
                                    @click="navigateToCountry(pais.nombre)">
                                    {{ pais.nombre }}
                                </button>
                            </div>
                        </div>
                    </li>

                    <li class="text-white">
                        <router-link to="/" class="text-white text-decoration-none">Favoritos</router-link>
                    </li>
                    <li class="text-white">
                        <router-link to="/" class="text-white text-decoration-none">Listado</router-link>
                    </li>
                    <li class="text-white">
                        <router-link to="/" class="text-white text-decoration-none"> Mapa</router-link>
                    </li>

                    <li class="text-white">
                        <!-- Icono de lupa con evento click para abrir el panel de búsqueda -->
                        <button class="search-icon btn p-0 border-0 bg-transparent text-white"
                            @click="abrirPanelBusqueda">
                            <font-awesome-icon icon="search" />
                        </button>
                    </li>
                </ul>
            </div>

            <!-- Panel de búsqueda off-canvas (solo visible cuando showSearchPanel es true) -->
            <div v-if="showSearchPanel" class="search-panel-overlay" @click="cerrarPanelBusqueda"></div>
            <div class="search-panel" :class="{ 'search-panel-visible': showSearchPanel }">
                <div class="search-panel-header">
                    <h4 class="mb-0">Buscar</h4>
                    <button class="btn-close" @click="cerrarPanelBusqueda" aria-label="Cerrar"></button>
                </div>

                <div class="search-panel-content container">
                    <div class="row g-3">
                        <div class="col-md-3">
                            <label for="paisSelect" class="form-label">País</label>
                            <select id="paisSelect" class="form-select" v-model="selectedCountry">
                                <option value="">Selecciona un país</option>
                                <option v-for="pais in paises" :key="pais.nombre" :value="pais.nombre">
                                    {{ pais.nombre }}
                                </option>
                            </select>
                        </div>

                        <div class="col-md-3">
                            <label for="ciudadSelect" class="form-label">Ciudad</label>
                            <select id="ciudadSelect" class="form-select" v-model="selectedCity"
                                :disabled="ciudadesDelPais.length === 0">
                                <option value="">Selecciona una ciudad</option>
                                <option v-for="ciudad in ciudadesDelPais" :key="ciudad" :value="ciudad">
                                    {{ ciudad }}
                                </option>
                            </select>
                        </div>

                        <div class="col-md-4">
                            <label for="destinoInput" class="form-label">Destino</label>
                            <div class="search-input-container">
                                <input id="destinoInput" class="form-control" type="text" v-model="searchText"
                                    placeholder="Escribe un destino, ciudad o país"
                                    @focus="showSuggestions = searchSuggestions.length > 0" />

                                <!-- Indicador de carga -->
                                <div v-if="isSearching" class="search-spinner">
                                    <div class="spinner-border spinner-border-sm text-primary" role="status">
                                        <span class="visually-hidden">Buscando...</span>
                                    </div>
                                </div>

                                <!-- Lista de sugerencias -->
                                <div v-if="showSuggestions && searchSuggestions.length > 0" class="search-suggestions">
                                    <div v-for="(sugerencia, index) in searchSuggestions" :key="index"
                                        class="suggestion-item" @click="seleccionarSugerencia(sugerencia)">
                                        <div class="d-flex align-items-center">
                                            <font-awesome-icon icon="map-marker-alt" class="me-2 text-primary" />
                                            <div>
                                                <div class="suggestion-title">{{ sugerencia.lugar || sugerencia.ciudad
                                                    || sugerencia.pais }}</div>
                                                <div class="suggestion-subtitle">
                                                    {{ sugerencia.lugar ? `${sugerencia.ciudad}, ${sugerencia.pais}` :
                                                        sugerencia.ciudad ? `${sugerencia.pais}` : '' }}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="col-md-2 d-flex align-items-end">
                            <button class="btn fw-bold text-white w-100" @click="buscarPorFiltros">
                                Buscar
                            </button>
                        </div>
                    </div>

                    <!-- Sugerencias populares -->
                    <div class="mt-4">
                        <h5>Destinos populares</h5>
                        <div class="d-flex flex-wrap gap-2 mt-3">
                            <button class="btn btn-outline-secondary rounded-pill"
                                v-for="(tag, index) in ['París', 'Roma', 'Barcelona', 'Nueva York', 'Tokio']"
                                :key="index" @click="searchText = tag; buscarPorFiltros()">
                                {{ tag }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <!-- AuthModal fuera del header para cubrir toda la pantalla -->
    <AuthModal :visible="mostrarModal" @close="mostrarModal = false" @login-success="handleLoginSuccess"
        @register-success="handleRegisterSuccess" />
</template>

<style scoped>
.navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1050;
    background-color: var(--color-primary);
    color: var(--color-textWhite);
    font-family: 'Playfair Display', serif;
    transition: transform 0.3s ease-in-out;
    padding: 1rem 2rem;
}

.navbar-hidden {
    transform: translateY(-100%);
}

.navbar-visible {
    transform: translateY(0);
}

.nav-container {
    max-width: 1200px;
    margin: 0 auto;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.nav-user {
    position: absolute;
    top: 0.75rem;
    right: 1rem;
    font-size: 1.5rem;
}

.user-menu-container {
    position: relative;
}

.user-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    background-color: white;
    border-radius: 0.5rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    width: 220px;
    z-index: 1060;
    margin-top: 0.5rem;
    overflow: hidden;
}

.user-info {
    padding: 1rem;
    background-color: #f8f9fa;
}

.user-name {
    font-weight: 600;
    margin-bottom: 0.25rem;
    color: var(--color-primary);
}

.user-email {
    font-size: 0.85rem;
    color: #6c757d;
    margin-bottom: 0;
    word-break: break-all;
}

.dropdown-divider {
    height: 1px;
    background-color: #e9ecef;
    margin: 0;
}

.nav-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.nav-list li {
    color: white;
}

.nav-list a {
    color: white;
    text-decoration: none;
    transition: opacity 0.2s;
}

.nav-list a:hover {
    opacity: 0.8;
}

.dropdown-item {
    display: block;
    width: 100%;
    padding: 0.75rem 1rem;
    text-align: left;
    background: none;
    border: none;
    color: #212529;
    cursor: pointer;
    transition: background-color 0.2s;
}

.dropdown-item:hover {
    background-color: #f8f9fa;
    color: var(--color-primary);
}

.logo {
    height: 100px;
    width: auto;
}

/* Estilos para el menú desplegable de países */
.countries-menu-container {
    position: relative;
}

.countries-menu-container button {
    cursor: pointer;
    font-size: inherit;
    padding: 0;
}

.countries-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    background-color: white;
    border-radius: 0.5rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    width: 220px;
    z-index: 1060;
    margin-top: 0.5rem;
    max-height: 400px;
    overflow-y: auto;
}

.countries-list {
    display: flex;
    flex-direction: column;
    width: 100%;
}

.country-item {
    display: block;
    width: 100%;
    padding: 0.75rem 1rem;
    text-align: left;
    background: none;
    border: none;
    color: #212529;
    cursor: pointer;
    transition: background-color 0.2s;
    border-bottom: 1px solid #f1f1f1;
}

.country-item:hover {
    background-color: #f8f9fa;
    color: var(--color-primary);
}

.country-item:last-child {
    border-bottom: none;
}

/* Estilos para el icono de búsqueda */
.search-icon {
    cursor: pointer;
    transition: transform 0.2s ease;
}

.search-icon:hover {
    transform: scale(1.1);
}

/* Estilos para el panel de búsqueda off-canvas */
.search-panel-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1055;
    animation: fadeIn 0.3s ease;
}

.search-panel {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background-color: white;
    z-index: 1060;
    transform: translateY(-100%);
    transition: transform 0.3s ease-in-out;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    max-height: 80vh;
    overflow-y: auto;
}

.search-panel-visible {
    transform: translateY(0);
}

.search-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid #e9ecef;
    background-color: var(--color-primary);
    color: white;
}

.search-panel-header .btn-close {
    background-color: white;
    opacity: 0.8;
}

.search-panel-header .btn-close:hover {
    opacity: 1;
}

.search-panel-content {
    padding: 1.5rem;
}

.search-panel-content .btn {
    background-color: var(--color-accent);
    border-color: var(--color-accent);
}

.search-panel-content .btn:hover {
    background-color: #e69500;
    border-color: #e69500;
}

.search-panel-content .btn-outline-secondary {
    color: var(--color-primary);
    border-color: #ced4da;
    background-color: transparent;
}

.search-panel-content .btn-outline-secondary:hover {
    background-color: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
}

/* Estilos para el campo de búsqueda con sugerencias */
.search-input-container {
    position: relative;
}

.search-spinner {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
}

.search-suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background-color: white;
    border-radius: 0.5rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1070;
    margin-top: 0.25rem;
    max-height: 300px;
    overflow-y: auto;
}

.suggestion-item {
    padding: 0.75rem 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
    border-bottom: 1px solid #f1f1f1;
}

.suggestion-item:hover {
    background-color: #f8f9fa;
}

.suggestion-item:last-child {
    border-bottom: none;
}

.suggestion-title {
    font-weight: 500;
    color: var(--color-primary);
}

.suggestion-subtitle {
    font-size: 0.85rem;
    color: #6c757d;
}

/* Estilos para notificaciones */
:global(.notification) {
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #4caf50;
    color: white;
    padding: 1rem;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 2000;
    animation: fadeIn 0.3s;
    transition: opacity 0.3s, transform 0.3s;
}

:global(.notification-hide) {
    opacity: 0;
    transform: translateY(-20px);
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@media (max-width: 768px) {
    .logo {
        height: 70px;
    }

    .nav-user {
        font-size: 1.25rem;
        top: 0.5rem;
        right: 0.75rem;
    }

    .countries-dropdown {
        width: 180px;
        max-height: 300px;
    }

    .search-suggestions {
        max-height: 250px;
    }
}
</style>