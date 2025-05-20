<script setup>
import { defineProps, onMounted, ref } from 'vue';
import { getCiudadPorLugarId } from '@/composables/useDatabase';
import FavoriteButton from '@/components/FavoriteButton.vue';
import AuthModal from '@/components/AuthModal.vue';
// Actualizar las importaciones para incluir el botón de visitado y el modal de detalles
import VisitedButton from '@/components/VisitedButton.vue';
import VisitDetailsModal from '@/components/VisitDetailsModal.vue';

const props = defineProps({
    destino: {
        type: Object,
        required: true
    },
    nombrePais: {
        type: String,
        required: true
    },
    nombreCiudad: {
        type: String,
        required: true
    }
});

const nombreCiudad = ref('');
const showModal = ref(false);
// Añadir nuevas variables reactivas para el modal de detalles de visita
const showVisitDetailsModal = ref(false);

// When mounted, get the city name from the database
onMounted(async () => {
    // Solo obtener la ciudad si no se proporciona como prop
    if (!nombreCiudad.value) {
        nombreCiudad.value = await getCiudadPorLugarId(props.destino.id_lugar);
    }
});

// Prepare place info for the favorites component
const lugarInfo = {
    nombre: props.destino.nombre,
    nombreCiudad: nombreCiudad.value,
    nombrePais: props.nombrePais,
    precio: props.destino.precio,
    valoracion: props.destino.valoracion,
    imagen1: props.destino.imagen1
};

// Handle favorite toggle
const handleFavoriteToggle = (isFavorite) => {
    const action = isFavorite ? 'added to' : 'removed from';
    showNotification(`${props.destino.nombre} ${action} favorites`);
};

// Show login modal
const showLoginModal = () => {
    showModal.value = true;
};

// Handle successful login
const handleLoginSuccess = () => {
    showModal.value = false;
    showNotification('You can now add places to your favorites!');
};

// Show notification
const showNotification = (message) => {
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
};

// Añadir función para mostrar el modal de detalles de visita
const showVisitDetails = () => {
    showVisitDetailsModal.value = true;
};

// Añadir función para manejar cuando se guarda una visita
const handleVisitSaved = (data) => {
    showVisitDetailsModal.value = false;
    showNotification(`${props.destino.nombre} marked as visited on ${new Date(data.fecha).toLocaleDateString()}`);
};

// Añadir la función handleVisitToggle en el script
// Handle visit toggle
const handleVisitToggle = (isVisited) => {
    const action = isVisited ? 'marked as visited' : 'removed from visited places';
    showNotification(`${props.destino.nombre} ${action}`);
};
</script>

<template>
    <div class="card h-100 shadow-sm destino-card">
        <div class="position-relative">
            <img v-if="destino.imagen1" :src="destino.imagen1" :alt="destino.nombre"
                class="card-img-top destino-imagen">
            <img v-else src="../assets/img/logo.png" :alt="destino.nombre" class="card-img-top destino-imagen">

            <!-- Favorite button -->
            <FavoriteButton :lugar-id="destino.id_lugar" :lugar-info="lugarInfo" @toggle="handleFavoriteToggle"
                @login-required="showLoginModal" />

            <!-- Visited button -->
            <VisitedButton :lugar-id="destino.id_lugar" :lugar-info="lugarInfo" @toggle="handleVisitToggle"
                @login-required="showLoginModal" @show-details="showVisitDetails" />

            <!-- Price tag -->
            <div class="price-tag">
                <span v-if="destino.precio === 0">Free</span>
                <span v-else>{{ destino.precio }}€</span>
            </div>
        </div>

        <div class="card-body d-flex flex-column">
            <h5 class="card-title fw-bold">{{ destino.nombre }}</h5>

            <!-- Rating with stars -->
            <div class="rating mb-2">
                <div class="stars">
                    <template v-for="n in 5" :key="n">
                        <i class="bi" :class="n <= Math.round(destino.valoracion) ? 'bi-star-fill' : 'bi-star'"></i>
                    </template>
                </div>
                <span class="rating-value">{{ destino.valoracion }}</span>
            </div>

            <!-- Location -->
            <p class="card-text location" v-if="nombreCiudad">
                <i class="bi bi-geo-alt"></i> {{ nombreCiudad }}, {{ nombrePais }}
            </p>

            <!-- Only show the link when we have the city -->
            <router-link v-if="nombreCiudad" :to="{
                name: 'Destino',
                params: {
                    nombrePais,
                    nombreCiudad,
                    nombreDestino: destino.nombre
                }
            }" class="btn btn-primary mt-auto ver-mas-btn">
                View details
            </router-link>
        </div>
    </div>

    <!-- Login Modal -->
    <AuthModal :visible="showModal" @close="showModal = false" @login-success="handleLoginSuccess" />

    <!-- Visit details modal -->
    <VisitDetailsModal :visible="showVisitDetailsModal" :lugar-id="destino.id_lugar" :existing-data="{}"
        @close="showVisitDetailsModal = false" @saved="handleVisitSaved" @login-required="showLoginModal" />
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
