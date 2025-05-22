<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getPaisesConCiudades, buscarTodo } from '@/composables/useDatabase';
import { useAuth } from '@/composables/useAuth';
import AuthModal from '@/components/AuthModal.vue';

// Inicialización de Vue Router
const route = useRoute();
const router = useRouter();
const { isUserAuthenticated, getUsuarioActual, logoutUsuario } = useAuth();

// Variables reactivas
const isHidden = ref(false);
const lastScrollPosition = ref(0);
const searchText = ref('');
const selectedCountry = ref('');
const selectedCity = ref('');
const showModal = ref(false);
const showUserMenu = ref(false);
const showSearchPanel = ref(false);
const searchSuggestions = ref([]);
const isSearching = ref(false);
const showSuggestions = ref(false);
const paises = ref([]);
const pendingNavigation = ref(null);

// Rutas que requieren autenticación
const authRequiredRoutes = [
  '/favoritos',
  '/visitados',
  '/viajes',
  '/profile',
];

// Propiedad computada para obtener el usuario actual
const usuarioActual = computed(() => {
  return getUsuarioActual();
});

// Propiedad computada para obtener las ciudades de un país seleccionado
const ciudadesDelPais = computed(() => {
  if (!selectedCountry.value) return [];
  const pais = paises.value.find(
    (p) => p.nombre.trim().toLowerCase() === selectedCountry.value.trim().toLowerCase()
  );
  return pais ? pais.ciudades.map((c) => c.nombre) : [];
});

// Función de navegación que verifica la autenticación
function navigateTo(path) {
  // Verificar si la ruta requiere autenticación
  if (authRequiredRoutes.includes(path) && !isUserAuthenticated()) {
    // Guardar la ruta para después del inicio de sesión
    pendingNavigation.value = path;

    // Mostrar modal de inicio de sesión con la ruta de redirección
    showModal.value = true;

    // Mostrar notificación
    showNotification('Please log in to access this feature');
    return;
  }

  // Si está autenticado o la ruta no requiere autenticación, navegar
  router.push(path);
}

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
    searchSuggestions.value = resultados;
    showSuggestions.value = resultados.length > 0;

    // Posicionar sugerencias correctamente
    if (resultados.length > 0) {
      setTimeout(() => {
        posicionarSugerencias();
      }, 50);
    }
  } catch (error) {
    console.error('Error searching for suggestions:', error);
    searchSuggestions.value = [];
  } finally {
    isSearching.value = false;
  }
}

// Función para posicionar sugerencias
function posicionarSugerencias() {
  const inputElement = document.getElementById('destinoInput');
  const suggestionsElement = document.querySelector('.search-suggestions-floating');

  if (inputElement && suggestionsElement) {
    const rect = inputElement.getBoundingClientRect();

    // Posicionar sugerencias debajo del input
    suggestionsElement.style.top = `${rect.bottom + window.scrollY}px`;
    suggestionsElement.style.left = `${rect.left}px`;
    suggestionsElement.style.width = `${rect.width}px`;
  }
}

// Función para verificar si un lugar está en favoritos
function esFavorito(lugarId) {
  if (!isUserAuthenticated()) return false;
  const favoritos = JSON.parse(localStorage.getItem('favoritos') || '[]');
  return favoritos.some(fav => fav.id === lugarId);
}

// Función para manejar el toggle de favoritos
function toggleFavorito(event, sugerencia) {
  // Detener la propagación para evitar seleccionar la sugerencia
  event.stopPropagation();

  // Verificar si el usuario está autenticado
  if (!isUserAuthenticated()) {
    // Si no está autenticado, mostrar modal de inicio de sesión
    showModal.value = true;
    return;
  }

  // Si está autenticado, alternar favorito
  const favoritos = JSON.parse(localStorage.getItem('favoritos') || '[]');
  const index = favoritos.findIndex(fav => fav.id === sugerencia.id);

  if (index >= 0) {
    // Si ya existe, eliminar de favoritos
    favoritos.splice(index, 1);
    showNotification(`${sugerencia.lugar || sugerencia.ciudad || sugerencia.pais} removed from favorites`);
  } else {
    // Si no existe, agregar a favoritos
    favoritos.push({
      id: sugerencia.id,
      lugar: sugerencia.lugar,
      ciudad: sugerencia.ciudad,
      pais: sugerencia.pais,
      fechaAgregado: new Date().toISOString()
    });
    showNotification(`${sugerencia.lugar || sugerencia.ciudad || sugerencia.pais} added to favorites`);
  }

  // Guardar en localStorage
  localStorage.setItem('favoritos', JSON.stringify(favoritos));
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
  // Auto enfoque en el campo de búsqueda
  setTimeout(() => {
    const searchInput = document.getElementById('destinoInput');
    if (searchInput) searchInput.focus();
  }, 100);

  // Prevenir scroll
  document.body.classList.add('overflow-hidden');
}

// Función para cerrar el panel de búsqueda
function cerrarPanelBusqueda() {
  showSearchPanel.value = false;
  searchSuggestions.value = [];
  showSuggestions.value = false;

  // Restaurar scroll
  document.body.classList.remove('overflow-hidden');
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
  showNotification('You have successfully logged out');

  // Opcional: redirigir a la página de inicio
  router.push('/');
}

// Función para mostrar/ocultar el menú de usuario
function toggleUserMenu() {
  if (isUserAuthenticated()) {
    showUserMenu.value = !showUserMenu.value;
  } else {
    showModal.value = true;
  }
}

// Función para mostrar notificaciones
function showNotification(message) {
  // Crear elemento de notificación con clases de Bootstrap
  const notification = document.createElement('div');
  notification.className = 'toast position-fixed top-0 end-0 m-3 show';
  notification.setAttribute('role', 'alert');
  notification.setAttribute('aria-live', 'assertive');
  notification.setAttribute('aria-atomic', 'true');
  notification.style.zIndex = '3000';
  notification.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
  notification.style.backgroundColor = 'white';
  notification.style.borderLeft = '4px solid var(--color-primary)';

  notification.innerHTML = `
    <div class="toast-header" style="background-color: var(--color-primary); color: white;">
      <strong class="me-auto">Travelle</strong>
      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
    <div class="toast-body py-2">
      ${message}
    </div>
  `;

  document.body.appendChild(notification);

  // Eliminar notificación después de 3 segundos
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Función para manejar el inicio de sesión exitoso
function handleLoginSuccess(user) {
  showNotification(`Welcome ${user.nombre}!`);

  // Navegar a la ruta pendiente si existe
  if (pendingNavigation.value) {
    const path = pendingNavigation.value;
    pendingNavigation.value = null;
    router.push(path);
  }
}

// Función para manejar el registro exitoso
function handleRegisterSuccess(user) {
  showNotification(`Registration successful! Welcome ${user.nombre}`);

  // Navegar a la ruta pendiente si existe
  if (pendingNavigation.value) {
    const path = pendingNavigation.value;
    pendingNavigation.value = null;
    router.push(path);
  }
}

onMounted(async () => {
  window.addEventListener('scroll', onScroll);

  try {
    paises.value = await getPaisesConCiudades();
  } catch (error) {
    console.error('Error loading countries:', error);
    paises.value = [];
  }

  // Cerrar menús al hacer clic fuera de ellos
  document.addEventListener('click', (e) => {
    // Cerrar menú de usuario
    if (showUserMenu.value && !e.target.closest('.dropdown')) {
      showUserMenu.value = false;
    }

    // Cerrar sugerencias de búsqueda
    if (showSuggestions.value &&
      !e.target.closest('.search-suggestions-floating') &&
      !e.target.closest('#destinoInput')) {
      showSuggestions.value = false;
    }
  });

  // Cerrar panel de búsqueda al presionar Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (showSearchPanel.value) {
        cerrarPanelBusqueda();
      }
      if (showSuggestions.value) {
        showSuggestions.value = false;
      }
    }
  });

  // Manejar redimensionamiento de ventana
  window.addEventListener('resize', () => {
    if (showSuggestions.value && searchSuggestions.value.length > 0) {
      posicionarSugerencias();
    }
  });
});

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll);
  window.removeEventListener('resize', posicionarSugerencias);

  document.removeEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (showSearchPanel.value) {
        cerrarPanelBusqueda();
      }
      if (showSuggestions.value) {
        showSuggestions.value = false;
      }
    }
  });

  // Restaurar scroll si es necesario
  document.body.classList.remove('overflow-hidden');
});
</script>

<template>
  <!-- Barra de navegación horizontal con Bootstrap (siempre horizontal) -->
  <nav class="navbar navbar-expand-lg sticky-top shadow-sm bg-primary">
    <div class="container py-2">
      <!-- Logo (aumentado de tamaño) -->
      <router-link to="/" class="navbar-brand me-0 me-md-3">
        <img src="../assets/img/logo.png" alt="Travelle Logo" class="logo" />
      </router-link>

      <!-- Navegación principal horizontal (sin colapsar en móviles) -->
      <div class="navbar-nav-scroll ms-auto">
        <ul class="navbar-nav flex-row">
          <!-- Enlace a la página de países -->
          <li class="nav-item">
            <router-link to="/paises" class="nav-link px-2 px-md-3 fw-medium text-white">
              <span class="d-none d-md-inline">Countries</span>
              <i class="bi bi-globe d-inline d-md-none"></i>
            </router-link>
          </li>

          <!-- Enlaces protegidos que requieren autenticación -->
          <li class="nav-item">
            <a href="#" @click.prevent="navigateTo('/favoritos')" class="nav-link px-2 px-md-3 fw-medium text-white">
              <span class="d-none d-md-inline">Favorites</span>
              <i class="bi bi-heart d-inline d-md-none"></i>
            </a>
          </li>

          <li class="nav-item">
            <a href="#" @click.prevent="navigateTo('/visitados')" class="nav-link px-2 px-md-3 fw-medium text-white">
              <span class="d-none d-md-inline">Visited</span>
              <i class="bi bi-check-circle d-inline d-md-none"></i>
            </a>
          </li>

          <li class="nav-item">
            <a href="#" @click.prevent="navigateTo('/mapa')" class="nav-link px-2 px-md-3 fw-medium text-white">
              <span class="d-none d-md-inline">Map</span>
              <i class="bi bi-map d-inline d-md-none"></i>
            </a>
          </li>

          <li class="nav-item">
            <a href="#" @click.prevent="navigateTo('/viajes')" class="nav-link px-2 px-md-3 fw-medium text-white">
              <span class="d-none d-md-inline">My Trips</span>
              <i class="bi bi-suitcase d-inline d-md-none"></i>
            </a>
          </li>
        </ul>
      </div>

      <!-- Acciones de usuario -->
      <div class="d-flex align-items-center ms-2">
        <!-- Botón de búsqueda -->
        <button class="btn border-0 me-2 text-white" @click="abrirPanelBusqueda">
          <i class="bi bi-search"></i>
        </button>

        <!-- Menú desplegable de usuario -->
        <div class="dropdown">
          <button class="btn border-0 text-white" type="button" @click="toggleUserMenu">
            <i class="bi" :class="isUserAuthenticated() ? 'bi-person-check' : 'bi-person'"></i>
          </button>

          <div class="dropdown-menu dropdown-menu-end shadow mt-2"
            :class="{ show: showUserMenu && isUserAuthenticated() }">
            <div class="px-3 py-2" style="background-color: var(--color-background);">
              <p class="fw-bold mb-1">{{ usuarioActual?.nombre || 'User' }}</p>
              <p class="text-muted mb-0 small">{{ usuarioActual?.email || '' }}</p>
            </div>
            <div class="dropdown-divider"></div>
            <!-- Enlace al perfil de usuario -->
            <a href="#" @click.prevent="navigateTo('/profile')" class="dropdown-item d-flex align-items-center py-2">
              <i class="bi bi-person-gear me-2"></i>
              <span>Profile</span>
            </a>
            <!-- Enlace a lugares visitados en el menú desplegable -->
            <a href="#" @click.prevent="navigateTo('/visitados')" class="dropdown-item d-flex align-items-center py-2">
              <i class="bi bi-check-circle me-2"></i>
              <span>Visited Places</span>
            </a>
            <!-- Enlace a planes de viaje -->
            <a href="#" @click.prevent="navigateTo('/trips')" class="dropdown-item d-flex align-items-center py-2">
              <i class="bi bi-signpost-split me-2"></i>
              <span>My Trips</span>
            </a>
            <!-- Botón de cerrar sesión -->
            <button class="dropdown-item d-flex align-items-center py-2" @click="cerrarSesion">
              <i class="bi bi-box-arrow-right me-2"></i>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </nav>

  <!-- Superposición del panel de búsqueda -->
  <div v-if="showSearchPanel" class="search-overlay">
    <div class="search-panel">
      <div class="search-panel-header">
        <h5 class="mb-0">Search</h5>
        <button type="button" class="btn-close" @click="cerrarPanelBusqueda"></button>
      </div>
      <div class="search-panel-body">
        <div class="mb-3">
          <div class="row mb-3">
            <div class="col-md-6 mb-3 mb-md-0">
              <label for="paisSelect" class="form-label">Country</label>
              <select id="paisSelect" v-model="selectedCountry" class="form-select">
                <option value="">All countries</option>
                <option v-for="pais in paises" :key="pais.nombre" :value="pais.nombre">
                  {{ pais.nombre }}
                </option>
              </select>
            </div>

            <div class="col-md-6">
              <label for="ciudadSelect" class="form-label">City</label>
              <select id="ciudadSelect" v-model="selectedCity" class="form-select"
                :disabled="ciudadesDelPais.length === 0">
                <option value="">All cities</option>
                <option v-for="ciudad in ciudadesDelPais" :key="ciudad" :value="ciudad">
                  {{ ciudad }}
                </option>
              </select>
            </div>
          </div>

          <div class="row">
            <div class="col-md-8 mb-3 mb-md-0">
              <label for="destinoInput" class="form-label">Destination</label>
              <div class="position-relative search-container">
                <input id="destinoInput" type="text" v-model="searchText" class="form-control"
                  placeholder="Type a destination, city or country"
                  @focus="showSuggestions = searchSuggestions.length > 0" />

                <!-- Indicador de carga -->
                <div v-if="isSearching" class="position-absolute top-50 end-0 translate-middle-y pe-3">
                  <div class="spinner-border spinner-border-sm" role="status" style="color: var(--color-primary);">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-md-4 d-flex align-items-end">
              <button class="btn btn-primary w-100" @click="buscarPorFiltros">
                Search
              </button>
            </div>
          </div>
        </div>

        <!-- Destinos populares -->
        <div>
          <h6 class="mb-2">Popular destinations</h6>
          <div class="d-flex flex-wrap gap-2">
            <button v-for="(tag, index) in ['Paris', 'Rome', 'Barcelona', 'New York', 'Tokyo']" :key="index"
              class="btn btn-sm btn-light rounded-pill px-3 py-1" @click="searchText = tag; buscarPorFiltros()">
              {{ tag }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Lista de sugerencias (fuera del panel para aparecer arriba) -->
    <div v-if="showSuggestions && searchSuggestions.length > 0" class="search-suggestions-floating">
      <div v-for="(sugerencia, index) in searchSuggestions" :key="index"
        class="suggestion-item p-2 border-bottom d-flex align-items-center justify-content-between"
        @click="seleccionarSugerencia(sugerencia)">
        <div class="d-flex align-items-center">
          <i class="bi bi-geo-alt me-2" style="color: var(--color-primary);"></i>
          <div>
            <div class="fw-bold">
              {{ sugerencia.lugar || sugerencia.ciudad || sugerencia.pais }}
            </div>
            <div class="text-muted small">
              {{ sugerencia.lugar ? `${sugerencia.ciudad}, ${sugerencia.pais}` :
                sugerencia.ciudad ? `${sugerencia.pais}` : '' }}
            </div>
          </div>
        </div>

        <!-- Estrella de favoritos -->
        <button class="btn btn-link p-0"
          :class="{ 'opacity-100': esFavorito(sugerencia.id), 'opacity-25': !esFavorito(sugerencia.id) }"
          style="color: var(--color-accent);" @click.stop="toggleFavorito($event, sugerencia)">
          <i class="bi bi-heart"></i>
        </button>
      </div>
    </div>
  </div>

  <!-- AuthModal fuera del encabezado para cubrir toda la pantalla -->
  <AuthModal :visible="showModal" @close="showModal = false" @login-success="handleLoginSuccess"
    @register-success="handleRegisterSuccess" />
</template>

<style scoped>
/* Estilos personalizados que complementan Bootstrap */
.logo {
  height: 80px;
  width: auto;
}

.navbar {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.navbar-hidden {
  transform: translateY(-100%);
  transition: transform 0.3s ease;
}

/* Estilos para mantener la barra de navegación horizontal en móviles */
.navbar-nav-scroll {
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Ocultar barra de desplazamiento para Chrome, Safari y Opera */
.navbar-nav-scroll::-webkit-scrollbar {
  display: none;
}

.navbar-nav {
  flex-wrap: nowrap;
}

/* Estilos para enlaces de navegación */
.nav-link {
  color: var(--color-textWhite) !important;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-link:hover,
.router-link-active {
  color: var(--color-accent) !important;
}

/* Panel de búsqueda personalizado */
.search-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(5px);
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.search-panel {
  background-color: #ffffff;
  border-radius: 0.5rem;
  width: 100%;
  max-width: 600px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  overflow: visible;
  position: relative;
}

.search-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
  background-color: var(--color-backgroundCard);
}

.search-panel-body {
  padding: 1.25rem;
}

/* Contenedor de búsqueda y sugerencias */
.search-container {
  position: relative;
}

/* Nuevo estilo para sugerencias flotantes */
.search-suggestions-floating {
  position: fixed;
  background-color: var(--color-backgroundCard);
  border: 1px solid var(--color-textWhite);
  border-radius: 0.375rem;
  box-shadow: 0 5px 15px var(--color-primary);
  max-height: 300px;
  overflow-y: auto;
  z-index: 1060;
  width: auto;
}

.suggestion-item {
  cursor: pointer;
  transition: background-color 0.2s;
}

.suggestion-item:hover {
  background-color: var(--color-backgroundCard);
}

.suggestion-item:last-child {
  border-bottom: none !important;
}

/* Añadir margen superior al contenido principal para compensar la barra de navegación fija */
main {
  margin-top: 80px;
}

/* Toast personalizado */
.toast {
  z-index: 1100;
}

/* Estilos para el modal de búsqueda */
.form-control:focus,
.form-select:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 0.2rem var(--color-background);
}

/* Botones con colores de la aplicación */
.btn-primary {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

.btn-primary:hover {
  background-color: var(--color-accent);
  border-color: var(--color-accent);
}

.btn-light {
  background-color: var(--color-background);
  color: var(--color-primary);
}

.btn-light:hover {
  background-color: var(--color-backgroundCard);
  color: var(--color-accent);
}

/* Responsive */
@media (max-width: 767.98px) {
  .navbar-nav .nav-link {
    padding: 0.5rem 0.75rem;
  }

  .search-panel {
    max-width: 95%;
    margin: 0 auto;
  }

  .logo {
    height: 75px;
  }

  /* Iconos más grandes en móviles para mejor tacto */
  .d-inline.d-md-none {
    font-size: 1.2rem;
  }

  /* Ajustes para sugerencias en móviles */
  .search-suggestions-floating {
    width: 90% !important;
    left: 5% !important;
  }
}

/* Consultas de medios para texto adaptativo */
@media (min-width: 992px) {
  .navbar-nav .nav-link {
    font-size: 1rem;
  }
}

@media (min-width: 1200px) {
  .navbar-nav .nav-link {
    font-size: 1.1rem;
  }
}

/* Clase para barra de navegación de color primario */
.bg-primary {
  background-color: var(--color-primary) !important;
}
</style>
