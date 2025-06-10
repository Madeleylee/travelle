<script setup>
import { ref, onMounted, watch } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useVisitados } from '@/composables/useVisitados';

const props = defineProps({
    lugarId: {
        type: [String, Number],
        required: true
    },
    lugarInfo: {
        type: Object,
        default: () => ({})
    }
});

const emit = defineEmits(['toggle', 'login-required', 'visit', 'show-details']);

const { isUserAuthenticated } = useAuth();
const { isVisited, toggleVisitedPlace } = useVisitados();
const isVisitedState = ref(false);
const loading = ref(false);

// Verificar si el lugar está marcado como visitado
const checkIfVisited = async () => {
    try {
        isVisitedState.value = await isVisited(props.lugarId);
    } catch (error) {
        isVisitedState.value = false;
    }
};

// Inicializar estado
const initializeVisitedStatus = async () => {
    loading.value = true;
    await checkIfVisited();
    loading.value = false;
};

onMounted(() => {
    initializeVisitedStatus();
});

// Observar cambios en el ID del lugar
watch(() => props.lugarId, () => {
    initializeVisitedStatus();
});

// Toggle visited state
const toggleVisited = async () => {
    // If user is not authenticated, show login modal
    if (!isUserAuthenticated()) {
        emit('login-required');
        return;
    }

    loading.value = true;
    try {
        const result = await toggleVisitedPlace(props.lugarId);

        if (result.success) {
            isVisitedState.value = result.isNowVisited;
            emit('toggle', result.isNowVisited, props.lugarInfo);

            // Si se acaba de marcar como visitado, mostrar modal de detalles
            if (result.isNowVisited) {
                emit('show-details', props.lugarId);
            }
        }
    } catch (error) {
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <button class="visited-btn" :class="{ 'is-visited': isVisitedState }" @click.stop.prevent="toggleVisited"
        :aria-label="isVisitedState ? 'Remove from visited places' : 'Mark as visited'"
        :title="isVisitedState ? 'Remove from visited places' : 'Mark as visited'">
        <div v-if="loading" class="loading-spinner"></div>
        <i v-else class="bi" :class="isVisitedState ? 'bi-check-circle-fill' : 'bi-check-circle'"></i>
    </button>
</template>

<style scoped>
.visited-btn {
    position: absolute;
    top: 10px;
    left: 10px;
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

.visited-btn i {
    font-size: 1.1rem;
    color: #6c757d;
    transition: all 0.3s ease;
}

.visited-btn:hover {
    transform: scale(1.1);
    background-color: white;
}

.visited-btn:hover i {
    color: #28a745;
}

.visited-btn.is-visited i {
    color: #28a745;
}

/* Loading spinner */
.loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(108, 117, 125, 0.3);
    border-radius: 50%;
    border-top-color: #6c757d;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* Animation for check icon */
@keyframes checkBounce {
    0% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.3);
    }

    100% {
        transform: scale(1);
    }
}

.visited-btn.is-visited i {
    animation: checkBounce 0.5s;
}
</style>
