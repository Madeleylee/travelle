<script setup>
import { ref, onMounted, watch } from 'vue';
import { useAuth } from '@/composables/useAuth';

// Definimos las propiedades del componente
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

// Definimos los eventos que puede emitir este componente
const emit = defineEmits(['toggle', 'login-required']);

// Usamos el hook de autenticación para verificar si el usuario está logueado
const { isUserAuthenticated } = useAuth();

// Estado local para saber si el lugar es favorito o no
const isFavorite = ref(false);

// Función que verifica si un lugar ya está en la lista de favoritos del localStorage
const checkIfFavorite = () => {
    try {
        const favoritos = JSON.parse(localStorage.getItem('favoritos') || '[]');
        return favoritos.some(fav => String(fav.id) === String(props.lugarId));
    } catch (error) {
        console.error('Error al verificar favorito:', error);
        return false;
    }
};

// Inicializa el estado inicial del botón según si ya es favorito o no
const initializeFavoriteStatus = () => {
    isFavorite.value = checkIfFavorite();
};

initializeFavoriteStatus();

// Observa cambios en el lugarId y actualiza el estado del favorito si cambia
watch(() => props.lugarId, () => {
    initializeFavoriteStatus();
});

// Alterna el estado de favorito (agregar/eliminar)
const toggleFavorite = () => {
    // Si el usuario no está autenticado, emitimos evento para mostrar modal de login
    if (!isUserAuthenticated()) {
        emit('login-required');
        return;
    }

    try {
        let favoritos = JSON.parse(localStorage.getItem('favoritos') || '[]');
        const index = favoritos.findIndex(fav => String(fav.id) === String(props.lugarId));

        if (index >= 0) {
            // Ya es favorito, lo eliminamos
            console.log(`Removing place ID ${props.lugarId} from favorites`);
            favoritos.splice(index, 1);
            localStorage.setItem('favoritos', JSON.stringify(favoritos));
            isFavorite.value = false;
            emit('toggle', false);
        } else {
            // No es favorito, lo agregamos
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

        // Notificamos a otros componentes que los favoritos han cambiado
        window.dispatchEvent(new Event('favoritesUpdated'));
    } catch (error) {
        console.error('Error toggling favorite:', error);
    }
};
</script>

<template>
    <!-- Botón de favorito -->
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
