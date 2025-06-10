<template>
    <div class="visited-container">
        <div class="container py-5">
            <!-- Encabezado de la página -->
            <div class="countries-header">
                <h1>My Visited Places</h1>
                <p v-if="totalVisitados > 0">You have visited {{ totalVisitados }} {{ totalVisitados === 1 ? 'place' :
                    'places' }} around the world</p>
            </div>

            <!-- Estado de carga - Se muestra mientras se cargan los datos -->
            <div v-if="isLoading" class="loading-container">
                <div class="spinner">
                    <div class="bounce1"></div>
                    <div class="bounce2"></div>
                    <div class="bounce3"></div>
                </div>
                <p>Loading your visited places...</p>
            </div>

            <!-- Estado vacío - Se muestra cuando no hay lugares visitados -->
            <div v-else-if="totalVisitados === 0" class="empty-visited">
                <div class="empty-icon">
                    <i class="bi bi-check-circle"></i>
                </div>
                <h2>You haven't marked any places as visited yet</h2>
                <p>Explore destinations and mark the places you've visited to keep track of your travels</p>
                <router-link to="/" class="btn-explore">
                    <i class="bi bi-compass"></i> Explore destinations
                </router-link>
            </div>

            <!-- Contenido principal - Se muestra cuando hay lugares visitados -->
            <div v-else class="visited-content">
                <!-- Filtros - Diseño igual que Countries -->
                <div class="favorites-filters">
                    <!-- Filtro de búsqueda -->
                    <div class="search-filter">
                        <i class="bi bi-search"></i>
                        <input type="text" v-model="searchQuery" placeholder="Search by country, city or place..."
                            class="form-control" />
                    </div>

                    <!-- Selector de vista (por país o por fecha) -->
                    <div class="view-filters">
                        <span class="filter-label">View by:</span>
                        <div class="view-buttons">
                            <button @click="viewMode = 'country'" :class="{ active: viewMode === 'country' }"
                                class="view-btn">
                                <i class="bi bi-globe"></i> Country
                            </button>
                            <button @click="viewMode = 'date'" :class="{ active: viewMode === 'date' }"
                                class="view-btn">
                                <i class="bi bi-calendar3"></i> Date
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Vista por país - Se muestra cuando se selecciona "Country" -->
                <div v-if="viewMode === 'country' && Object.keys(filteredVisitadosPorPais).length > 0">
                    <!-- Iteración por cada país -->
                    <div v-for="(lugares, pais) in filteredVisitadosPorPais" :key="pais" class="country-section">
                        <div class="country-header">
                            <h2>{{ pais }}</h2>
                            <span class="place-count">{{ lugares.length }} {{ lugares.length === 1 ? 'place' : 'places'
                            }}</span>
                        </div>

                        <!-- Cuadrícula de lugares visitados -->
                        <div class="destinos-grid">
                            <!-- Iteración por cada lugar del país -->
                            <div v-for="lugar in lugares" :key="lugar.id_lugar" class="destino-card-wrapper">
                                <div class="destino-card">
                                    <!-- Imagen y badges -->
                                    <div class="position-relative">
                                        <img :src="lugar.imagen1 || '/placeholder.jpg'" :alt="lugar.lugar"
                                            class="destino-imagen">

                                        <!-- Badge de visitado con fecha -->
                                        <div class="visited-badge" @click="showVisitDetails(lugar)">
                                            <i class="bi bi-check-circle-fill"></i>
                                            <span>{{ formatDate(lugar.fecha_visita) }}</span>
                                        </div>

                                        <!-- Etiqueta de precio -->
                                        <div class="price-tag">
                                            <span v-if="!lugar.precio || lugar.precio === 0">Free</span>
                                            <span v-else>{{ lugar.precio }}€</span>
                                        </div>
                                    </div>

                                    <!-- Cuerpo de la tarjeta con información -->
                                    <div class="card-body">
                                        <h5 class="card-title">{{ lugar.lugar }}</h5>

                                        <!-- Valoración con estrellas (si existe) -->
                                        <div class="rating" v-if="lugar.valoracion">
                                            <div class="stars">
                                                <template v-for="n in 5" :key="n">
                                                    <i class="bi"
                                                        :class="n <= Math.round(lugar.valoracion) ? 'bi-star-fill' : 'bi-star'"></i>
                                                </template>
                                            </div>
                                            <span class="rating-value">{{ lugar.valoracion }}</span>
                                        </div>

                                        <!-- Ubicación del lugar -->
                                        <p class="location">
                                            <i class="bi bi-geo-alt"></i> {{ lugar.ciudad }}, {{ lugar.pais }}
                                        </p>

                                        <!-- Vista previa de notas (si existen) -->
                                        <p v-if="lugar.notas" class="notes-preview">
                                            <i class="bi bi-journal-text"></i>
                                            {{ truncateText(lugar.notas, 60) }}
                                        </p>

                                        <!-- Botones de acción -->
                                        <div class="card-actions">
                                            <router-link :to="{
                                                name: 'Destino',
                                                params: {
                                                    nombrePais: lugar.pais,
                                                    nombreCiudad: lugar.ciudad,
                                                    nombreDestino: lugar.lugar
                                                }
                                            }" class="btn-details">
                                                View details
                                            </router-link>
                                            <button class="btn-edit" @click="showVisitDetails(lugar)">
                                                <i class="bi bi-pencil"></i>
                                            </button>
                                            <button class="btn-remove" @click="confirmRemove(lugar)">
                                                <i class="bi bi-x"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Vista por fecha - Se muestra cuando se selecciona "Date" -->
                <div v-else-if="viewMode === 'date' && Object.keys(filteredVisitadosPorFecha).length > 0">
                    <!-- Iteración por cada período de tiempo -->
                    <div v-for="(period, key) in filteredVisitadosPorFecha" :key="key" class="date-section">
                        <div class="date-header">
                            <h2>{{ period.label }}</h2>
                            <span class="place-count">{{ period.items.length }} {{ period.items.length === 1 ? 'place' :
                                'places'
                            }}</span>
                        </div>

                        <!-- Cuadrícula de lugares visitados -->
                        <div class="destinos-grid">
                            <!-- Iteración por cada lugar del período -->
                            <div v-for="lugar in period.items" :key="lugar.id_lugar" class="destino-card-wrapper">
                                <div class="destino-card">
                                    <!-- Imagen y badges -->
                                    <div class="position-relative">
                                        <img :src="lugar.imagen1 || '/placeholder.jpg'" :alt="lugar.lugar"
                                            class="destino-imagen">

                                        <!-- Badge de visitado con fecha completa -->
                                        <div class="visited-badge" @click="showVisitDetails(lugar)">
                                            <i class="bi bi-check-circle-fill"></i>
                                            <span>{{ formatDate(lugar.fecha_visita, true) }}</span>
                                        </div>

                                        <!-- Etiqueta de precio -->
                                        <div class="price-tag">
                                            <span v-if="!lugar.precio || lugar.precio === 0">Free</span>
                                            <span v-else>{{ lugar.precio }}€</span>
                                        </div>
                                    </div>

                                    <!-- Cuerpo de la tarjeta con información -->
                                    <div class="card-body">
                                        <h5 class="card-title">{{ lugar.lugar }}</h5>

                                        <!-- Ubicación del lugar -->
                                        <p class="location">
                                            <i class="bi bi-geo-alt"></i> {{ lugar.ciudad }}, {{ lugar.pais }}
                                        </p>

                                        <!-- Vista previa de notas (si existen) -->
                                        <p v-if="lugar.notas" class="notes-preview">
                                            <i class="bi bi-journal-text"></i>
                                            {{ truncateText(lugar.notas, 60) }}
                                        </p>

                                        <!-- Botones de acción -->
                                        <div class="card-actions">
                                            <router-link :to="{
                                                name: 'Destino',
                                                params: {
                                                    nombrePais: lugar.pais,
                                                    nombreCiudad: lugar.ciudad,
                                                    nombreDestino: lugar.lugar
                                                }
                                            }" class="btn-details">
                                                View details
                                            </router-link>
                                            <button class="btn-edit" @click="showVisitDetails(lugar)">
                                                <i class="bi bi-pencil"></i>
                                            </button>
                                            <button class="btn-remove" @click="confirmRemove(lugar)">
                                                <i class="bi bi-x"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Sin resultados - Se muestra cuando la búsqueda no encuentra coincidencias -->
                <div v-else-if="searchQuery" class="no-results">
                    <i class="bi bi-search display-1 text-muted"></i>
                    <h3 class="mt-3">No visited places found</h3>
                    <p class="text-muted">Try a different search term</p>
                    <button @click="searchQuery = ''" class="btn btn-primary">Clear search</button>
                </div>
            </div>
        </div>

        <!-- Modal de detalles de visita - Para editar información de visita -->
        <VisitDetailsModal :visible="showDetailsModal" :lugar-id="selectedLugar?.id_lugar"
            :existing-data="selectedLugar" @close="closeDetailsModal" @saved="handleVisitSaved"
            @login-required="handleLoginRequired" />

        <!-- Modal de confirmación - Para confirmar eliminación de lugar visitado -->
        <div v-if="showConfirmModal" class="confirm-modal-overlay" @click="showConfirmModal = false">
            <div class="confirm-modal" @click.stop>
                <div class="confirm-modal-header">
                    <h4>Remove from visited places?</h4>
                </div>
                <div class="confirm-modal-body">
                    <p>Are you sure you want to remove <strong>{{ selectedLugar?.lugar }}</strong> from your visited
                        places?</p>
                    <p class="text-muted">This action cannot be undone.</p>
                </div>
                <div class="confirm-modal-footer">
                    <button class="btn-cancel" @click="showConfirmModal = false">Cancel</button>
                    <button class="btn-confirm" @click="removeVisitedPlaceItem" :disabled="isRemoving">
                        <span v-if="isRemoving" class="spinner-border spinner-border-sm me-2"></span>
                        Remove
                    </button>
                </div>
            </div>
        </div>

        <!-- Modal de autenticación - Para iniciar sesión si es necesario -->
        <AuthModal :visible="showAuthModal" @close="showAuthModal = false" @login-success="handleLoginSuccess" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useVisitados } from '@/composables/useVisitados';
import VisitDetailsModal from '@/components/VisitDetailsModal.vue';
import AuthModal from '@/components/AuthModal.vue';

// Variables reactivas
const searchQuery = ref(''); // Término de búsqueda
const viewMode = ref('country'); // Modo de visualización: 'country' o 'date'
const showDetailsModal = ref(false); // Controla la visibilidad del modal de detalles
const showConfirmModal = ref(false); // Controla la visibilidad del modal de confirmación
const showAuthModal = ref(false); // Controla la visibilidad del modal de autenticación
const selectedLugar = ref(null); // Lugar seleccionado para editar o eliminar
const isRemoving = ref(false); // Estado de carga durante la eliminación

// Obtener funcionalidades del composable de lugares visitados
const { visitados, visitadosPorPais, visitadosPorFecha, isLoading, fetchVisitados, removeVisitedPlace } = useVisitados();

// Propiedades computadas
// Total de lugares visitados
const totalVisitados = computed(() => visitados.value.length);

// Filtrar lugares visitados según el término de búsqueda
const filteredVisitados = computed(() => {
    if (!searchQuery.value.trim()) return visitados.value;

    const query = searchQuery.value.toLowerCase().trim();
    return visitados.value.filter(visit =>
        (visit.lugar?.toLowerCase() || '').includes(query) ||
        (visit.ciudad?.toLowerCase() || '').includes(query) ||
        (visit.pais?.toLowerCase() || '').includes(query)
    );
});

// Agrupar lugares visitados filtrados por país
const filteredVisitadosPorPais = computed(() => {
    const porPais = {};

    // Agrupar por país
    filteredVisitados.value.forEach(visit => {
        if (!visit.pais) return;

        if (!porPais[visit.pais]) {
            porPais[visit.pais] = [];
        }
        porPais[visit.pais].push(visit);
    });

    // Ordenar alfabéticamente por nombre de país
    return Object.keys(porPais)
        .sort()
        .reduce((acc, pais) => {
            acc[pais] = porPais[pais];
            return acc;
        }, {});
});

// Agrupar lugares visitados filtrados por fecha
const filteredVisitadosPorFecha = computed(() => {
    const porFecha = {};

    // Agrupar por año y mes
    filteredVisitados.value.forEach(visit => {
        if (!visit.fecha_visita) return;

        const fecha = new Date(visit.fecha_visita);
        const yearMonth = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        const label = new Intl.DateTimeFormat('en', { year: 'numeric', month: 'long' }).format(fecha);

        if (!porFecha[yearMonth]) {
            porFecha[yearMonth] = {
                label,
                items: []
            };
        }
        porFecha[yearMonth].items.push(visit);
    });

    // Ordenar cronológicamente (más reciente primero)
    return Object.keys(porFecha)
        .sort()
        .reverse()
        .reduce((acc, fecha) => {
            acc[fecha] = porFecha[fecha];
            return acc;
        }, {});
});

// Funciones auxiliares
// Formatear fecha para mostrar
const formatDate = (dateString, showDay = false) => {
    if (!dateString) return 'Unknown date';

    const date = new Date(dateString);
    if (showDay) {
        // Formato con día (ej: Jan 15, 2023)
        return new Intl.DateTimeFormat('en', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(date);
    }
    // Formato sin día (ej: Jan 2023)
    return new Intl.DateTimeFormat('en', {
        year: 'numeric',
        month: 'short'
    }).format(date);
};

// Truncar texto con puntos suspensivos
const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

// Mostrar modal de detalles de visita
const showVisitDetails = (lugar) => {
    selectedLugar.value = lugar;
    showDetailsModal.value = true;
};

// Cerrar modal de detalles de visita
const closeDetailsModal = () => {
    showDetailsModal.value = false;
    selectedLugar.value = null;
};

// Manejar guardado de visita
const handleVisitSaved = () => {
    fetchVisitados(); // Recargar datos después de guardar
};

// Mostrar modal de confirmación para eliminar un lugar visitado
const confirmRemove = (lugar) => {
    selectedLugar.value = lugar;
    showConfirmModal.value = true;
};

// Eliminar un lugar visitado
const removeVisitedPlaceItem = async () => {
    if (!selectedLugar.value) return;

    isRemoving.value = true;
    try {
        const result = await removeVisitedPlace(selectedLugar.value.id_lugar);
        if (result.success) {
            await fetchVisitados(); // Recargar datos después de eliminar
            showConfirmModal.value = false;
            selectedLugar.value = null;
        }
    } catch (error) {
    } finally {
        isRemoving.value = false;
    }
};

// Manejar requerimiento de inicio de sesión
const handleLoginRequired = () => {
    showAuthModal.value = true;
};

// Manejar inicio de sesión exitoso
const handleLoginSuccess = () => {
    fetchVisitados(); // Recargar datos después de iniciar sesión
};

// Cargar lugares visitados cuando el componente se monta
onMounted(() => {
    fetchVisitados();
});

// Observar cambios en el término de búsqueda para ajustar el modo de vista si es necesario
watch(searchQuery, (newValue) => {
    // Cambiar a vista por fecha si no hay resultados en vista por país
    if (newValue && Object.keys(filteredVisitadosPorPais).length === 0 && viewMode.value === 'country') {
        viewMode.value = 'date';
    }
    // Cambiar a vista por país si no hay resultados en vista por fecha
    else if (newValue && Object.keys(filteredVisitadosPorFecha).length === 0 && viewMode.value === 'date') {
        viewMode.value = 'country';
    }
});
</script>

<style scoped>
/* Contenedor principal - Sin background como solicitado */
.visited-container {
    min-height: 100vh;
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
    color: var(--color-primary, #3a506b);
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
    background-color: var(--color-accent, #ff6b6b);
    border-radius: 2px;
}

/* Estilos para el párrafo de la cabecera */
.countries-header p {
    color: #6c757d;
    font-size: 1.1rem;
    margin-top: 1rem;
}

/* Estado de carga */
.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 5rem 1rem;
    text-align: center;
    background-color: #f8f9fa;
    border-radius: 12px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

/* Animación de carga (spinner) */
.spinner {
    margin: 0 auto;
    width: 70px;
    text-align: center;
    margin-bottom: 1.5rem;
}

.spinner>div {
    width: 18px;
    height: 18px;
    background-color: var(--color-primary, #1e3a8a);
    border-radius: 100%;
    display: inline-block;
    animation: sk-bouncedelay 1.4s infinite ease-in-out both;
    margin: 0 3px;
}

.spinner .bounce1 {
    animation-delay: -0.32s;
}

.spinner .bounce2 {
    animation-delay: -0.16s;
}

@keyframes sk-bouncedelay {

    0%,
    80%,
    100% {
        transform: scale(0);
    }

    40% {
        transform: scale(1.0);
    }
}

/* Estado vacío (sin lugares visitados) */
.empty-visited {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 5rem 1rem;
    text-align: center;
    background-color: #f8f9fa;
    border-radius: 12px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.empty-icon {
    font-size: 5rem;
    color: #6c757d;
    margin-bottom: 1.5rem;
    opacity: 0.7;
}

.empty-visited h2 {
    font-size: 1.8rem;
    margin-bottom: 1rem;
    color: #333;
    font-weight: 600;
}

.empty-visited p {
    color: #6c757d;
    margin-bottom: 2rem;
    max-width: 500px;
    line-height: 1.6;
}

.btn-explore {
    background-color: var(--color-primary, #1e3a8a);
    color: white;
    text-decoration: none;
    padding: 0.75rem 1.5rem;
    border-radius: 30px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
}

.btn-explore:hover {
    background-color: var(--color-accent, #ffa500);
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    color: white;
}

/* Estilos para el contenedor de filtros - Igual que Countries */
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

/* Estilos para el filtro de búsqueda - Igual que Countries */
.search-filter {
    flex: 1;
    position: relative;
}

/* Posicionamiento del icono de búsqueda - Igual que Countries */
.search-filter i {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: #6c757d;
}

/* Estilos para el campo de búsqueda - Igual que Countries */
.search-filter input {
    padding: 0.75rem 1rem 0.75rem 40px;
    border-radius: 30px;
    border: 1px solid #e0e0e0;
    width: 100%;
    font-size: 0.95rem;
    transition: all 0.3s ease;
}

/* Estilos para el campo de búsqueda cuando está enfocado - Igual que Countries */
.search-filter input:focus {
    outline: none;
    border-color: var(--color-primary, #3a506b);
    box-shadow: 0 0 0 3px rgba(58, 80, 107, 0.1);
}

/* Estilos para los filtros de vista - Igual que Countries */
.view-filters {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

/* Etiqueta para el filtro de vista - Igual que Countries */
.filter-label {
    font-size: 0.9rem;
    color: #6c757d;
    font-weight: 500;
}

/* Contenedor para los botones de vista - Igual que Countries */
.view-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

/* Estilos para los botones de vista - Igual que Countries */
.view-btn {
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

/* Estilos para los iconos en los botones de vista - Igual que Countries */
.view-btn i {
    font-size: 0.85rem;
}

/* Efecto hover para los botones de vista - Igual que Countries */
.view-btn:hover {
    background-color: #f0f0f0;
    border-color: #d0d0d0;
}

/* Estilos para el botón de vista activo/seleccionado - Igual que Countries */
.view-btn.active {
    background-color: var(--color-primary, #3a506b);
    color: white;
    border-color: var(--color-primary, #3a506b);
}

/* Secciones de país/fecha */
.country-section,
.date-section {
    margin-bottom: 3rem;
}

/* Encabezados de sección */
.country-header,
.date-header {
    display: flex;
    align-items: center;
    margin-bottom: 1.5rem;
    border-bottom: 2px solid #f0f0f0;
    padding-bottom: 0.75rem;
}

.country-header h2,
.date-header h2 {
    margin: 0;
    font-size: 1.5rem;
    color: #333;
    font-weight: 600;
}

/* Contador de lugares */
.place-count {
    margin-left: 1rem;
    background-color: #e9ecef;
    padding: 0.25rem 0.75rem;
    border-radius: 30px;
    font-size: 0.85rem;
    color: #495057;
}

/* Cuadrícula de destinos */
.destinos-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
    justify-content: center;
}

.destino-card-wrapper {
    width: 100%;
}

/* Tarjetas de destino */
.destino-card {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    border: none;
    height: 100%;
    background-color: white;
}

/* Efecto hover para tarjetas */
.destino-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.12);
}

/* Imagen del destino */
.destino-imagen {
    height: 240px;
    width: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
}

/* Efecto zoom en imagen al hacer hover */
.destino-card:hover .destino-imagen {
    transform: scale(1.05);
}

/* Cuerpo de la tarjeta */
.card-body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
}

/* Título de la tarjeta */
.card-title {
    font-size: 1.3rem;
    margin-bottom: 0.75rem;
    color: #333;
    font-weight: 600;
    line-height: 1.3;
}

/* Badge de visitado */
.visited-badge {
    position: absolute;
    top: 10px;
    left: 10px;
    background-color: rgba(40, 167, 69, 0.9);
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 30px;
    font-weight: 600;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.visited-badge:hover {
    background-color: #28a745;
    transform: translateY(-2px);
}

/* Etiqueta de precio */
.price-tag {
    position: absolute;
    bottom: 10px;
    left: 10px;
    background-color: var(--color-primary, #1e3a8a);
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-weight: 600;
    font-size: 0.85rem;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

/* Estrellas de valoración */
.rating {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
}

.stars {
    display: flex;
    gap: 2px;
}

.stars i {
    color: #ffc107;
    font-size: 0.9rem;
}

.rating-value {
    font-weight: 600;
    font-size: 0.9rem;
    color: #6c757d;
}

/* Ubicación */
.location {
    font-size: 0.9rem;
    color: #6c757d;
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

/* Vista previa de notas */
.notes-preview {
    font-size: 0.85rem;
    color: #6c757d;
    margin-bottom: 1rem;
    background-color: #f8f9fa;
    padding: 0.5rem;
    border-radius: 4px;
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
}

.notes-preview i {
    margin-top: 0.2rem;
}

/* Acciones de tarjeta */
.card-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: auto;
}

/* Botón de detalles */
.btn-details {
    flex: 1;
    background-color: var(--color-primary, #1e3a8a);
    color: white;
    text-decoration: none;
    padding: 0.75rem 1rem;
    border-radius: 4px;
    font-weight: 500;
    text-align: center;
    transition: all 0.3s ease;
    font-size: 0.95rem;
}

.btn-details:hover {
    background-color: var(--color-accent, #ffa500);
    color: white;
}

/* Botones de editar y eliminar */
.btn-edit,
.btn-remove {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn-edit {
    background-color: #e9ecef;
    color: #495057;
}

.btn-remove {
    background-color: #f8d7da;
    color: #dc3545;
}

.btn-edit:hover {
    background-color: #dee2e6;
}

.btn-remove:hover {
    background-color: #f5c2c7;
}

/* Sin resultados - Igual que Countries */
.no-results {
    text-align: center;
    padding: 5rem 1rem;
    color: var(--color-text);
}

/* Modal de confirmación */
.confirm-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1050;
    padding: 1rem;
}

.confirm-modal {
    background-color: white;
    border-radius: 8px;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    animation: modal-appear 0.3s ease-out;
}

.confirm-modal-header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #e5e7eb;
}

.confirm-modal-header h4 {
    margin: 0;
    color: #dc3545;
    font-weight: 600;
}

.confirm-modal-body {
    padding: 1.5rem;
}

.confirm-modal-body p {
    margin-bottom: 0.5rem;
}

.text-muted {
    color: #6c757d;
    font-size: 0.9rem;
}

.confirm-modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border-top: 1px solid #e5e7eb;
}

/* Botones del modal de confirmación */
.btn-cancel,
.btn-confirm {
    padding: 0.5rem 1.25rem;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-cancel {
    background-color: #e9ecef;
    border: none;
    color: #495057;
}

.btn-confirm {
    background-color: #dc3545;
    border: none;
    color: white;
    display: flex;
    align-items: center;
}

.btn-cancel:hover {
    background-color: #dee2e6;
}

.btn-confirm:hover {
    background-color: #c82333;
}

.btn-confirm:disabled {
    opacity: 0.65;
    cursor: not-allowed;
}

/* Animación para la aparición del modal */
@keyframes modal-appear {
    from {
        opacity: 0;

        transform: translateY(-20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Media queries - Responsive */
@media (max-width: 1024px) {
    .destinos-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .destino-imagen {
        height: 220px;
    }

    .card-title {
        font-size: 1.2rem;
    }
}

@media (max-width: 768px) {
    .favorites-filters {
        padding: 1rem;
    }

    .view-buttons {
        gap: 0.4rem;
    }

    .view-btn {
        padding: 0.35rem 0.7rem;
        font-size: 0.8rem;
    }

    .destinos-grid {
        grid-template-columns: 1fr;
        gap: 1.5rem;
    }

    .destino-imagen {
        height: 240px;
    }

    .countries-header h1 {
        font-size: 2rem;
    }
}

@media (max-width: 576px) {
    .visited-container {
        padding: 1.5rem 0.75rem;
    }

    .countries-header h1 {
        font-size: 1.8rem;
    }

    .countries-header p {
        font-size: 1rem;
    }

    .empty-visited {
        padding: 3rem 1rem;
    }

    .empty-visited h2 {
        font-size: 1.5rem;
    }

    .destino-imagen {
        height: 200px;
    }

    .card-body {
        padding: 1.25rem;
    }

    .view-btn {
        padding: 0.35rem 0.7rem;
        font-size: 0.8rem;
    }
}
</style>
