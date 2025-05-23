<script setup>
import { defineProps, onMounted, ref } from 'vue';
import { getCiudadPorLugarId } from '@/composables/useDatabase';
import FavoriteButton from '@/components/FavoriteButton.vue';
import AuthModal from '@/components/AuthModal.vue';

// Importamos nuevos componentes para lugares visitados y detalles de visita
import VisitedButton from '@/components/VisitedButton.vue';
import VisitDetailsModal from '@/components/VisitDetailsModal.vue';

// Definimos las propiedades del componente
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

// Variables reactivas
const nombreCiudad = ref('');
const showModal = ref(false); // Para el modal de inicio de sesión
const showVisitDetailsModal = ref(false); // Para el modal de detalles de visita

// Al montar el componente, obtenemos el nombre de la ciudad si no viene por props
onMounted(async () => {
    if (!nombreCiudad.value) {
        nombreCiudad.value = await getCiudadPorLugarId(props.destino.id_lugar);
    }
});

// Preparamos la información del lugar para usarla en favoritos y visitados
const lugarInfo = {
    nombre: props.destino.nombre,
    nombreCiudad: nombreCiudad.value,
    nombrePais: props.nombrePais,
    precio: props.destino.precio,
    valoracion: props.destino.valoracion,
    imagen1: props.destino.imagen1
};

// Maneja el evento cuando un lugar se agrega o quita de favoritos
const handleFavoriteToggle = (isFavorite) => {
    const action = isFavorite ? 'added to' : 'removed from';
    showNotification(`${props.destino.nombre} ${action} favorites`);
};

// Muestra el modal de inicio de sesión
const showLoginModal = () => {
    showModal.value = true;
};

// Maneja el éxito al iniciar sesión
const handleLoginSuccess = () => {
    showModal.value = false;
    showNotification('You can now add places to your favorites!');
};

// Muestra una notificación al usuario
const showNotification = (message) => {
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

    // Elimina la notificación después de 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
};

// Muestra el modal de detalles de visita
const showVisitDetails = () => {
    showVisitDetailsModal.value = true;
};

// Maneja cuando se guarda una visita
const handleVisitSaved = (data) => {
    showVisitDetailsModal.value = false;
    showNotification(`${props.destino.nombre} marked as visited on ${new Date(data.fecha).toLocaleDateString()}`);
};

// Maneja el evento cuando un lugar se marca o desmarca como visitado
const handleVisitToggle = (isVisited) => {
    const action = isVisited ? 'marked as visited' : 'removed from visited places';
    showNotification(`${props.destino.nombre} ${action}`);
};
</script>

<template>
    <!-- Tarjeta del destino -->
    <div class="card h-100 shadow-sm destino-card">
        <div class="position-relative">
            <!-- Imagen del destino -->
            <img v-if="destino.imagen1" :src="destino.imagen1" :alt="destino.nombre"
                class="card-img-top destino-imagen">
            <img v-else src="../assets/img/logo.png" :alt="destino.nombre" class="card-img-top destino-imagen">

            <!-- Botón de favorito -->
            <FavoriteButton :lugar-id="destino.id_lugar" :lugar-info="lugarInfo" @toggle="handleFavoriteToggle"
                @login-required="showLoginModal" />

            <!-- Botón de visitado -->
            <VisitedButton :lugar-id="destino.id_lugar" :lugar-info="lugarInfo" @toggle="handleVisitToggle"
                @login-required="showLoginModal" @show-details="showVisitDetails" />

            <!-- Etiqueta de precio -->
            <div class="price-tag">
                <span v-if="destino.precio === 0">Free</span>
                <span v-else>{{ destino.precio }}€</span>
            </div>
        </div>

        <div class="card-body d-flex flex-column">
            <!-- Título del destino -->
            <h5 class="card-title fw-bold">{{ destino.nombre }}</h5>

            <!-- Calificación con estrellas -->
            <div class="rating mb-2">
                <div class="stars">
                    <template v-for="n in 5" :key="n">
                        <i class="bi" :class="n <= Math.round(destino.valoracion) ? 'bi-star-fill' : 'bi-star'"></i>
                    </template>
                </div>
                <span class="rating-value">{{ destino.valoracion }}</span>
            </div>

            <!-- Ubicación del destino -->
            <p class="card-text location" v-if="nombreCiudad">
                <i class="bi bi-geo-alt"></i> {{ nombreCiudad }}, {{ nombrePais }}
            </p>

            <!-- Enlace a detalles del destino -->
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

    <!-- Modal de inicio de sesión -->
    <AuthModal :visible="showModal" @close="showModal = false" @login-success="handleLoginSuccess" />

    <!-- Modal de detalles de visita -->
    <VisitDetailsModal :visible="showVisitDetailsModal" :lugar-id="destino.id_lugar" :existing-data="{}"
        @close="showVisitDetailsModal = false" @saved="handleVisitSaved" @login-required="showLoginModal" />
</template>

<style scoped>
/* Estilos mejorados para las tarjetas de destino */
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

/* Etiqueta de precio */
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

/* Estrellas de calificación */
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

/* Ubicación */
.location {
    font-size: 0.85rem;
    color: #6c757d;
    margin-bottom: 1rem;
}

.location i {
    margin-right: 0.25rem;
    font-size: 0.8rem;
}

/* Media queries para pantallas pequeñas */
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