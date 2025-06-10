<template>
    <div v-if="visible" class="visit-modal-overlay" @click="closeModal">
        <div class="visit-modal" @click.stop>
            <div class="visit-modal-header">
                <h4>{{ isEditing ? 'Editar detalles de visita' : 'Añadir detalles de visita' }}</h4>
                <button type="button" class="btn-close" @click="closeModal"></button>
            </div>
            <div class="visit-modal-body">
                <form @submit.prevent="saveVisit">
                    <div class="form-group">
                        <label for="visitDate">Fecha de visita</label>
                        <input type="date" id="visitDate" v-model="visitDate" class="form-control" :max="today"
                            required>
                    </div>
                    <div class="form-group">
                        <label for="visitNotes">Notas (opcional)</label>
                        <textarea id="visitNotes" v-model="visitNotes" class="form-control" rows="4"
                            placeholder="Comparte tu experiencia, consejos o recuerdos sobre este lugar..."></textarea>
                    </div>
                    <div class="visit-modal-actions">
                        <button type="button" class="btn btn-outline-secondary" @click="closeModal">
                            Cancelar
                        </button>
                        <button type="submit" class="btn btn-primary" :disabled="loading">
                            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                            {{ isEditing ? 'Actualizar' : 'Guardar' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useVisitados } from '@/composables/useVisitados';

const props = defineProps({
    visible: Boolean,
    lugarId: [String, Number],
    existingData: Object
});

const emit = defineEmits(['close', 'saved', 'login-required']);

const { addVisitedPlace } = useVisitados();
const visitDate = ref('');
const visitNotes = ref('');
const loading = ref(false);

const today = computed(() => {
    return new Date().toISOString().split('T')[0];
});

const isEditing = computed(() => {
    return props.existingData && Object.keys(props.existingData).length > 0;
});

// Initialize with default date (today) or existing data
watch(() => props.visible, (newValue) => {
    if (newValue) {
        if (props.existingData && props.existingData.fecha_visita) {
            visitDate.value = props.existingData.fecha_visita;
            visitNotes.value = props.existingData.notas || '';
        } else {
            visitDate.value = today.value;
            visitNotes.value = '';
        }
    }
});

// Initialize when component mounts
onMounted(() => {
    if (props.existingData && props.existingData.fecha_visita) {
        visitDate.value = props.existingData.fecha_visita;
        visitNotes.value = props.existingData.notas || '';
    } else {
        visitDate.value = today.value;
    }
});

const closeModal = () => {
    emit('close');
};

const saveVisit = async () => {
    if (!visitDate.value) return;

    loading.value = true;
    try {
        const result = await addVisitedPlace(props.lugarId, visitDate.value, visitNotes.value);

        if (result.success) {
            emit('saved', {
                lugarId: props.lugarId,
                fecha: visitDate.value,
                notas: visitNotes.value
            });
            closeModal();
        } else if (result.requiresAuth) {
            // Handle authentication required
            emit('login-required');
            closeModal();
        }
    } catch (error) {
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
.visit-modal-overlay {
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

.visit-modal {
    background-color: white;
    border-radius: 8px;
    width: 100%;
    max-width: 500px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    animation: modal-appear 0.3s ease-out;
}

.visit-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #e5e7eb;
}

.visit-modal-header h4 {
    margin: 0;
    color: var(--color-primary);
    font-weight: 600;
}

.btn-close {
    background: transparent;
    border: none;
    font-size: 1.5rem;
    line-height: 1;
    color: #6c757d;
    cursor: pointer;
}

.visit-modal-body {
    padding: 1.5rem;
}

.form-group {
    margin-bottom: 1.25rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #4b5563;
}

.form-control {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 1rem;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus {
    border-color: var(--color-primary);
    outline: 0;
    box-shadow: 0 0 0 0.2rem rgba(30, 58, 138, 0.25);
}

.visit-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1.5rem;
}

.btn {
    padding: 0.5rem 1.25rem;
    border-radius: 0.375rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.btn-primary {
    background-color: var(--color-primary);
    border: 1px solid var(--color-primary);
    color: white;
}

.btn-primary:hover {
    background-color: #1e40af;
    border-color: #1e40af;
}

.btn-outline-secondary {
    background-color: transparent;
    border: 1px solid #d1d5db;
    color: #4b5563;
}

.btn-outline-secondary:hover {
    background-color: #f3f4f6;
}

.btn:disabled {
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

@media (max-width: 640px) {
    .visit-modal {
        max-width: 90%;
    }
}
</style>
