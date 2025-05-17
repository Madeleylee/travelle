<script setup>
import { ref, onMounted, watch } from 'vue';
import { useAuth } from '@/composables/useAuth';

const props = defineProps({
    lugarId: {
        type: [String, Number],
        required: true
    },
    lugarInfo: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['toggle', 'login-required']);

const { isUserAuthenticated } = useAuth();
const isFavorite = ref(false);

// Verificar si el lugar está en favoritos
const checkIfFavorite = () => {
    try {
        const favoritos = JSON.parse(localStorage.getItem('favoritos') || '[]');
        return favoritos.some(fav => String(fav.id) === String(props.lugarId));
    } catch (error) {
        console.error('Error al verificar favorito:', error);
        return false;
    }
};

// Inicializar estado
const initializeFavoriteStatus = () => {
    isFavorite.value = checkIfFavorite();
};

initializeFavoriteStatus();

// Observar cambios en el ID del lugar
watch(() => props.lugarId, () => {
    initializeFavoriteStatus();
});

// Toggle favorite state
const toggleFavorite = () => {
    // If user is not authenticated, show login modal
    if (!isUserAuthenticated()) {
        emit('login-required');
        return;
    }

    try {
        let favoritos = JSON.parse(localStorage.getItem('favoritos') || '[]');
        const index = favoritos.findIndex(fav => String(fav.id) === String(props.lugarId));

        if (index >= 0) {
            // Si ya es favorito, eliminarlo
            console.log(`Removing place ID ${props.lugarId} from favorites`);
            favoritos.splice(index, 1);
            localStorage.setItem('favoritos', JSON.stringify(favoritos));
            isFavorite.value = false;
            emit('toggle', false);
        } else {
            // Si no es favorito, agregarlo
            const nuevoFavorito = {
                id: props.lugarId,
                lugar: props.lugarInfo.nombre || 'Unnamed place',
                ciudad: props.lugarInfo.nombreCiudad || 'Unknown city',
                pais: props.lugarInfo.nombrePais || 'Unknown country',
                precio: props.lugarInfo.precio || 0,
                valoracion: props.lugarInfo.valoracion || 0,
                imagen1: props.lugarInfo.imagen1 || '/placeholder.jpg',
                fechaAgregado: new Date().toISOString()
            };

            console.log('Adding new favorite:', nuevoFavorito);
            favoritos.push(nuevoFavorito);
            localStorage.setItem('favoritos', JSON.stringify(favoritos));
            isFavorite.value = true;
            emit('toggle', true);
        }

        // Dispatch event so other components are notified
        window.dispatchEvent(new Event('favoritesUpdated'));
    } catch (error) {
        console.error('Error toggling favorite:', error);
    }
};
</script>

<template>
    <button class="favorite-btn" :class="{ 'is-favorite': isFavorite }" @click.stop.prevent="toggleFavorite"
        :aria-label="isFavorite ? 'Remove from favorites' : 'Add to favorites'"
        :title="isFavorite ? 'Remove from favorites' : 'Add to favorites'">
        <i class="bi" :class="isFavorite ? 'bi-heart-fill' : 'bi-heart'"></i>
    </button>
</template>

<style scoped>
.favorite-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(255, 255, 255, 0.9);
    border: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
    z-index: 10;
    padding: 0;
    cursor: pointer;
}

.favorite-btn i {
    font-size: 1.1rem;
    color: #6c757d;
    transition: all 0.3s ease;
}

.favorite-btn:hover {
    transform: scale(1.1);
    background-color: white;
}

.favorite-btn:hover i {
    color: #dc3545;
}

.favorite-btn.is-favorite i {
    color: #dc3545;
}

/* Animation for heart icon */
@keyframes heartBeat {
    0% {
        transform: scale(1);
    }

    14% {
        transform: scale(1.3);
    }

    28% {
        transform: scale(1);
    }

    42% {
        transform: scale(1.3);
    }

    70% {
        transform: scale(1);
    }
}

.favorite-btn.is-favorite i {
    animation: heartBeat 1s;
}
</style>
