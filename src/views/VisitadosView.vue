<template>
    <div class="visited-container">
        <div class="container py-5">
            <h1 class="text-center mb-4">My Visited Places</h1>

            <!-- Loading state -->
            <div v-if="isLoading" class="loading-container">
                <div class="spinner">
                    <div class="bounce1"></div>
                    <div class="bounce2"></div>
                    <div class="bounce3"></div>
                </div>
                <p>Loading your visited places...</p>
            </div>

            <!-- Empty state (no visited places) -->
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

            <!-- Visited places list -->
            <div v-else class="visited-content">
                <!-- Filters -->
                <div class="visited-filters">
                    <div class="search-filter">
                        <i class="bi bi-search"></i>
                        <input type="text" v-model="searchQuery" placeholder="Search by country, city or place..."
                            class="form-control" />
                    </div>
                    <div class="view-toggle">
                        <button 
                            @click="viewMode = 'country'" 
                            :class="{ active: viewMode === 'country' }" 
                            class="toggle-btn"
                        >
                            <i class="bi bi-globe"></i> By Country
                        </button>
                        <button 
                            @click="viewMode = 'date'" 
                            :class="{ active: viewMode === 'date' }" 
                            class="toggle-btn"
                        >
                            <i class="bi bi-calendar3"></i> By Date
                        </button>
                    </div>
                </div>

                <!-- View by country -->
                <div v-if="viewMode === 'country' && Object.keys(filteredVisitadosPorPais).length > 0">
                    <div v-for="(lugares, pais) in filteredVisitadosPorPais" :key="pais" class="country-section">
                        <div class="country-header">
                            <h2>{{ pais }}</h2>
                            <span class="place-count">{{ lugares.length }} {{ lugares.length === 1 ? 'place' : 'places' }}</span>
                        </div>

                        <!-- Places grid -->
                        <div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
                            <div v-for="lugar in lugares" :key="lugar.id_lugar" class="col">
                                <div class="card destino-card">
                                    <div class="position-relative">
                                        <img :src="lugar.imagen1 || '/placeholder.jpg'" :alt="lugar.lugar"
                                            class="card-img-top destino-imagen">

                                        <!-- Visited badge -->
                                        <div class="visited-badge" @click="showVisitDetails(lugar)">
                                            <i class="bi bi-check-circle-fill"></i>
                                            <span>{{ formatDate(lugar.fecha_visita) }}</span>
                                        </div>

                                        <!-- Price tag -->
                                        <div class="price-tag">
                                            <span v-if="!lugar.precio || lugar.precio === 0">Free</span>
                                            <span v-else>{{ lugar.precio }}€</span>
                                        </div>
                                    </div>

                                    <div class="card-body">
                                        <h5 class="card-title">{{ lugar.lugar }}</h5>

                                        <!-- Rating with stars -->
                                        <div class="rating" v-if="lugar.valoracion">
                                            <div class="stars">
                                                <template v-for="n in 5" :key="n">
                                                    <i class="bi"
                                                        :class="n <= Math.round(lugar.valoracion) ? 'bi-star-fill' : 'bi-star'"></i>
                                                </template>
                                            </div>
                                            <span class="rating-value">{{ lugar.valoracion }}</span>
                                        </div>

                                        <!-- Location -->
                                        <p class="location">
                                            <i class="bi bi-geo-alt"></i> {{ lugar.ciudad }}, {{ lugar.pais }}
                                        </p>

                                        <!-- Notes preview if available -->
                                        <p v-if="lugar.notas" class="notes-preview">
                                            <i class="bi bi-journal-text"></i>
                                            {{ truncateText(lugar.notas, 60) }}
                                        </p>

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

                <!-- View by date -->
                <div v-else-if="viewMode === 'date' && Object.keys(filteredVisitadosPorFecha).length > 0">
                    <div v-for="(period, key) in filteredVisitadosPorFecha" :key="key" class="date-section">
                        <div class="date-header">
                            <h2>{{ period.label }}</h2>
                            <span class="place-count">{{ period.items.length }} {{ period.items.length === 1 ? 'place' : 'places' }}</span>
                        </div>

                        <!-- Places grid -->
                        <div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
                            <div v-for="lugar in period.items" :key="lugar.id_lugar" class="col">
                                <div class="card destino-card">
                                    <div class="position-relative">
                                        <img :src="lugar.imagen1 || '/placeholder.jpg'" :alt="lugar.lugar"
                                            class="card-img-top destino-imagen">

                                        <!-- Visited badge -->
                                        <div class="visited-badge" @click="showVisitDetails(lugar)">
                                            <i class="bi bi-check-circle-fill"></i>
                                            <span>{{ formatDate(lugar.fecha_visita, true) }}</span>
                                        </div>

                                        <!-- Price tag -->
                                        <div class="price-tag">
                                            <span v-if="!lugar.precio || lugar.precio === 0">Free</span>
                                            <span v-else>{{ lugar.precio }}€</span>
                                        </div>
                                    </div>

                                    <div class="card-body">
                                        <h5 class="card-title">{{ lugar.lugar }}</h5>

                                        <!-- Location -->
                                        <p class="location">
                                            <i class="bi bi-geo-alt"></i> {{ lugar.ciudad }}, {{ lugar.pais }}
                                        </p>

                                        <!-- Notes preview if available -->
                                        <p v-if="lugar.notas" class="notes-preview">
                                            <i class="bi bi-journal-text"></i>
                                            {{ truncateText(lugar.notas, 60) }}
                                        </p>

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

                <!-- No results after filtering -->
                <div v-else-if="searchQuery" class="no-results">
                    <i class="bi bi-search"></i>
                    <p>No visited places found matching "{{ searchQuery }}"</p>
                    <button @click="searchQuery = ''" class="btn-clear">Clear search</button>
                </div>
            </div>
        </div>

        <!-- Visit details modal -->
        <VisitDetailsModal
            :visible="showDetailsModal"
            :lugar-id="selectedLugar?.id_lugar"
            :existing-data="selectedLugar"
            @close="closeDetailsModal"
            @saved="handleVisitSaved"
            @login-required="handleLoginRequired"
        />

        <!-- Confirmation modal -->
        <div v-if="showConfirmModal" class="confirm-modal-overlay" @click="showConfirmModal = false">
            <div class="confirm-modal" @click.stop>
                <div class="confirm-modal-header">
                    <h4>Remove from visited places?</h4>
                </div>
                <div class="confirm-modal-body">
                    <p>Are you sure you want to remove <strong>{{ selectedLugar?.lugar }}</strong> from your visited places?</p>
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

        <!-- Auth modal -->
        <AuthModal :visible="showAuthModal" @close="showAuthModal = false" @login-success="handleLoginSuccess" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useVisitados } from '@/composables/useVisitados';
import VisitDetailsModal from '@/components/VisitDetailsModal.vue';
import AuthModal from '@/components/AuthModal.vue';

const searchQuery = ref('');
const viewMode = ref('country'); // 'country' or 'date'
const showDetailsModal = ref(false);
const showConfirmModal = ref(false);
const showAuthModal = ref(false);
const selectedLugar = ref(null);
const isRemoving = ref(false);

const { visitados, visitadosPorPais, visitadosPorFecha, isLoading, fetchVisitados, removeVisitedPlace } = useVisitados();

// Computed properties
const totalVisitados = computed(() => visitados.value.length);

// Filter visited places by search query
const filteredVisitados = computed(() => {
    if (!searchQuery.value.trim()) return visitados.value;

    const query = searchQuery.value.toLowerCase().trim();
    return visitados.value.filter(visit => 
        (visit.lugar?.toLowerCase() || '').includes(query) ||
        (visit.ciudad?.toLowerCase() || '').includes(query) ||
        (visit.pais?.toLowerCase() || '').includes(query)
    );
});

// Group filtered visited places by country
const filteredVisitadosPorPais = computed(() => {
    const porPais = {};

    filteredVisitados.value.forEach(visit => {
        if (!visit.pais) return;

        if (!porPais[visit.pais]) {
            porPais[visit.pais] = [];
        }
        porPais[visit.pais].push(visit);
    });

    return Object.keys(porPais)
        .sort()
        .reduce((acc, pais) => {
            acc[pais] = porPais[pais];
            return acc;
        }, {});
});

// Group filtered visited places by date
const filteredVisitadosPorFecha = computed(() => {
    const porFecha = {};

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

    return Object.keys(porFecha)
        .sort()
        .reverse()
        .reduce((acc, fecha) => {
            acc[fecha] = porFecha[fecha];
            return acc;
        }, {});
});

// Format date for display
const formatDate = (dateString, showDay = false) => {
    if (!dateString) return 'Unknown date';
    
    const date = new Date(dateString);
    if (showDay) {
        return new Intl.DateTimeFormat('en', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        }).format(date);
    }
    return new Intl.DateTimeFormat('en', { 
        year: 'numeric', 
        month: 'short'
    }).format(date);
};

// Truncate text with ellipsis
const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

// Show visit details modal
const showVisitDetails = (lugar) => {
    selectedLugar.value = lugar;
    showDetailsModal.value = true;
};

// Close visit details modal
const closeDetailsModal = () => {
    showDetailsModal.value = false;
    selectedLugar.value = null;
};

// Handle visit saved
const handleVisitSaved = () => {
    fetchVisitados();
};

// Show confirmation modal for removing a visited place
const confirmRemove = (lugar) => {
    selectedLugar.value = lugar;
    showConfirmModal.value = true;
};

// Remove a visited place
const removeVisitedPlaceItem = async () => {
    if (!selectedLugar.value) return;
    
    isRemoving.value = true;
    try {
        const result = await removeVisitedPlace(selectedLugar.value.id_lugar);
        if (result.success) {
            await fetchVisitados();
            showConfirmModal.value = false;
            selectedLugar.value = null;
        }
    } catch (error) {
        console.error('Error removing visited place:', error);
    } finally {
        isRemoving.value = false;
    }
};

// Handle login required
const handleLoginRequired = () => {
    showAuthModal.value = true;
};

// Handle successful login
const handleLoginSuccess = () => {
    fetchVisitados();
};

// Load visited places when component mounts
onMounted(() => {
    fetchVisitados();
});

// Watch for changes in search query to reset view mode if needed
watch(searchQuery, (newValue) => {
    if (newValue && Object.keys(filteredVisitadosPorPais).length === 0 && viewMode.value === 'country') {
        viewMode.value = 'date';
    } else if (newValue && Object.keys(filteredVisitadosPorFecha).length === 0 && viewMode.value === 'date') {
        viewMode.value = 'country';
    }
});
</script>

<style scoped>
.visited-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1rem;
    font-family: 'Poppins', sans-serif;
}

.visited-container h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    color: var(--color-primary, #1e3a8a);
    font-weight: 700;
    position: relative;
    display: inline-block;
}

.visited-container h1::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 4px;
    background-color: var(--color-accent, #ffa500);
    border-radius: 2px;
}

/* Loading state */
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

.spinner {
    margin: 0 auto;
    width: 70px;
    text-align: center;
    margin-bottom: 1.5rem;
}

.spinner > div {
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
    0%, 80%, 100% { 
        transform: scale(0);
    } 
    40% { 
        transform: scale(1.0);
    }
}

/* Empty state */
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

/* Filters */
.visited-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 2rem;
    background-color: #f8f9fa;
    padding: 1.25rem;
    border-radius: 12px;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
    justify-content: space-between;
    align-items: center;
}

.search-filter {
    flex: 1;
    min-width: 250px;
    position: relative;
}

.search-filter i {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: #6c757d;
}

.search-filter input {
    padding: 0.75rem 1rem 0.75rem 40px;
    border-radius: 30px;
    border: 1px solid #e0e0e0;
    width: 100%;
    font-size: 0.95rem;
    transition: all 0.3s ease;
}

.search-filter input:focus {
    outline: none;
    border-color: var(--color-primary, #1e3a8a);
    box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1);
}

.view-toggle {
    display: flex;
    gap: 0.5rem;
}

.toggle-btn {
    background-color: #e9ecef;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 30px;
    font-weight: 500;
    color: #495057;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.toggle-btn.active {
    background-color: var(--color-primary, #1e3a8a);
    color: white;
}

.toggle-btn:hover:not(.active) {
    background-color: #dee2e6;
}

/* Country/Date sections */
.country-section, .date-section {
    margin-bottom: 3rem;
}

.country-header, .date-header {
    display: flex;
    align-items: center;
    margin-bottom: 1.5rem;
    border-bottom: 2px solid #f0f0f0;
    padding-bottom: 0.75rem;
}

.country-header h2, .date-header h2 {
    margin: 0;
    font-size: 1.5rem;
    color: #333;
    font-weight: 600;
}

.place-count {
    margin-left: 1rem;
    background-color: #e9ecef;
    padding: 0.25rem 0.75rem;
    border-radius: 30px;
    font-size: 0.85rem;
    color: #495057;
}

/* Destination cards */
.destino-card {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    border: none;
    height: 100%;
    background-color: white;
}

.destino-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.12);
}

.destino-imagen {
    height: 200px;
    object-fit: cover;
    transition: transform 0.5s ease;
}

.destino-card:hover .destino-imagen {
    transform: scale(1.05);
}

.card-body {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
}

.card-title {
    font-size: 1.2rem;
    margin-bottom: 0.75rem;
    color: #333;
    font-weight: 600;
    line-height: 1.3;
}

/* Visited badge */
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

/* Price tag */
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

/* Rating stars */
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

/* Location */
.location {
    font-size: 0.9rem;
    color: #6c757d;
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

/* Notes preview */
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

/* Card actions */
.card-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: auto;
}

.btn-details {
    flex: 1;
    background-color: var(--color-primary, #1e3a8a);
    color: white;
    text-decoration: none;
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
    font-weight: 500;
    text-align: center;
    transition: all 0.3s ease;
    font-size: 0.9rem;
}

.btn-details:hover {
    background-color: var(--color-accent, #ffa500);
    color: white;
}

.btn-edit, .btn-remove {
    width: 36px;
    height: 36px;
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

/* No results */
.no-results {
    text-align: center;
    padding: 3rem;
    background-color: #f8f9fa;
    border-radius: 12px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.no-results i {
    font-size: 3rem;
    color: #6c757d;
    margin-bottom: 1rem;
    opacity: 0.7;
}

.no-results p {
    color: #495057;
    margin-bottom: 1.5rem;
}

.btn-clear {
    background-color: var(--color-primary, #1e3a8a);
    color: white;
    border: none;
    padding: 0.5rem 1.5rem;
    border-radius: 30px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn-clear:hover {
    background-color: var(--color-accent, #ffa500);
}

/* Confirmation modal */
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

.btn-cancel, .btn-confirm {
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

/* Media queries */
@media (max-width: 1024px) {
    .destino-imagen {
        height: 180px;
    }

    .card-title {
        font-size: 1.1rem;
    }
}

@media (max-width: 768px) {
    .visited-filters {
        flex-direction: column;
        align-items: stretch;
    }

    .view-toggle {
        width: 100%;
        justify-content: center;
    }

    .destino-imagen {
        height: 160px;
    }

    .visited-container h1 {
        font-size: 2rem;
    }
}

@media (max-width: 576px) {
    .visited-container {
        padding: 1.5rem 0.75rem;
    }

    .visited-container h1 {
        font-size: 1.8rem;
    }

    .empty-visited {
        padding: 3rem 1rem;
    }

    .empty-visited h2 {
        font-size: 1.5rem;
    }
}
</style>
