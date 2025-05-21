<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTripLists } from '@/composables/useTripLists';
import { useAuth } from '@/composables/useAuth';
import AuthModal from '@/components/AuthModal.vue';

const route = useRoute();
const router = useRouter();
const { isUserAuthenticated } = useAuth();
const { obtenerLista, actualizarLista, eliminarLista, agregarItem, actualizarItem, eliminarItem, toggleCompletado, categorias, obtenerCategoria } = useTripLists();

// Estado para el modal de autenticación
const showAuthModal = ref(false);

// ID de la lista actual
const listaId = route.params.id;

// Estado de la lista
const lista = ref(null);
const isLoading = ref(true);
const error = ref(null);

// Estado para el formulario de nuevo elemento
const nuevoItem = ref({
    texto: '',
    categoria: 'otros',
    prioridad: 2
});

// Estado para el modal de edición
const showEditModal = ref(false);
const itemEditando = ref(null);

// Estado para el modal de confirmación de eliminación
const showDeleteModal = ref(false);
const itemEliminando = ref(null);

// Estado para el modal de edición de lista
const showEditListModal = ref(false);
const listaEditando = ref(null);

// Estado para el modal de confirmación de eliminación de lista
const showDeleteListModal = ref(false);

// Cargar la lista
const cargarLista = () => {
    isLoading.value = true;
    error.value = null;

    try {
        const listaEncontrada = obtenerLista(listaId);
        if (listaEncontrada) {
            lista.value = listaEncontrada;
        } else {
            error.value = 'Lista no encontrada';
            router.push({ name: 'TripLists' });
        }
    } catch (err) {
        console.error('Error al cargar la lista:', err);
        error.value = 'No se pudo cargar la lista';
    } finally {
        isLoading.value = false;
    }
};

// Formatear fecha
const formatearFecha = (fecha) => {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

// Calcular días restantes
const diasRestantes = computed(() => {
    if (!lista.value) return '';

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const inicio = new Date(lista.value.fechaInicio);
    inicio.setHours(0, 0, 0, 0);
    const diferencia = inicio - hoy;
    const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));

    if (dias < 0) return 'Viaje pasado';
    if (dias === 0) return '¡Hoy!';
    if (dias === 1) return 'Mañana';
    return `En ${dias} días`;
});

// Calcular porcentaje de completado
const porcentajeCompletado = computed(() => {
    if (!lista.value || !lista.value.items || lista.value.items.length === 0) return 0;

    const completados = lista.value.items.filter(item => item.completado).length;
    return Math.round((completados / lista.value.items.length) * 100);
});

// Verificar si la lista está completa
const listaCompleta = computed(() => {
    return porcentajeCompletado.value === 100 && lista.value?.items.length > 0;
});

// Verificar si el viaje es hoy
const viajeEsHoy = computed(() => {
    if (!lista.value) return false;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const inicio = new Date(lista.value.fechaInicio);
    inicio.setHours(0, 0, 0, 0);

    return inicio.getTime() === hoy.getTime();
});

// Filtrar items por categoría
const itemsPorCategoria = computed(() => {
    if (!lista.value || !lista.value.items) return {};

    const resultado = {};
    categorias.forEach(cat => {
        resultado[cat.id] = lista.value.items.filter(item => item.categoria === cat.id);
    });

    return resultado;
});

// Agregar un nuevo elemento
const agregarNuevoItem = () => {
    if (!nuevoItem.value.texto.trim()) return;

    agregarItem(
        listaId,
        nuevoItem.value.texto,
        nuevoItem.value.categoria,
        parseInt(nuevoItem.value.prioridad)
    );

    // Limpiar el formulario
    nuevoItem.value = {
        texto: '',
        categoria: 'otros',
        prioridad: 2
    };

    // Recargar la lista
    cargarLista();
};

// Abrir modal de edición
const abrirModalEdicion = (item) => {
    itemEditando.value = { ...item };
    showEditModal.value = true;
};

// Guardar cambios de edición
const guardarEdicion = () => {
    if (!itemEditando.value.texto.trim()) return;

    actualizarItem(listaId, itemEditando.value.id, {
        texto: itemEditando.value.texto,
        categoria: itemEditando.value.categoria,
        prioridad: parseInt(itemEditando.value.prioridad)
    });

    showEditModal.value = false;
    itemEditando.value = null;

    // Recargar la lista
    cargarLista();
};

// Abrir modal de confirmación de eliminación
const abrirModalEliminar = (item) => {
    itemEliminando.value = item;
    showDeleteModal.value = true;
};

// Confirmar eliminación
const confirmarEliminar = () => {
    if (!itemEliminando.value) return;

    eliminarItem(listaId, itemEliminando.value.id);
    showDeleteModal.value = false;
    itemEliminando.value = null;

    // Recargar la lista
    cargarLista();
};

// Abrir modal de edición de lista
const abrirModalEdicionLista = () => {
    listaEditando.value = { ...lista.value };
    showEditListModal.value = true;
};

// Guardar cambios de edición de lista
const guardarEdicionLista = () => {
    if (!listaEditando.value.nombre.trim() || !listaEditando.value.destino.trim()) return;

    actualizarLista(listaId, {
        nombre: listaEditando.value.nombre,
        destino: listaEditando.value.destino,
        fechaInicio: listaEditando.value.fechaInicio,
        fechaFin: listaEditando.value.fechaFin
    });

    showEditListModal.value = false;
    listaEditando.value = null;

    // Recargar la lista
    cargarLista();
};

// Abrir modal de confirmación de eliminación de lista
const abrirModalEliminarLista = () => {
    showDeleteListModal.value = true;
};

// Confirmar eliminación de lista
const confirmarEliminarLista = () => {
    eliminarLista(listaId);
    showDeleteListModal.value = false;
    router.push({ name: 'TripLists' });
};

// Marcar/desmarcar elemento como completado
const marcarCompletado = (itemId) => {
    toggleCompletado(listaId, itemId);
    cargarLista();
};

// Volver a la lista de viajes
const volverAListas = () => {
    router.push({ name: 'TripLists' });
};

// Manejar inicio de sesión exitoso
const handleLoginSuccess = () => {
    showAuthModal.value = false;
    cargarLista();
};

let initialAuthCheck = ref(false);

// Verificar autenticación al montar el componente
onMounted(() => {
    initialAuthCheck.value = isUserAuthenticated();
    if (!initialAuthCheck.value) {
        showAuthModal.value = true;
    } else {
        cargarLista();
    }
});

// Observar cambios en la ruta para recargar la lista si cambia el ID
watch(() => route.params.id, (newId) => {
    if (newId && newId !== listaId) {
        cargarLista();
    }
});
</script>

<template>
    <div class="trip-detail-container">
        <div class="container py-4">
            <!-- Spinner de carga -->
            <div v-if="isLoading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
            </div>

            <!-- Mensaje de error -->
            <div v-else-if="error" class="alert alert-danger" role="alert">
                {{ error }}
            </div>

            <!-- Contenido de la lista -->
            <div v-else-if="lista" class="trip-detail">
                <!-- Encabezado -->
                <div class="trip-header">
                    <button class="btn-back" @click="volverAListas">
                        <i class="bi bi-arrow-left"></i>
                    </button>

                    <div class="trip-header-content">
                        <div class="trip-badge" :class="{ 'trip-badge-today': viajeEsHoy }">
                            {{ diasRestantes }}
                        </div>

                        <h1 class="trip-title">{{ lista.nombre }}</h1>

                        <div class="trip-info">
                            <div class="trip-destination">
                                <i class="bi bi-geo-alt-fill"></i> {{ lista.destino }}
                            </div>
                            <div class="trip-dates">
                                <i class="bi bi-calendar3"></i>
                                {{ formatearFecha(lista.fechaInicio) }} - {{ formatearFecha(lista.fechaFin) }}
                            </div>
                        </div>

                        <div class="trip-actions">
                            <button class="btn-edit" @click="abrirModalEdicionLista">
                                <i class="bi bi-pencil"></i> Editar
                            </button>
                            <button class="btn-delete" @click="abrirModalEliminarLista">
                                <i class="bi bi-trash"></i> Eliminar
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Progreso -->
                <div class="trip-progress-container">
                    <div class="progress-header">
                        <h3>Progreso</h3>
                        <div class="progress-percentage" :class="{ 'text-success': listaCompleta }">
                            {{ porcentajeCompletado }}%
                        </div>
                    </div>
                    <div class="progress">
                        <div class="progress-bar" :class="{ 'bg-success': listaCompleta }" role="progressbar"
                            :style="`width: ${porcentajeCompletado}%`" :aria-valuenow="porcentajeCompletado"
                            aria-valuemin="0" aria-valuemax="100">
                        </div>
                    </div>
                    <div class="progress-status">
                        <span v-if="listaCompleta" class="text-success">
                            <i class="bi bi-check-circle-fill"></i> ¡Todo listo para tu viaje!
                        </span>
                        <span v-else>
                            <i class="bi bi-info-circle"></i>
                            {{lista.items.filter(item => !item.completado).length}} elementos pendientes
                        </span>
                    </div>
                </div>

                <!-- Formulario para agregar nuevo elemento -->
                <div class="add-item-form">
                    <h3>Agregar elemento</h3>
                    <form @submit.prevent="agregarNuevoItem" class="item-form">
                        <div class="form-row">
                            <div class="form-group item-text">
                                <input type="text" class="form-control" v-model="nuevoItem.texto"
                                    placeholder="¿Qué necesitas llevar?" required>
                            </div>
                            <div class="form-group item-category">
                                <select class="form-select" v-model="nuevoItem.categoria">
                                    <option v-for="cat in categorias" :key="cat.id" :value="cat.id">
                                        {{ cat.nombre }}
                                    </option>
                                </select>
                            </div>
                            <div class="form-group item-priority">
                                <select class="form-select" v-model="nuevoItem.prioridad">
                                    <option value="1">Alta</option>
                                    <option value="2">Media</option>
                                    <option value="3">Baja</option>
                                </select>
                            </div>
                            <div class="form-group item-submit">
                                <button type="submit" class="btn btn-primary">
                                    <i class="bi bi-plus-lg"></i> Agregar
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                <!-- Lista de elementos por categoría -->
                <div class="items-container">
                    <div v-for="categoria in categorias" :key="categoria.id" class="category-section"
                        v-if="itemsPorCategoria[categoria.id] && itemsPorCategoria[categoria.id].length > 0">
                        <div class="category-header">
                            <h3>
                                <i class="bi" :class="`bi-${categoria.icon}`"></i>
                                {{ categoria.nombre }}
                            </h3>
                            <span class="category-count">
                                {{itemsPorCategoria[categoria.id].filter(item => item.completado).length}}/{{
                                    itemsPorCategoria[categoria.id].length }}
                            </span>
                        </div>

                        <div class="items-list">
                            <div v-for="item in itemsPorCategoria[categoria.id]" :key="item.id" class="item-card"
                                :class="{ 'item-completed': item.completado, 'item-priority-1': item.prioridad === 1, 'item-priority-2': item.prioridad === 2, 'item-priority-3': item.prioridad === 3 }">
                                <div class="item-checkbox">
                                    <input type="checkbox" :id="`item-${item.id}`" :checked="item.completado"
                                        @change="marcarCompletado(item.id)">
                                    <label :for="`item-${item.id}`"></label>
                                </div>
                                <div class="item-content">
                                    <div class="item-text">{{ item.texto }}</div>
                                    <div class="item-priority">
                                        <span v-if="item.prioridad === 1" class="priority-high">Alta</span>
                                        <span v-else-if="item.prioridad === 2" class="priority-medium">Media</span>
                                        <span v-else class="priority-low">Baja</span>
                                    </div>
                                </div>
                                <div class="item-actions">
                                    <button class="btn-item-edit" @click="abrirModalEdicion(item)">
                                        <i class="bi bi-pencil"></i>
                                    </button>
                                    <button class="btn-item-delete" @click="abrirModalEliminar(item)">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Mensaje cuando no hay elementos -->
                    <div v-if="!lista.items || lista.items.length === 0" class="empty-items">
                        <div class="empty-illustration">
                            <i class="bi bi-list-check display-1"></i>
                        </div>
                        <h3>No hay elementos en tu lista</h3>
                        <p class="text-muted">Agrega elementos para organizar tu viaje</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal de edición de elemento -->
        <div class="modal fade" :class="{ show: showEditModal }" tabindex="-1"
            :style="{ display: showEditModal ? 'block' : 'none' }">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Editar elemento</h5>
                        <button type="button" class="btn-close" @click="showEditModal = false"></button>
                    </div>
                    <div class="modal-body" v-if="itemEditando">
                        <form @submit.prevent="guardarEdicion">
                            <div class="mb-3">
                                <label for="editItemText" class="form-label">Texto</label>
                                <input type="text" class="form-control" id="editItemText" v-model="itemEditando.texto"
                                    required>
                            </div>

                            <div class="mb-3">
                                <label for="editItemCategory" class="form-label">Categoría</label>
                                <select class="form-select" id="editItemCategory" v-model="itemEditando.categoria">
                                    <option v-for="cat in categorias" :key="cat.id" :value="cat.id">
                                        {{ cat.nombre }}
                                    </option>
                                </select>
                            </div>

                            <div class="mb-3">
                                <label for="editItemPriority" class="form-label">Prioridad</label>
                                <select class="form-select" id="editItemPriority" v-model="itemEditando.prioridad">
                                    <option value="1">Alta</option>
                                    <option value="2">Media</option>
                                    <option value="3">Baja</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-link" @click="showEditModal = false">Cancelar</button>
                        <button type="button" class="btn btn-primary" @click="guardarEdicion">Guardar</button>
                    </div>
                </div>
            </div>
        </div>
        <div v-if="showEditModal" class="modal-backdrop fade show"></div>

        <!-- Modal de confirmación de eliminación -->
        <div class="modal fade" :class="{ show: showDeleteModal }" tabindex="-1"
            :style="{ display: showDeleteModal ? 'block' : 'none' }">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Confirmar eliminación</h5>
                        <button type="button" class="btn-close" @click="showDeleteModal = false"></button>
                    </div>
                    <div class="modal-body" v-if="itemEliminando">
                        <p>¿Estás seguro de que deseas eliminar el elemento "{{ itemEliminando.texto }}"?</p>
                        <p class="text-danger">Esta acción no se puede deshacer.</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-link" @click="showDeleteModal = false">Cancelar</button>
                        <button type="button" class="btn btn-danger" @click="confirmarEliminar">Eliminar</button>
                    </div>
                </div>
            </div>
        </div>
        <div v-if="showDeleteModal" class="modal-backdrop fade show"></div>

        <!-- Modal de edición de lista -->
        <div class="modal fade" :class="{ show: showEditListModal }" tabindex="-1"
            :style="{ display: showEditListModal ? 'block' : 'none' }">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Editar viaje</h5>
                        <button type="button" class="btn-close" @click="showEditListModal = false"></button>
                    </div>
                    <div class="modal-body" v-if="listaEditando">
                        <form @submit.prevent="guardarEdicionLista">
                            <div class="mb-3">
                                <label for="editListName" class="form-label">Nombre</label>
                                <input type="text" class="form-control" id="editListName" v-model="listaEditando.nombre"
                                    required>
                            </div>

                            <div class="mb-3">
                                <label for="editListDestination" class="form-label">Destino</label>
                                <input type="text" class="form-control" id="editListDestination"
                                    v-model="listaEditando.destino" required>
                            </div>

                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="editListStartDate" class="form-label">Fecha de inicio</label>
                                    <input type="date" class="form-control" id="editListStartDate"
                                        v-model="listaEditando.fechaInicio" required>
                                </div>

                                <div class="col-md-6 mb-3">
                                    <label for="editListEndDate" class="form-label">Fecha de fin</label>
                                    <input type="date" class="form-control" id="editListEndDate"
                                        v-model="listaEditando.fechaFin" required>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-link" @click="showEditListModal = false">Cancelar</button>
                        <button type="button" class="btn btn-primary" @click="guardarEdicionLista">Guardar</button>
                    </div>
                </div>
            </div>
        </div>
        <div v-if="showEditListModal" class="modal-backdrop fade show"></div>

        <!-- Modal de confirmación de eliminación de lista -->
        <div class="modal fade" :class="{ show: showDeleteListModal }" tabindex="-1"
            :style="{ display: showDeleteListModal ? 'block' : 'none' }">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Confirmar eliminación</h5>
                        <button type="button" class="btn-close" @click="showDeleteListModal = false"></button>
                    </div>
                    <div class="modal-body">
                        <p>¿Estás seguro de que deseas eliminar este viaje?</p>
                        <p class="text-danger">Esta acción eliminará todos los elementos de la lista y no se puede
                            deshacer.</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-link"
                            @click="showDeleteListModal = false">Cancelar</button>
                        <button type="button" class="btn btn-danger" @click="confirmarEliminarLista">Eliminar</button>
                    </div>
                </div>
            </div>
        </div>
        <div v-if="showDeleteListModal" class="modal-backdrop fade show"></div>

        <!-- Modal de autenticación -->
        <AuthModal :visible="showAuthModal" @close="showAuthModal = false" @login-success="handleLoginSuccess" />
    </div>
</template>

<style scoped>
.trip-detail-container {
    min-height: 80vh;
    padding-top: 2rem;
    padding-bottom: 5rem;
    background-color: #f8f9fa;
}

/* Encabezado */
.trip-header {
    position: relative;
    background-color: white;
    border-radius: 1rem;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
}

.btn-back {
    position: absolute;
    top: 1rem;
    left: 1rem;
    background-color: transparent;
    border: none;
    font-size: 1.5rem;
    color: var(--color-primary);
    cursor: pointer;
    transition: transform 0.2s;
}

.btn-back:hover {
    transform: translateX(-3px);
}

.trip-header-content {
    text-align: center;
    padding-top: 1rem;
}

.trip-badge {
    display: inline-block;
    background-color: var(--color-primary);
    color: white;
    padding: 0.5rem 1.5rem;
    border-radius: 2rem;
    font-weight: 600;
    margin-bottom: 1rem;
}

.trip-badge-today {
    background-color: var(--color-accent);
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% {
        box-shadow: 0 0 0 0 rgba(var(--color-accent-rgb), 0.7);
    }

    70% {
        box-shadow: 0 0 0 10px rgba(var(--color-accent-rgb), 0);
    }

    100% {
        box-shadow: 0 0 0 0 rgba(var(--color-accent-rgb), 0);
    }
}

.trip-title {
    font-size: 2rem;
    font-weight: bold;
    color: var(--color-primary);
    margin-bottom: 1rem;
}

.trip-info {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin-bottom: 1.5rem;
    color: #6c757d;
}

.trip-actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
}

.btn-edit,
.btn-delete {
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    border: none;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-edit {
    background-color: #e9ecef;
    color: #495057;
}

.btn-edit:hover {
    background-color: #dee2e6;
}

.btn-delete {
    background-color: #fff5f5;
    color: #e53e3e;
}

.btn-delete:hover {
    background-color: #fed7d7;
}

/* Progreso */
.trip-progress-container {
    background-color: white;
    border-radius: 1rem;
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
}

.progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.progress-header h3 {
    margin: 0;
    font-size: 1.25rem;
    color: var(--color-primary);
}

.progress-percentage {
    font-size: 1.5rem;
    font-weight: bold;
    color: var(--color-primary);
}

.progress {
    height: 10px;
    margin-bottom: 1rem;
    border-radius: 5px;
    background-color: #e9ecef;
}

.progress-bar {
    background-color: var(--color-primary);
    border-radius: 5px;
    transition: width 0.5s ease;
}

.progress-status {
    text-align: center;
    font-size: 0.9rem;
    color: #6c757d;
}

.text-success {
    color: #38a169 !important;
}

/* Formulario para agregar elementos */
.add-item-form {
    background-color: white;
    border-radius: 1rem;
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
}

.add-item-form h3 {
    margin-bottom: 1rem;
    font-size: 1.25rem;
    color: var(--color-primary);
}

.item-form {
    width: 100%;
}

.form-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: flex-start;
}

.form-group {
    margin-bottom: 0;
}

.item-text {
    flex: 3;
    min-width: 200px;
}

.item-category,
.item-priority {
    flex: 1;
    min-width: 120px;
}

.item-submit {
    flex: 0 0 auto;
}

/* Lista de elementos */
.items-container {
    margin-bottom: 2rem;
}

.category-section {
    background-color: white;
    border-radius: 1rem;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
}

.category-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #e9ecef;
}

.category-header h3 {
    margin: 0;
    font-size: 1.25rem;
    color: var(--color-primary);
}

.category-count {
    background-color: #e9ecef;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.8rem;
    color: #495057;
}

.items-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.item-card {
    display: flex;
    align-items: center;
    padding: 1rem;
    border-radius: 0.5rem;
    background-color: #f8f9fa;
    transition: all 0.2s;
}

.item-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.item-completed {
    background-color: #f0fff4;
}

.item-completed .item-text {
    text-decoration: line-through;
    color: #a0aec0;
}

.item-priority-1 {
    border-left: 4px solid #e53e3e;
}

.item-priority-2 {
    border-left: 4px solid #dd6b20;
}

.item-priority-3 {
    border-left: 4px solid #3182ce;
}

.item-checkbox {
    margin-right: 1rem;
}

.item-checkbox input[type="checkbox"] {
    display: none;
}

.item-checkbox label {
    display: inline-block;
    width: 24px;
    height: 24px;
    border: 2px solid #cbd5e0;
    border-radius: 4px;
    position: relative;
    cursor: pointer;
    transition: all 0.2s;
}

.item-checkbox input[type="checkbox"]:checked+label {
    background-color: #38a169;
    border-color: #38a169;
}

.item-checkbox input[type="checkbox"]:checked+label::after {
    content: '\2713';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-size: 14px;
}

.item-content {
    flex: 1;
}

.item-text {
    font-weight: 500;
    margin-bottom: 0.25rem;
}

.item-priority {
    font-size: 0.8rem;
}

.priority-high {
    color: #e53e3e;
}

.priority-medium {
    color: #dd6b20;
}

.priority-low {
    color: #3182ce;
}

.item-actions {
    display: flex;
    gap: 0.5rem;
}

.btn-item-edit,
.btn-item-delete {
    background-color: transparent;
    border: none;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
}

.btn-item-edit {
    color: #4a5568;
}

.btn-item-edit:hover {
    background-color: #e9ecef;
}

.btn-item-delete {
    color: #e53e3e;
}

.btn-item-delete:hover {
    background-color: #fff5f5;
}

/* Estado vacío */
.empty-items {
    background-color: white;
    border-radius: 1rem;
    padding: 3rem;
    text-align: center;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
}

.empty-illustration {
    color: var(--color-primary);
    opacity: 0.7;
    margin-bottom: 1.5rem;
}

/* Modal */
.modal-content {
    border-radius: 1rem;
    border: none;
}

.modal-header {
    border-bottom: none;
    padding: 1.5rem 1.5rem 0.5rem;
}

.modal-footer {
    border-top: none;
    padding: 0.5rem 1.5rem 1.5rem;
}

.modal-title {
    color: var(--color-primary);
    font-weight: bold;
}

.btn-primary {
    background-color: var(--color-primary);
    border-color: var(--color-primary);
    border-radius: 0.5rem;
}

.btn-primary:hover {
    background-color: var(--color-accent);
    border-color: var(--color-accent);
}

.btn-danger {
    background-color: #e53e3e;
    border-color: #e53e3e;
    border-radius: 0.5rem;
}

.btn-link {
    color: var(--color-primary);
}

/* Responsive */
@media (max-width: 767px) {
    .trip-info {
        flex-direction: column;
        gap: 0.5rem;
    }

    .form-row {
        flex-direction: column;
    }

    .form-group {
        width: 100%;
    }

    .item-submit {
        margin-top: 0.5rem;
    }

    .btn-primary {
        width: 100%;
    }

    .empty-items {
        padding: 2rem 1rem;
    }
}
</style>
