<script setup>
import { ref, computed } from 'vue';
import FavoriteButton from '@/components/FavoriteButton.vue';
import AuthModal from '@/components/AuthModal.vue';

const props = defineProps({
    nombrePais: {
        type: String,
        required: true
    },
    nombreCiudad: {
        type: String,
        required: true
    },
    lugares: {
        type: Array,
        required: true
    }
});

const showModal = ref(false);

// Check if there are places and if they have all the necessary properties
const lugaresValidos = computed(() => {
    return props.lugares.filter(lugar =>
        lugar &&
        typeof lugar === 'object' &&
        lugar.nombre &&
        lugar.id_lugar
    );
});

// Function to get a safe image URL
function getImageUrl(lugar) {
    if (!lugar) return '/placeholder.jpg';
    return lugar.imagen1 || '/placeholder.jpg';
}

// Prepare place info for the favorites component
function getLugarInfo(lugar) {
    return {
        nombre: lugar.nombre,
        nombreCiudad: props.nombreCiudad,
        nombrePais: props.nombrePais,
        precio: lugar.precio,
        valoracion: lugar.valoracion,
        imagen1: lugar.imagen1
    };
}

// Handle favorite toggle
function handleFavoriteToggle(isFavorite, lugar) {
    const action = isFavorite ? 'added to' : 'removed from';
    showNotification(`${lugar.nombre} ${action} favorites`);
}

// Show login modal
function showLoginModal() {
    showModal.value = true;
}

// Handle successful login
function handleLoginSuccess() {
    showModal.value = false;
    showNotification('You can now add places to your favorites!');
}

// Show notification
function showNotification(message) {
    // Create notification element with Bootstrap classes
    const notification = document.createElement('div');
    notification.className = 'toast position-fixed top-0 end-0 m-3 show';
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'assertive');
    notification.setAttribute('aria-atomic', 'true');
    notification.style.zIndex = '1100';

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
</script>

<template>
    <div class="">
        <div v-if="!lugares || lugares.length === 0" class="text-center p-4 bg-light rounded">
            <p class="text-muted mb-0">No places available for this city.</p>
        </div>

        <div v-else class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
            <div v-for="lugar in lugaresValidos" :key="lugar.id_lugar" class="col">
                <div class="card h-100 shadow-sm destino-card">
                    <div class="position-relative">
                        <img :src="getImageUrl(lugar)" :alt="lugar.nombre" class="card-img-top destino-imagen">

                        <!-- Favorite button -->
                        <FavoriteButton :lugar-id="lugar.id_lugar" :lugar-info="getLugarInfo(lugar)"
                            @toggle="(isFavorite) => handleFavoriteToggle(isFavorite, lugar)"
                            @login-required="showLoginModal" />

                        <!-- Price tag -->
                        <div class="price-tag">
                            <span v-if="lugar.precio === 0">Free</span>
                            <span v-else>{{ lugar.precio }}€</span>
                        </div>
                    </div>

                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title fw-bold">{{ lugar.nombre }}</h5>

                        <!-- Rating with stars -->
                        <div class="rating mb-2" v-if="lugar.valoracion">
                            <div class="stars">
                                <template v-for="n in 5" :key="n">
                                    <i class="bi"
                                        :class="n <= Math.round(lugar.valoracion) ? 'bi-star-fill' : 'bi-star'"></i>
                                </template>
                            </div>
                            <span class="rating-value">{{ lugar.valoracion }}</span>
                        </div>

                        <!-- Location -->
                        <p class="card-text location">
                            <i class="bi bi-geo-alt"></i> {{ nombreCiudad }}, {{ nombrePais }}
                        </p>

                        <router-link :to="{
                            name: 'Destino',
                            params: {
                                nombrePais: nombrePais,
                                nombreCiudad: nombreCiudad,
                                nombreDestino: lugar.nombre
                            }
                        }" class="btn btn-primary mt-auto ver-mas-btn">
                            View details
                        </router-link>
                    </div>
                </div>
            </div>
        </div>

        <!-- Login Modal -->
        <AuthModal :visible="showModal" @close="showModal = false" @login-success="handleLoginSuccess" />
    </div>
</template>

<style scoped>
/* Enhanced styles for destination cards */
.destino-card {
    transition: transform 0.3s, box-shadow 0.3s;
    background-color: var(--color-backgroundCard, white);
    border: none;
    border-radius: 12px;
    overflow: hidden;
}

.destino-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
}

.destino-imagen {
    height: 200px;
    object-fit: cover;
    transition: transform 0.5s ease;
}

.destino-card:hover .destino-imagen {
    transform: scale(1.05);
}

.card-title {
    color: var(--color-text, #333);
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
    line-height: 1.3;
}

.card-text {
    color: var(--color-text, #333);
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
}

.ver-mas-btn {
    background-color: var(--color-primary, #3a506b);
    border-color: var(--color-primary, #3a506b);
    border-radius: 30px;
    padding: 0.5rem 1.25rem;
    font-weight: 500;
    transition: all 0.3s ease;
}

.ver-mas-btn:hover {
    background-color: var(--color-accent, #ff6b6b);
    border-color: var(--color-accent, #ff6b6b);
    transform: translateY(-2px);
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
    font-size: 0.85rem;
    color: #6c757d;
    margin-bottom: 1rem;
}

.location i {
    margin-right: 0.25rem;
    font-size: 0.8rem;
}

/* Media queries to adjust image height on smaller screens */
@media (max-width: 1024px) {
    .destino-imagen {
        height: 160px;
    }

    .card-title {
        font-size: 1.1rem;
    }

    .card-text {
        font-size: 0.85rem;
    }
}

@media (max-width: 768px) {
    .destino-imagen {
        height: 140px;
    }

    .card-title {
        font-size: 1rem;
    }

    .card-text {
        font-size: 0.8rem;
    }

    .price-tag {
        font-size: 0.75rem;
        padding: 0.2rem 0.6rem;
    }
}
</style>