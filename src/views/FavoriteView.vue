<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import FavoriteButton from '@/components/FavoriteButton.vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const favoritos = ref([]);
const searchQuery = ref('');
const isLoading = ref(false);
const totalFavorites = computed(() => favoritos.value.length);
const filteredFavorites = computed(() => {
    if (!searchQuery.value.trim()) return favoritos.value;

    const query = searchQuery.value.toLowerCase();
    return favoritos.value.filter(fav =>
        (fav.lugar?.toLowerCase() || '').includes(query) ||
        (fav.ciudad?.toLowerCase() || '').includes(query) ||
        (fav.pais?.toLowerCase() || '').includes(query)
    );
});

// Group favorites by country
const favoritosPorPais = computed(() => {
    const porPais = {};

    filteredFavorites.value.forEach(fav => {
        if (!fav.pais) return; // Ignore favorites without country

        if (!porPais[fav.pais]) {
            porPais[fav.pais] = [];
        }
        porPais[fav.pais].push(fav);
    });

    // Sort countries alphabetically
    return Object.keys(porPais)
        .sort()
        .reduce((acc, pais) => {
            acc[pais] = porPais[pais];
            return acc;
        }, {});
});

// Load favorites from localStorage
const loadFavorites = () => {
    isLoading.value = true;
    console.log('Starting to load favorites...');

    try {
        const storedFavorites = localStorage.getItem('favoritos');
        console.log('Data in localStorage:', storedFavorites);

        if (storedFavorites) {
            const parsedFavorites = JSON.parse(storedFavorites);
            console.log('Parsed favorites:', parsedFavorites);

            // Verify that each favorite has the necessary fields
            favoritos.value = parsedFavorites.map(fav => {
                // Ensure each favorite has an id and required fields
                if (!fav.id) console.warn('Favorite without ID:', fav);
                if (!fav.lugar) console.warn('Favorite without place name:', fav);
                if (!fav.pais) console.warn('Favorite without country:', fav);

                return {
                    id: fav.id,
                    lugar: fav.lugar || 'Unnamed place',
                    ciudad: fav.ciudad || 'Unknown city',
                    pais: fav.pais || 'Unknown country',
                    precio: fav.precio || 0,
                    valoracion: fav.valoracion || 0,
                    imagen1: fav.imagen1 || '/placeholder.jpg'
                };
            });

            console.log('Processed favorites:', favoritos.value);
            console.log('Favorites grouped by country:', favoritosPorPais.value);
        } else {
            favoritos.value = [];
            console.log('No favorites in localStorage');
        }
    } catch (error) {
        console.error('Error loading favorites:', error);
        favoritos.value = [];
    } finally {
        isLoading.value = false;
    }
};

// Remove a favorite by ID
const removeFavorite = (id) => {
    console.log(`Removing favorite with ID: ${id}`);

    try {
        // Get current favorites from localStorage
        const storedFavorites = localStorage.getItem('favoritos');

        if (storedFavorites) {
            let favorites = JSON.parse(storedFavorites);

            // Find the index of the favorite to remove
            const index = favorites.findIndex(fav => String(fav.id) === String(id));

            if (index !== -1) {
                // Remove the favorite
                favorites.splice(index, 1);

                // Save back to localStorage
                localStorage.setItem('favoritos', JSON.stringify(favorites));

                console.log(`Favorite with ID ${id} removed successfully`);

                // Update the local state
                loadFavorites();

                // Notify other components
                window.dispatchEvent(new Event('favoritesUpdated'));
            } else {
                console.warn(`Favorite with ID ${id} not found`);
            }
        }
    } catch (error) {
        console.error('Error removing favorite:', error);
    }
};



// Handle favorite toggle
const handleFavoriteToggle = (isNowFavorite) => {
    console.log('Favorite toggled, is now favorite:', isNowFavorite);
    // Force reload favorites after a short delay to ensure localStorage is updated
    setTimeout(() => {
        loadFavorites();
    }, 100);
};

// Handle favorites updated event
const handleFavoritesUpdated = () => {
    console.log('Favorites updated event received');
    loadFavorites();
};

// Function to handle localStorage changes
const handleStorageChange = (event) => {
    if (event.key === 'favoritos') {
        console.log('localStorage change detected for favoritos');
        loadFavorites();
    }
};

// Load favorites when component mounts
onMounted(() => {
    loadFavorites();

    // Listen for localStorage changes
    window.addEventListener('storage', handleStorageChange);

    // Listen for custom favorites updated event
    window.addEventListener('favoritesUpdated', handleFavoritesUpdated);
});

onUnmounted(() => {
    // Clean up event listeners
    window.removeEventListener('favoritesUpdated', handleFavoritesUpdated);
    window.removeEventListener('storage', handleStorageChange);
});
</script>

<template>
    <div class="favorites-container">
        <div class="favorites-header">
            <h1>My Favorite Places</h1>
            <p v-if="totalFavorites > 0">You have saved {{ totalFavorites }} places to your favorites</p>
        </div>

        <!-- Loading state -->
        <div v-if="isLoading" class="loading-container">
            <div class="spinner">
                <div class="bounce1"></div>
                <div class="bounce2"></div>
                <div class="bounce3"></div>
            </div>
            <p>Loading your favorite places...</p>
        </div>

        <!-- Empty state (no favorites) -->
        <div v-else-if="totalFavorites === 0" class="empty-favorites">
            <div class="empty-heart">
                <i class="bi bi-heart"></i>
                <i class="bi bi-plus plus-icon"></i>
            </div>
            <h2>You don't have any favorite places yet</h2>
            <p>Explore our destinations and mark the places you like as favorites to save them here</p>
            <router-link to="/" class="btn-explore">
                <i class="bi bi-compass"></i> Explore destinations
            </router-link>
        </div>

        <!-- Favorites list -->
        <div v-else class="favorites-content">
            <!-- Filters -->
            <div class="favorites-filters">
                <div class="search-filter">
                    <i class="bi bi-search"></i>
                    <input type="text" v-model="searchQuery" placeholder="Search by country, city or place..."
                        class="form-control" />
                </div>
            </div>

            <!-- Favorites list by country -->
            <div v-if="Object.keys(favoritosPorPais).length > 0">
                <div v-for="(lugares, pais) in favoritosPorPais" :key="pais" class="country-section">
                    <div class="country-header">
                        <h2>{{ pais }}</h2>
                    </div>

                    <!-- Places grid -->
                    <div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
                        <div v-for="lugar in lugares" :key="lugar.id" class="col">
                            <div class="card destino-card">
                                <div class="position-relative">
                                    <img :src="lugar.imagen1 || '/placeholder.jpg'" :alt="lugar.lugar"
                                        class="card-img-top destino-imagen">

                                    <!-- Favorite button -->
                                    <FavoriteButton :lugar-id="lugar.id" :lugar-info="{
                                        nombre: lugar.lugar,
                                        nombreCiudad: lugar.ciudad,
                                        nombrePais: lugar.pais,
                                        precio: lugar.precio,
                                        valoracion: lugar.valoracion,
                                        imagen1: lugar.imagen1
                                    }" @toggle="handleFavoriteToggle" @remove-favorite="removeFavorite" />

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
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div v-else-if="totalFavorites > 0" class="empty-message">
                <p>Could not group favorites by country. Check the console for more details.</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.favorites-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1rem;
    font-family: 'Poppins', sans-serif;
}

.favorites-header {
    margin-bottom: 2.5rem;
    text-align: center;
    position: relative;
}

.favorites-header h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    color: var(--color-primary, #3a506b);
    font-weight: 700;
    position: relative;
    display: inline-block;
}

.favorites-header h1::after {
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

.favorites-header p {
    color: #6c757d;
    font-size: 1.1rem;
    margin-top: 1rem;
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

.spinner>div {
    width: 18px;
    height: 18px;
    background-color: var(--color-primary, #3a506b);
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

.loading-container p {
    color: #6c757d;
    font-size: 1.1rem;
}

/* Empty state (no favorites) */
.empty-favorites {
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

.empty-heart {
    position: relative;
    font-size: 5rem;
    color: #dc3545;
    margin-bottom: 1.5rem;
    opacity: 0.7;
    animation: pulse 2s infinite;
}

.plus-icon {
    position: absolute;
    font-size: 2rem;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
}

@keyframes pulse {
    0% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.1);
    }

    100% {
        transform: scale(1);
    }
}

.empty-favorites h2 {
    font-size: 1.8rem;
    margin-bottom: 1rem;
    color: #333;
    font-weight: 600;
}

.empty-favorites p {
    color: #6c757d;
    margin-bottom: 2rem;
    max-width: 500px;
    line-height: 1.6;
}

.btn-explore {
    background-color: var(--color-primary, #3a506b);
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
    background-color: var(--color-accent, #ff6b6b);
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    color: white;
}

/* Filters */
.favorites-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 2rem;
    background-color: #f8f9fa;
    padding: 1.25rem;
    border-radius: 12px;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
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
    border-color: var(--color-primary, #3a506b);
    box-shadow: 0 0 0 3px rgba(58, 80, 107, 0.1);
}

.sort-filter {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.sort-filter label {
    white-space: nowrap;
    margin-bottom: 0;
    font-weight: 500;
    color: #495057;
}

.sort-filter select {
    padding: 0.75rem 1rem;
    border-radius: 30px;
    border: 1px solid #e0e0e0;
    font-size: 0.95rem;
    transition: all 0.3s ease;
    background-position: right 1rem center;
}

.sort-filter select:focus {
    outline: none;
    border-color: var(--color-primary, #3a506b);
    box-shadow: 0 0 0 3px rgba(58, 80, 107, 0.1);
}

/* Country section */
.country-section {
    margin-bottom: 3rem;
}

.country-header {
    display: flex;
    align-items: center;
    margin-bottom: 1.5rem;
    border-bottom: 2px solid #f0f0f0;
    padding-bottom: 0.75rem;
}

.country-header h2 {
    margin: 0;
    font-size: 1.5rem;
    color: #333;
    font-weight: 600;
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

/* Price tag */
.price-tag {
    position: absolute;
    bottom: 10px;
    left: 10px;
    background-color: var(--color-primary, #3a506b);
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
    margin-bottom: 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

/* Details button */
.btn-details {
    background-color: var(--color-primary, #3a506b);
    color: white;
    text-decoration: none;
    padding: 0.6rem 1.25rem;
    border-radius: 30px;
    font-weight: 500;
    text-align: center;
    transition: all 0.3s ease;
    margin-top: auto;
    display: block;
}

.btn-details:hover {
    background-color: var(--color-accent, #ff6b6b);
    transform: translateY(-2px);
    color: white;
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
    .favorites-filters {
        flex-direction: column;
    }

    .sort-filter {
        width: 100%;
    }

    .sort-filter select {
        flex: 1;
    }

    .destino-imagen {
        height: 160px;
    }

    .favorites-header h1 {
        font-size: 2rem;
    }

    .empty-heart {
        font-size: 4rem;
    }
}

@media (max-width: 576px) {
    .favorites-container {
        padding: 1.5rem 0.75rem;
    }

    .favorites-header h1 {
        font-size: 1.8rem;
    }

    .favorites-header p {
        font-size: 1rem;
    }

    .empty-favorites {
        padding: 3rem 1rem;
    }

    .empty-favorites h2 {
        font-size: 1.5rem;
    }
}

.empty-message {
    background-color: #f8d7da;
    color: #721c24;
    padding: 1rem;
    border-radius: 8px;
    text-align: center;
    margin: 2rem 0;
}
</style>
  
