<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getPaisesConCiudades, buscarTodo } from '@/composables/useDatabase';
import { useAuth } from '@/composables/useAuth';
import AuthModal from '@/components/AuthModal.vue';

const route = useRoute();
const router = useRouter();
const { isUserAuthenticated, getUsuarioActual, logoutUsuario } = useAuth();

// Reactive variables
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

// Routes that require authentication
const authRequiredRoutes = [
  '/favoritos',
  '/visitados',
  '/lista',
  '/viajes',
  '/perfil'
];

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

// Navigation function that checks authentication
function navigateTo(path) {
  // Check if the route requires authentication
  if (authRequiredRoutes.includes(path) && !isUserAuthenticated()) {
    // Save the path for after login
    pendingNavigation.value = path;

    // Show login modal with redirect path
    showModal.value = true;

    // Show notification
    showNotification('Please log in to access this feature');
    return;
  }

  // If authenticated or route doesn't require auth, navigate
  router.push(path);
}

// Watch for changes in search text to show suggestions
watch(searchText, async (newValue) => {
  if (newValue.trim().length >= 2) {
    await buscarSugerencias(newValue);
  } else {
    searchSuggestions.value = [];
    showSuggestions.value = false;
  }
});

// Function to search for suggestions as the user types
async function buscarSugerencias(texto) {
  if (!texto || texto.trim().length < 2) return;

  isSearching.value = true;
  try {
    // Search in all available places
    const resultados = await buscarTodo(texto.trim().toLowerCase());
    searchSuggestions.value = resultados;
    showSuggestions.value = resultados.length > 0;

    // Position suggestions correctly
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

// Function to position suggestions
function posicionarSugerencias() {
  const inputElement = document.getElementById('destinoInput');
  const suggestionsElement = document.querySelector('.search-suggestions-floating');

  if (inputElement && suggestionsElement) {
    const rect = inputElement.getBoundingClientRect();

    // Position suggestions below the input
    suggestionsElement.style.top = `${rect.bottom + window.scrollY}px`;
    suggestionsElement.style.left = `${rect.left}px`;
    suggestionsElement.style.width = `${rect.width}px`;
  }
}

// Function to check if a place is in favorites
function esFavorito(lugarId) {
  if (!isUserAuthenticated()) return false;
  const favoritos = JSON.parse(localStorage.getItem('favoritos') || '[]');
  return favoritos.some(fav => fav.id === lugarId);
}

// Function to handle favorite toggle
function toggleFavorito(event, sugerencia) {
  // Stop propagation to prevent selecting the suggestion
  event.stopPropagation();

  // Check if user is authenticated
  if (!isUserAuthenticated()) {
    // If not authenticated, show login modal
    showModal.value = true;
    return;
  }

  // If authenticated, toggle favorite
  const favoritos = JSON.parse(localStorage.getItem('favoritos') || '[]');
  const index = favoritos.findIndex(fav => fav.id === sugerencia.id);

  if (index >= 0) {
    // If it already exists, remove from favorites
    favoritos.splice(index, 1);
    showNotification(`${sugerencia.lugar || sugerencia.ciudad || sugerencia.pais} removed from favorites`);
  } else {
    // If it doesn't exist, add to favorites
    favoritos.push({
      id: sugerencia.id,
      lugar: sugerencia.lugar,
      ciudad: sugerencia.ciudad,
      pais: sugerencia.pais,
      fechaAgregado: new Date().toISOString()
    });
    showNotification(`${sugerencia.lugar || sugerencia.ciudad || sugerencia.pais} added to favorites`);
  }

  // Save to localStorage
  localStorage.setItem('favoritos', JSON.stringify(favoritos));
}

// Function to select a suggestion
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

// Function to open the search panel
function abrirPanelBusqueda() {
  showSearchPanel.value = true;
  // Auto focus on search field
  setTimeout(() => {
    const searchInput = document.getElementById('destinoInput');
    if (searchInput) searchInput.focus();
  }, 100);

  // Prevent scroll
  document.body.classList.add('overflow-hidden');
}

// Function to close the search panel
function cerrarPanelBusqueda() {
  showSearchPanel.value = false;
  searchSuggestions.value = [];
  showSuggestions.value = false;

  // Restore scroll
  document.body.classList.remove('overflow-hidden');
}

function onScroll() {
  const currentScrollPosition = window.scrollY || document.documentElement.scrollTop;
  if (currentScrollPosition < 0) return;
  if (Math.abs(currentScrollPosition - lastScrollPosition.value) < 60) return;
  isHidden.value = currentScrollPosition > lastScrollPosition.value;
  lastScrollPosition.value = currentScrollPosition;
}

// Function to log out
function cerrarSesion() {
  logoutUsuario();
  showUserMenu.value = false;

  // Show successful logout notification
  showNotification('You have successfully logged out');

  // Optional: redirect to home page
  router.push('/');
}

// Function to show/hide user menu
function toggleUserMenu() {
  if (isUserAuthenticated()) {
    showUserMenu.value = !showUserMenu.value;
  } else {
    showModal.value = true;
  }
}

// Function to show notifications
function showNotification(message) {
  // Create notification element with Bootstrap classes
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

  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Function to handle successful login
function handleLoginSuccess(user) {
  showNotification(`Welcome ${user.nombre}!`);

  // Navigate to pending route if exists
  if (pendingNavigation.value) {
    const path = pendingNavigation.value;
    pendingNavigation.value = null;
    router.push(path);
  }
}

// Function to handle successful registration
function handleRegisterSuccess(user) {
  showNotification(`Registration successful! Welcome ${user.nombre}`);

  // Navigate to pending route if exists
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

  // Close menus when clicking outside of them
  document.addEventListener('click', (e) => {
    // Close user menu
    if (showUserMenu.value && !e.target.closest('.dropdown')) {
      showUserMenu.value = false;
    }

    // Close search suggestions
    if (showSuggestions.value &&
      !e.target.closest('.search-suggestions-floating') &&
      !e.target.closest('#destinoInput')) {
      showSuggestions.value = false;
    }
  });

  // Close search panel when pressing Escape
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

  // Handle window resizing
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

  // Restore scroll if necessary
  document.body.classList.remove('overflow-hidden');
});
</script>

<template>
  <!-- Navbar horizontal con Bootstrap (siempre horizontal) -->
  <nav class="navbar navbar-expand-lg sticky-top shadow-sm bg-primary">
    <div class="container py-2">
      <!-- Logo (aumentado de tamaño) -->
      <router-link to="/" class="navbar-brand me-0 me-md-3">
        <img src="../assets/img/logo.png" alt="Travelle Logo" class="logo" />
      </router-link>

      <!-- Navegación principal horizontal (sin colapsar en móviles) -->
      <div class="navbar-nav-scroll ms-auto">
        <ul class="navbar-nav flex-row">
          <!-- Link to countries page -->
          <li class="nav-item">
            <router-link to="/paises" class="nav-link px-2 px-md-3 fw-medium text-white">
              <span class="d-none d-md-inline">Countries</span>
              <i class="bi bi-globe d-inline d-md-none"></i>
            </router-link>
          </li>

          <!-- Protected links that require authentication -->
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
            <a href="#" @click.prevent="navigateTo('/lista')" class="nav-link px-2 px-md-3 fw-medium text-white">
              <span class="d-none d-md-inline">List</span>
              <i class="bi bi-list-ul d-inline d-md-none"></i>
            </a>
          </li>
        </ul>
      </div>

      <!-- User actions -->
      <div class="d-flex align-items-center ms-2">
        <!-- Search button -->
        <button class="btn border-0 me-2 text-white" @click="abrirPanelBusqueda">
          <i class="bi bi-search"></i>
        </button>

        <!-- User dropdown -->
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
            <!-- User profile link -->
            <a href="#" @click.prevent="navigateTo('/perfil')" class="dropdown-item d-flex align-items-center py-2">
              <i class="bi bi-person-gear me-2"></i>
              <span>Profile</span>
            </a>
            <!-- Visited places link in dropdown -->
            <a href="#" @click.prevent="navigateTo('/visitados')" class="dropdown-item d-flex align-items-center py-2">
              <i class="bi bi-check-circle me-2"></i>
              <span>Visited Places</span>
            </a>
            <!-- Trip plans link -->
            <a href="#" @click.prevent="navigateTo('/viajes')" class="dropdown-item d-flex align-items-center py-2">
              <i class="bi bi-signpost-split me-2"></i>
              <span>My Trips</span>
            </a>
            <!-- Logout button -->
            <button class="dropdown-item d-flex align-items-center py-2" @click="cerrarSesion">
              <i class="bi bi-box-arrow-right me-2"></i>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </nav>

  <!-- Search panel overlay -->
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

                <!-- Loading indicator -->
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

        <!-- Popular destinations -->
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

    <!-- Suggestions list (outside the panel to appear above) -->
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

        <!-- Favorite star -->
        <button class="btn btn-link p-0"
          :class="{ 'opacity-100': esFavorito(sugerencia.id), 'opacity-25': !esFavorito(sugerencia.id) }"
          style="color: var(--color-accent);" @click.stop="toggleFavorito($event, sugerencia)">
          <i class="bi bi-heart"></i>
        </button>
      </div>
    </div>
  </div>

  <!-- AuthModal outside the header to cover the entire screen -->
  <AuthModal :visible="showModal" @close="showModal = false" @login-success="handleLoginSuccess"
    @register-success="handleRegisterSuccess" />
</template>

<style scoped>
/* Custom styles that complement Bootstrap */
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

/* Styles to keep navbar horizontal on mobile */
.navbar-nav-scroll {
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Hide scrollbar for Chrome, Safari and Opera */
.navbar-nav-scroll::-webkit-scrollbar {
  display: none;
}

.navbar-nav {
  flex-wrap: nowrap;
}

/* Styles for navigation links */
.nav-link {
  color: var(--color-textWhite) !important;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-link:hover,
.router-link-active {
  color: var(--color-accent) !important;
}

/* Custom search panel */
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

/* Search container and suggestions */
.search-container {
  position: relative;
}

/* New style for floating suggestions */
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

/* Add top margin to main content to compensate for fixed navbar */
main {
  margin-top: 80px;
}

/* Custom toast */
.toast {
  z-index: 1100;
}

/* Styles for search modal */
.form-control:focus,
.form-select:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 0.2rem var(--color-background);
}

/* Buttons with application colors */
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

  /* Larger icons on mobile for better touch */
  .d-inline.d-md-none {
    font-size: 1.2rem;
  }

  /* Adjustments for suggestions on mobile */
  .search-suggestions-floating {
    width: 90% !important;
    left: 5% !important;
  }
}

/* Media queries for adaptive text */
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

/* Class for primary color navbar */
.bg-primary {
  background-color: var(--color-primary) !important;
}
</style>