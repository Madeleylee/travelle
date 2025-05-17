<template>
    <div class="countries-page">
        <div class="container py-4">
            <h1 class="mb-4">Explore by Country</h1>

            <!-- Country search -->
            <div class="search-container mb-4">
                <div class="input-group">
                    <span class="input-group-text bg-light border-end-0">
                        <i class="bi bi-search"></i>
                    </span>
                    <input type="text" class="form-control border-start-0 ps-0" placeholder="Search country..."
                        v-model="searchText">
                </div>
            </div>

            <!-- Continent filter -->
            <div class="continent-filter mb-4">
                <div class="d-flex flex-wrap gap-2">
                    <button v-for="continent in continents" :key="continent.value" class="btn rounded-pill px-3 py-1"
                        :class="selectedContinent === continent.value ? 'btn-primary' : 'btn-outline-secondary'"
                        @click="selectedContinent = continent.value">
                        {{ continent.label }}
                    </button>
                </div>
            </div>

            <!-- Loading indicator -->
            <div v-if="isLoading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading countries...</span>
                </div>
                <p class="mt-3">Loading countries...</p>
            </div>

            <!-- Countries grid -->
            <div v-else-if="filteredCountries.length > 0" class="countries-grid">
                <div v-for="pais in filteredCountries" :key="pais.id_pais" class="country-card"
                    @click="navigateToCountry(pais.nombre)">
                    <div class="card h-100 border-0 shadow-sm">
                        <div class="country-flag">
                            <img :src="pais.bandera" :alt="`Flag of ${pais.nombre}`" class="flag-img"
                                @error="handleFlagError" />
                        </div>
                        <div class="card-body">
                            <h5 class="card-title">{{ pais.nombre }}</h5>
                            <p class="card-text text-muted">{{ pais.ciudades.length }} {{ pais.ciudades.length === 1 ?
                                'city' : 'cities' }}</p>
                        </div>
                        <div class="card-footer bg-transparent border-0 text-end">
                            <button class="btn btn-sm btn-primary">
                                Explore <i class="bi bi-arrow-right ms-1"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- No results message -->
            <div v-else class="no-results text-center py-5">
                <i class="bi bi-search display-1 text-muted"></i>
                <h3 class="mt-3">No countries found</h3>
                <p class="text-muted">Try a different search or filter</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getPaisesConCiudades } from '@/composables/useDatabase';

const router = useRouter();
const paises = ref([]);
const searchText = ref('');
const selectedContinent = ref('all');
const isLoading = ref(true);

const continents = [
    { value: 'all', label: 'All' },
    { value: 'europe', label: 'Europe' },
    { value: 'america', label: 'America' },
    { value: 'asia', label: 'Asia' },
    { value: 'africa', label: 'Africa' },
    { value: 'oceania', label: 'Oceania' }
];

// Map countries to continents (simplified)
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
    // Add more countries as needed
};

// Countries filtered by search and continent
const filteredCountries = computed(() => {
    let result = paises.value;

    // Filter by search text
    if (searchText.value) {
        const searchTerm = searchText.value.toLowerCase().trim();
        result = result.filter(pais =>
            pais.nombre.toLowerCase().includes(searchTerm)
        );
    }

    // Filter by continent
    if (selectedContinent.value !== 'all') {
        result = result.filter(pais =>
            countryToContinent[pais.nombre] === selectedContinent.value
        );
    }

    return result;
});

// Handle flag image loading errors
function handleFlagError(e) {
    // Use a placeholder image in case of error
    e.target.src = 'https://res.cloudinary.com/dxhxsxijx/image/upload/v1747436853/Travelle/banderas/placeholder-flag.jpg';
}

// Navigate to country page
function navigateToCountry(nombrePais) {
    router.push({ name: 'Pais', params: { nombrePais } });
}

onMounted(async () => {
    try {
        isLoading.value = true;
        paises.value = await getPaisesConCiudades();
        console.log('Countries loaded:', paises.value);
    } catch (error) {
        console.error('Error loading countries:', error);
        paises.value = [];
    } finally {
        isLoading.value = false;
    }
});
</script>

<style scoped>
.countries-page {
    min-height: 100vh;
    background-color: var(--color-background);
}

.search-container {
    max-width: 500px;
    margin: 0 auto;
}

.countries-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1.5rem;
}

.country-card {
    cursor: pointer;
    transition: transform 0.3s ease;
}

.country-card:hover {
    transform: translateY(-5px);
}

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

.flag-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.card-title {
    font-weight: 600;
    color: var(--color-text);
}

.no-results {
    color: var(--color-text);
}

.continent-filter {
    display: flex;
    justify-content: center;
    margin-bottom: 2rem;
}

/* Responsive */
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
}
</style>