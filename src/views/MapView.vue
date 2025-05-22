<script setup>
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { getLugaresCercanos, getTodosLosLugares } from '@/composables/useDatabase';

const router = useRouter();

// Reactive variables
const map = ref(null);
const L = ref(null); // Reference to Leaflet library
const userLocation = ref(null);
const places = ref([]);
const allPlaces = ref([]);
const isLoading = ref(true);
const error = ref(null);
const mapContainer = ref(null);
const radiusKm = ref(50);
const markersGroup = ref(null);
const mapInitialized = ref(false);
const isMobile = ref(false); // Variable to check if it's mobile
const locationPermissionStatus = ref('prompt'); // 'prompt', 'granted', 'denied'
const selectedCountry = ref(null);
const countries = ref([]);
const viewMode = ref('nearby'); // 'nearby' or 'country'

// Function to check if it's a mobile device
const checkIfMobile = () => {
    try {
        if (typeof window !== 'undefined') {
            isMobile.value = window.innerWidth < 768;
        }
    } catch (err) {
        console.error('Error checking if mobile:', err);
        isMobile.value = false;
    }
};

// Function to get all countries
const loadCountries = async () => {
    try {
        // Load countries from database
        try {
            const { getPaises } = await import('@/composables/useDatabase');
            countries.value = await getPaises();
            console.log('Countries loaded from database:', countries.value);
        } catch (err) {
            console.error('Error loading countries from database:', err);
            countries.value = [];
        }
    } catch (err) {
        console.error('Error in loadCountries:', err);
        countries.value = [];
    }
};

// Places to show based on view mode
const placesToShow = computed(() => {
    try {
        let result = [];

        switch (viewMode.value) {
            case 'nearby':
                result = places.value || [];
                console.log(`Showing ${result.length} nearby places`);
                break;
            case 'country':
                if (selectedCountry.value) {
                    result = (allPlaces.value || []).filter(place => place.id_pais === selectedCountry.value);
                    console.log(`Showing ${result.length} places in country ID: ${selectedCountry.value}`);
                } else {
                    result = [];
                    console.log('No country selected, showing 0 places');
                }
                break;
            default:
                result = places.value || [];
        }

        return result;
    } catch (err) {
        console.error('Error in computed placesToShow:', err);
        return [];
    }
});

// Set view mode
const setViewMode = (mode, countryId = null) => {
    try {
        viewMode.value = mode;

        if (mode === 'country') {
            selectedCountry.value = countryId || selectedCountry.value;
        }

        // Update map view
        if (mapInitialized.value) {
            if (mode === 'nearby' && userLocation.value) {
                map.value.setView([userLocation.value.lat, userLocation.value.lng], 13);
            } else {
                // Fit bounds to all visible places
                fitMapToPlaces();
            }

            // Update markers
            addPlacesToMap();
        }
    } catch (err) {
        console.error('Error setting view mode:', err);
    }
};

// Fit map to visible places
const fitMapToPlaces = () => {
    try {
        if (!mapInitialized.value || !map.value || !L.value) return;

        const visiblePlaces = placesToShow.value;

        if (!visiblePlaces || visiblePlaces.length === 0) return;

        // Create a bounds group to adjust zoom
        const bounds = L.value.latLngBounds();

        // Add each place to the bounds group
        visiblePlaces.forEach(place => {
            if (place.latitud && place.longitud) {
                bounds.extend([place.latitud, place.longitud]);
            }
        });

        // Adjust the map to the bounds with some padding
        if (bounds.isValid()) {
            map.value.fitBounds(bounds, { padding: [50, 50] });
        }
    } catch (err) {
        console.error('Error fitting map to places:', err);
    }
};

// Load Leaflet safely
const loadLeaflet = async () => {
    try {
        // Import Leaflet dynamically to avoid SSR problems
        const leaflet = await import('leaflet');
        L.value = leaflet.default || leaflet;
        console.log('Leaflet loaded correctly');
        return true;
    } catch (err) {
        console.error('Error loading Leaflet:', err);
        error.value = 'Error loading map library: ' + err.message;
        return false;
    }
};

// Initialize the map
const initMap = async (lat, lng) => {
    try {
        // Make sure the map container is rendered
        await nextTick();

        if (!mapContainer.value) {
            console.error('Map container is not available');
            return;
        }

        // Make sure Leaflet is loaded
        if (!L.value) {
            const loaded = await loadLeaflet();
            if (!loaded) return;
        }

        // Check that the container has dimensions
        const containerWidth = mapContainer.value.offsetWidth;
        const containerHeight = mapContainer.value.offsetHeight;

        if (containerWidth === 0 || containerHeight === 0) {
            console.error('Map container has zero dimensions');
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait a bit more
        }

        // Create the map if it doesn't exist
        if (!map.value) {
            try {
                // Clean any previous instance
                if (mapContainer.value._leaflet_id) {
                    console.log('Cleaning previous map instance');
                    mapContainer.value._leaflet_id = null;
                }

                // Create the map with a more attractive style
                map.value = L.value.map(mapContainer.value, {
                    zoomControl: false, // Disable default zoom control to add a custom one
                    attributionControl: false // Disable default attribution to add a custom one
                });

                // Set the view after creating the map
                map.value.setView([lat, lng], 13);

                // Add base map layer with a more attractive style
                L.value.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    maxZoom: 19
                }).addTo(map.value);

                // Add zoom controls in a more aesthetic position
                L.value.control.zoom({
                    position: 'bottomright'
                }).addTo(map.value);

                // Add attribution in a more aesthetic position
                L.value.control.attribution({
                    position: 'bottomleft'
                }).addTo(map.value);

                // Initialize markers group
                markersGroup.value = L.value.layerGroup().addTo(map.value);

                // Invalidate map size to force redraw
                setTimeout(() => {
                    if (map.value) {
                        map.value.invalidateSize();
                    }
                }, 100);

                // Mark the map as initialized
                mapInitialized.value = true;
                console.log('Map initialized correctly');
            } catch (err) {
                console.error('Error initializing map:', err);
                error.value = 'Error initializing map: ' + err.message;
            }
        } else {
            // If the map already exists, update the view
            try {
                map.value.setView([lat, lng], 13);
                map.value.invalidateSize();
            } catch (err) {
                console.error('Error updating map view:', err);
            }
        }
    } catch (err) {
        console.error('General error in initMap:', err);
        error.value = 'Error initializing map: ' + err.message;
    }
};

// Check location permission status
const checkLocationPermission = async () => {
    try {
        if (!navigator.permissions || !navigator.permissions.query) {
            // If the permissions API is not available, assume we can request
            return 'prompt';
        }

        try {
            const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
            locationPermissionStatus.value = permissionStatus.state;

            // Listen for changes in permission state
            permissionStatus.onchange = () => {
                locationPermissionStatus.value = permissionStatus.state;
                console.log('Location permission state changed to:', permissionStatus.state);
            };

            return permissionStatus.state;
        } catch (err) {
            console.error('Error checking location permission:', err);
            return 'prompt'; // Assume we can request if there's an error
        }
    } catch (err) {
        console.error('General error in checkLocationPermission:', err);
        return 'prompt';
    }
};

// Retry getting location
const retryGetLocation = () => {
    try {
        // Always try to get location again, even if permission was denied
        getUserLocation();
    } catch (err) {
        console.error('Error in retryGetLocation:', err);
        error.value = 'Error retrying to get location: ' + err.message;
    }
};

// Get user location
const getUserLocation = async () => {
    try {
        isLoading.value = true;
        error.value = null;

        // Check location permission status
        const permissionState = await checkLocationPermission();
        console.log('Location permission status:', permissionState);

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const { latitude, longitude } = position.coords;
                        userLocation.value = { lat: latitude, lng: longitude };
                        locationPermissionStatus.value = 'granted';

                        // Initialize the map with user location
                        await initMap(latitude, longitude);

                        // Add marker for user location if map is initialized
                        if (mapInitialized.value && map.value && L.value) {
                            try {
                                const userMarker = L.value.marker([latitude, longitude], {
                                    icon: L.value.divIcon({
                                        className: 'user-location-marker',
                                        html: '<div class="user-marker-inner"><div class="pulse"></div></div>',
                                        iconSize: [24, 24]
                                    })
                                }).addTo(map.value);

                                userMarker.bindPopup('<div class="custom-popup"><strong>Your current location</strong></div>').openPopup();
                            } catch (err) {
                                console.error('Error adding user marker:', err);
                            }
                        }

                        // Load all places
                        try {
                            // Load all places first (needed for country filtering)
                            allPlaces.value = await getTodosLosLugares();
                            console.log(`Loaded ${allPlaces.value ? allPlaces.value.length : 0} places in total`);

                            // Then get nearby places
                            places.value = await getLugaresCercanos(latitude, longitude, radiusKm.value);
                            console.log(`Loaded ${places.value ? places.value.length : 0} nearby places`);

                            // Set view mode to nearby
                            setViewMode('nearby');

                            // Show places on the map if initialized
                            if (mapInitialized.value) {
                                addPlacesToMap();
                            }
                        } catch (err) {
                            console.error('Error getting places:', err);
                            error.value = 'Could not load places: ' + err.message;
                        }
                    } catch (err) {
                        console.error('Error processing user position:', err);
                        error.value = 'Error processing your location: ' + err.message;
                    } finally {
                        isLoading.value = false;
                    }
                },
                (err) => {
                    console.error('Error getting location:', err);

                    // Update permission state if denied
                    if (err.code === 1) { // PERMISSION_DENIED
                        locationPermissionStatus.value = 'denied';
                        error.value = 'Location access denied. To see nearby places, you must allow access to your location. Click "Retry" to try again.';
                    } else {
                        error.value = 'Could not access your location: ' + err.message;
                    }

                    isLoading.value = false;

                    // If location is denied, switch to country view
                    loadAllPlacesForCountryView();
                }
            );
        } else {
            error.value = 'Your browser does not support geolocation';
            isLoading.value = false;

            // If geolocation is not supported, switch to country view
            loadAllPlacesForCountryView();
        }
    } catch (err) {
        console.error('General error in getUserLocation:', err);
        error.value = 'Error getting your location: ' + err.message;
        isLoading.value = false;
        loadAllPlacesForCountryView();
    }
};

// Load all places for country view
const loadAllPlacesForCountryView = async () => {
    try {
        isLoading.value = true;

        // Initialize the map with a default location (Madrid)
        await initMap(40.416775, -3.703790);

        // Load all places for country filtering
        allPlaces.value = await getTodosLosLugares();
        console.log(`Loaded ${allPlaces.value ? allPlaces.value.length : 0} places in total for country view`);

        // Set view mode to country
        setViewMode('country');

        // If there are countries, select the first one by default
        if (countries.value && countries.value.length > 0) {
            selectedCountry.value = countries.value[0].id_pais;
            console.log(`Auto-selected country: ${countries.value[0].nombre}`);
        }

        // Show places on the map if initialized
        if (mapInitialized.value) {
            addPlacesToMap();
        }
    } catch (err) {
        console.error('Error loading places for country view:', err);
        error.value = 'Could not load places: ' + err.message;
    } finally {
        isLoading.value = false;
    }
};

// Add places to the map
const addPlacesToMap = () => {
    try {
        if (!mapInitialized.value || !map.value || !L.value) {
            console.error('Cannot add places because the map is not initialized');
            return;
        }

        // Clear previous markers
        if (markersGroup.value) {
            markersGroup.value.clearLayers();
        }

        const visiblePlaces = placesToShow.value;

        if (!visiblePlaces || visiblePlaces.length === 0) {
            console.log('No places to show on the map');
            return;
        }

        console.log(`Adding ${visiblePlaces.length} places to the map`);

        try {
            // Add markers for each place
            visiblePlaces.forEach(place => {
                if (!place.latitud || !place.longitud) return;

                const { latitud, longitud, nombre, ciudad, pais, distancia, valoracion, imagen1 } = place;

                try {
                    // Create marker with custom icon
                    const marker = L.value.marker([latitud, longitud], {
                        icon: L.value.divIcon({
                            className: 'place-marker',
                            html: `<div class="place-marker-inner" style="background-color: var(--color-primary);"></div>`,
                            iconSize: [18, 18]
                        })
                    }).addTo(markersGroup.value);

                    // Create popup content with image
                    const popupContent = `
                    <div class="custom-popup">
                        <div class="popup-image" style="background-image: url('${imagen1 || '/placeholder.svg?height=100&width=200&query=travel destination'}')"></div>
                        <div class="popup-content">
                            <h3>${nombre}</h3>
                            <p class="popup-location"><i class="bi bi-geo-alt-fill"></i> ${ciudad}, ${pais}</p>
                            ${distancia ? `<p class="popup-distance"><i class="bi bi-arrow-right-circle-fill"></i> ${distancia.toFixed(2)} km</p>` : ''}
                            ${valoracion ? `
                                <div class="popup-rating">
                                    ${Array(5).fill().map((_, i) => `<i class="bi ${i < Math.round(valoracion) ? 'bi-star-fill' : 'bi-star'}"></i>`).join('')}
                                    <span>${valoracion.toFixed(1)}</span>
                                </div>
                            ` : ''}
                            <a href="/pais/${pais}/${ciudad}/${nombre}" class="popup-link">View details</a>
                        </div>
                    </div>
                    `;

                    // Add popup to marker
                    marker.bindPopup(popupContent, {
                        className: 'custom-popup-container',
                        maxWidth: 300
                    });
                } catch (err) {
                    console.error('Error adding marker for place:', place, err);
                }
            });
        } catch (err) {
            console.error('Error adding places to map:', err);
        }
    } catch (err) {
        console.error('General error in addPlacesToMap:', err);
    }
};

// Change search radius
const changeRadius = async () => {
    try {
        if (!userLocation.value) return;

        isLoading.value = true;
        try {
            places.value = await getLugaresCercanos(
                userLocation.value.lat,
                userLocation.value.lng,
                radiusKm.value
            );
            console.log(`Loaded ${places.value ? places.value.length : 0} nearby places after changing radius`);

            // Update markers if map is initialized and in nearby mode
            if (mapInitialized.value && viewMode.value === 'nearby') {
                addPlacesToMap();
            }
        } catch (err) {
            console.error('Error getting nearby places:', err);
            error.value = 'Could not load nearby places: ' + err.message;
        } finally {
            isLoading.value = false;
        }
    } catch (err) {
        console.error('General error in changeRadius:', err);
        isLoading.value = false;
    }
};

// View place details
const viewPlaceDetails = (place) => {
    try {
        router.push({
            name: 'Destino',
            params: {
                nombrePais: place.pais,
                nombreCiudad: place.ciudad,
                nombreDestino: place.nombre
            }
        });
    } catch (err) {
        console.error('Error in viewPlaceDetails:', err);
    }
};

// Watch for changes in radius
watch(radiusKm, () => {
    try {
        if (viewMode.value === 'nearby') {
            changeRadius();
        }
    } catch (err) {
        console.error('Error in watch of radiusKm:', err);
    }
});

// Clean up resources when component is unmounted
const cleanupMap = () => {
    try {
        if (map.value) {
            console.log('Cleaning up map...');
            map.value.remove();
            map.value = null;
            mapInitialized.value = false;
        }

        // Remove resize listener
        if (typeof window !== 'undefined') {
            window.removeEventListener('resize', checkIfMobile);
        }
    } catch (err) {
        console.error('Error in cleanupMap:', err);
    }
};

// Modify onMounted to load countries and check if mobile
onMounted(async () => {
    try {
        // Check if mobile
        checkIfMobile();

        // Add listener for resize event
        if (typeof window !== 'undefined') {
            window.addEventListener('resize', checkIfMobile);
        }

        // Wait for DOM to be ready
        await nextTick();

        // Load Leaflet
        await loadLeaflet();

        // Load countries
        await loadCountries();

        // Check location permission status
        await checkLocationPermission();

        // Get user location
        getUserLocation();
    } catch (err) {
        console.error('Error in onMounted:', err);
        error.value = 'Error initializing map: ' + err.message;
    }
});

// Clean up resources when unmounting
onUnmounted(() => {
    cleanupMap();
});
</script>

<template>
    <div class="map-view">
        <!-- Hero section -->
        <div class="hero-section">
            <div class="container">
                <h1 class="hero-title">Explore the world around you</h1>
                <p class="hero-subtitle">Discover amazing places near you or by country</p>
            </div>
        </div>

        <div class="container py-4">
            <!-- Map container -->
            <div class="map-container mb-4">
                <!-- Show loading message -->
                <div v-if="isLoading" class="loading-overlay">
                    <div class="spinner">
                        <div class="double-bounce1"></div>
                        <div class="double-bounce2"></div>
                    </div>
                    <p class="mt-3">Loading places...</p>
                </div>

                <!-- Show error message -->
                <div v-if="error" class="error-message">
                    <div class="alert custom-alert" role="alert" v-html="error">
                    </div>
                    <button @click="retryGetLocation" class="btn btn-primary btn-retry">
                        <i class="bi bi-arrow-repeat me-2"></i>Retry
                    </button>

                    <div v-if="locationPermissionStatus === 'denied'" class="mt-3">
                        <button @click="setViewMode('country')" class="btn btn-outline-primary btn-sm w-100">
                            <i class="bi bi-flag-fill me-2"></i>View places by country
                        </button>
                    </div>
                </div>

                <!-- Map container -->
                <div ref="mapContainer" class="leaflet-map"></div>
            </div>

            <!-- View options -->
            <div class="view-options mb-4">
                <div class="row">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-body">
                                <div class="d-flex flex-wrap justify-content-between align-items-center">
                                    <div class="view-tabs">
                                        <button @click="setViewMode('nearby')" class="tab-button"
                                            :class="{ active: viewMode === 'nearby' }" :disabled="!userLocation">
                                            <i class="bi bi-geo-alt-fill"></i> Nearby Places
                                        </button>
                                        <button @click="setViewMode('country')" class="tab-button"
                                            :class="{ active: viewMode === 'country' }">
                                            <i class="bi bi-flag-fill"></i> By Country
                                        </button>
                                    </div>

                                    <div v-if="viewMode === 'nearby'" class="radius-control">
                                        <label for="radius-slider" class="form-label mb-0">Search radius: {{ radiusKm }}
                                            km</label>
                                        <input type="range" class="form-range" id="radius-slider" v-model="radiusKm"
                                            min="5" max="100" step="5">
                                    </div>

                                    <div v-if="viewMode === 'country'" class="country-selector">
                                        <select class="form-select" v-model="selectedCountry"
                                            @change="setViewMode('country', selectedCountry)">
                                            <option :value="null">Select a country</option>
                                            <option v-for="country in countries" :key="country.id_pais"
                                                :value="country.id_pais">
                                                {{ country.nombre }}
                                            </option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Places list -->
            <div class="places-section">
                <div class="section-header mb-4">
                    <h2 class="section-title">
                        <i class="bi" :class="{
                            'bi-geo-alt-fill': viewMode === 'nearby',
                            'bi-flag-fill': viewMode === 'country'
                        }"></i>
                        <span v-if="viewMode === 'nearby'">Places near you</span>
                        <span v-else-if="viewMode === 'country' && selectedCountry">
                            Places in {{countries.find(c => c.id_pais === selectedCountry)?.nombre || 'Selected Country' }}
                        </span>
                        <span v-else>Select a country</span>
                    </h2>
                    <div class="places-counter">{{ placesToShow.length }} places</div>
                </div>

                <div v-if="placesToShow.length > 0" class="row g-4">
                    <div v-for="place in placesToShow" :key="place.id_lugar" class="col-md-6 col-lg-4">
                        <div class="place-card" @click="viewPlaceDetails(place)">
                            <div class="place-image"
                                :style="{ backgroundImage: `url('${place.imagen1 || '/placeholder.svg?height=200&width=300&query=travel destination'}')` }">
                                <div class="place-badges">
                                    <span v-if="place.distancia" class="badge distance-badge">
                                        <i class="bi bi-geo-alt-fill"></i> {{ place.distancia.toFixed(1) }} km
                                    </span>
                                    <span v-if="place.precio > 0" class="badge price-badge">
                                        {{ place.precio }}€
                                    </span>
                                    <span v-else-if="place.precio === 0" class="badge free-badge">
                                        Free
                                    </span>
                                </div>
                            </div>
                            <div class="place-content">
                                <h3 class="place-title">{{ place.nombre }}</h3>
                                <p class="place-location">
                                    <i class="bi bi-geo-alt"></i> {{ place.ciudad }}, {{ place.pais }}
                                </p>

                                <div v-if="place.valoracion" class="place-rating">
                                    <div class="stars">
                                        <i v-for="i in 5" :key="i" class="bi"
                                            :class="i <= Math.round(place.valoracion) ? 'bi-star-fill' : 'bi-star'"></i>
                                    </div>
                                    <span class="rating-value">{{ place.valoracion.toFixed(1) }}</span>
                                </div>

                                <button class="btn btn-primary place-btn">View details</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-else-if="!isLoading && !error" class="alert custom-alert text-center p-4 mt-4">
                    <i class="bi bi-info-circle-fill me-2"></i>
                    <span v-if="viewMode === 'nearby'">No places found near your location. Try increasing the search
                        radius.</span>
                    <span v-else-if="viewMode === 'country' && selectedCountry">No places found in the selected
                        country.</span>
                    <span v-else>Please select a country to view places.</span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* General styles */
.map-view {
    background-color: var(--color-background);
    min-height: 100vh;
}

/* Hero section */
.hero-section {
    background: linear-gradient(135deg, #3a506b 0%, #0f2557 100%);
    color: white;
    padding: 3rem 0;
    text-align: center;
    margin-bottom: 2rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.hero-title {
    font-size: 2.5rem;
    font-weight: 800;
    margin-bottom: 1rem;
    color: white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.hero-subtitle {
    font-size: 1.2rem;
    opacity: 0.9;
    max-width: 600px;
    margin: 0 auto;
}

/* Map container */
.map-container {
    position: relative;
    height: 400px;
    width: 100%;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.leaflet-map {
    height: 100%;
    width: 100%;
}

/* View options */
.view-options .card {
    border: none;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.view-tabs {
    display: flex;
    background-color: #f8f9fa;
    border-radius: 50px;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.tab-button {
    border: none;
    background: none;
    padding: 0.7rem 1.5rem;
    font-weight: 600;
    color: #6c757d;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    flex: 1;
    justify-content: center;
}

.tab-button.active {
    background-color: #3a506b;
    color: white;
}

.tab-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.tab-button i {
    margin-right: 8px;
}

.radius-control {
    width: 250px;
}

.country-selector {
    width: 250px;
}

.form-select {
    border-radius: 50px;
    border: 1px solid #e2e8f0;
    padding: 0.6rem 1.2rem;
    font-weight: 500;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

/* Places section */
.places-section {
    padding: 1rem 0;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.section-title {
    font-size: 1.8rem;
    font-weight: 700;
    color: #3a506b;
    margin: 0;
    display: flex;
    align-items: center;
}

.section-title i {
    margin-right: 12px;
    font-size: 1.6rem;
}

.places-counter {
    background-color: #3a506b;
    color: white;
    padding: 0.4rem 1rem;
    border-radius: 50px;
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Place card */
.place-card {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
    background-color: white;
    transition: transform 0.3s, box-shadow 0.3s;
    cursor: pointer;
    height: 100%;
}

.place-card:hover {
    transform: translateY(-10px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.place-image {
    height: 200px;
    background-size: cover;
    background-position: center;
    position: relative;
    transition: all 0.5s ease;
}

.place-card:hover .place-image {
    transform: scale(1.05);
}

.place-badges {
    position: absolute;
    top: 15px;
    right: 15px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    align-items: flex-end;
}

.badge {
    padding: 0.4rem 0.8rem;
    border-radius: 50px;
    font-weight: 600;
    font-size: 0.85rem;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.distance-badge {
    background-color: #3a506b;
    color: white;
}

.price-badge {
    background-color: #ff6b6b;
    color: white;
}

.free-badge {
    background-color: #38b000;
    color: white;
}

.place-content {
    padding: 1.5rem;
}

.place-title {
    font-size: 1.3rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    color: #3a506b;
    transition: color 0.3s ease;
}

.place-card:hover .place-title {
    color: #ff6b6b;
}

.place-location {
    color: #6c757d;
    margin-bottom: 1rem;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
}

.place-location i {
    margin-right: 8px;
    color: #3a506b;
}

.place-rating {
    display: flex;
    align-items: center;
    margin-bottom: 1.2rem;
}

.stars {
    display: flex;
    margin-right: 8px;
}

.stars i {
    color: #ffc107;
    font-size: 1rem;
}

.rating-value {
    font-weight: 600;
    color: #495057;
    background-color: #f8f9fa;
    padding: 0.2rem 0.5rem;
    border-radius: 50px;
}

.place-btn {
    width: 100%;
    border-radius: 50px;
    padding: 0.7rem;
    font-weight: 600;
    transition: all 0.3s;
    background-color: #3a506b;
    border: none;
}

.place-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    background-color: #ff6b6b;
}

/* Loading overlay */
.loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.9);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(5px);
}

.spinner {
    width: 60px;
    height: 60px;
    position: relative;
}

.double-bounce1,
.double-bounce2 {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: #3a506b;
    opacity: 0.6;
    position: absolute;
    top: 0;
    left: 0;
    animation: sk-bounce 2.0s infinite ease-in-out;
}

.double-bounce2 {
    animation-delay: -1.0s;
}

@keyframes sk-bounce {

    0%,
    100% {
        transform: scale(0.0);
    }

    50% {
        transform: scale(1.0);
    }
}

.loading-overlay p {
    margin-top: 1.5rem;
    color: #3a506b;
    font-weight: 600;
}

/* Error message */
.error-message {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: white;
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
    text-align: center;
    z-index: 1000;
    width: 90%;
    max-width: 450px;
}

.custom-alert {
    background-color: #fff3f3;
    border-left: 4px solid #dc3545;
    color: #dc3545;
    text-align: left;
    border-radius: 10px;
}

.btn-retry {
    margin-top: 1rem;
    border-radius: 50px;
    padding: 0.6rem 1.5rem;
    font-weight: 600;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
}

.btn-retry:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    background-color: #ff6b6b;
}

/* Custom popup styles */
:global(.custom-popup-container) {
    padding: 0;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    border: none;
}

:global(.custom-popup) {
    padding: 0;
    width: 100%;
}

:global(.popup-image) {
    height: 150px;
    background-size: cover;
    background-position: center;
}

:global(.popup-content) {
    padding: 1.5rem;
}

:global(.popup-content h3) {
    margin: 0 0 0.8rem;
    color: #3a506b;
    font-size: 1.2rem;
    font-weight: 700;
}

:global(.popup-location) {
    font-size: 1rem;
    color: #6c757d;
    margin-bottom: 0.8rem;
    display: flex;
    align-items: center;
}

:global(.popup-location i) {
    margin-right: 8px;
    color: #3a506b;
}

:global(.popup-distance) {
    font-size: 1rem;
    color: #3a506b;
    font-weight: 600;
    margin-bottom: 0.8rem;
    display: flex;
    align-items: center;
}

:global(.popup-distance i) {
    margin-right: 8px;
}

:global(.popup-rating) {
    display: flex;
    align-items: center;
    margin-bottom: 1.2rem;
}

:global(.popup-rating i) {
    color: #ffc107;
    font-size: 1rem;
    margin-right: 2px;
}

:global(.popup-rating span) {
    margin-left: 8px;
    font-weight: 700;
    color: #495057;
    background-color: #f8f9fa;
    padding: 0.2rem 0.6rem;
    border-radius: 50px;
}

:global(.popup-link) {
    display: inline-block;
    padding: 0.6rem 1.5rem;
    background-color: #3a506b;
    color: white;
    text-decoration: none;
    border-radius: 50px;
    font-size: 1rem;
    font-weight: 600;
    transition: all 0.3s;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

:global(.popup-link:hover) {
    background-color: #ff6b6b;
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

/* User location marker */
:global(.user-location-marker) {
    border-radius: 50%;
    border: none;
}

:global(.user-marker-inner) {
    width: 24px;
    height: 24px;
    background-color: #3a506b;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 0 0 2px #3a506b;
    position: relative;
}

:global(.pulse) {
    position: absolute;
    top: -10px;
    left: -10px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: rgba(58, 80, 107, 0.3);
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% {
        transform: scale(0.5);
        opacity: 1;
    }

    100% {
        transform: scale(1.5);
        opacity: 0;
    }
}

/* Place marker */
:global(.place-marker) {
    border-radius: 50%;
    border: none;
}

:global(.place-marker-inner) {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 0 0 2px #3a506b;
    transition: transform 0.3s;
}

:global(.place-marker-inner:hover) {
    transform: scale(1.2);
}

/* Media queries */
@media (max-width: 768px) {
    .hero-title {
        font-size: 2rem;
    }

    .hero-subtitle {
        font-size: 1.1rem;
    }

    .map-container {
        height: 350px;
    }

    .view-tabs {
        width: 100%;
        margin-bottom: 1rem;
    }

    .tab-button {
        padding: 0.6rem 1rem;
        font-size: 0.9rem;
    }

    .radius-control,
    .country-selector {
        width: 100%;
    }

    .section-title {
        font-size: 1.5rem;
    }

    .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }
}

@media (max-width: 576px) {
    .hero-title {
        font-size: 1.8rem;
    }

    .hero-subtitle {
        font-size: 1rem;
    }

    .map-container {
        height: 300px;
    }

    .tab-button {
        padding: 0.5rem 0.8rem;
        font-size: 0.8rem;
    }

    .tab-button i {
        margin-right: 4px;
    }

    .place-image {
        height: 180px;
    }
}
</style>
