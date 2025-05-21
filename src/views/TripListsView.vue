<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTripLists } from '@/composables/useTripLists';
import { useAuth } from '@/composables/useAuth';
import AuthModal from '@/components/AuthModal.vue';
import { checkTripsAndNotify } from '@/services/tripNotificationService';

const router = useRouter();
const { isUserAuthenticated } = useAuth();
const {
    listasOrdenadas,
    listasProximas,
    isLoading,
    crearLista
} = useTripLists();

// Estado para el modal de autenticación
const showAuthModal = ref(false);

// Estado para el modal de nueva lista
const showNewListModal = ref(false);
const nuevaLista = ref({
    nombre: '',
    destino: '',
    fechaInicio: '',
    fechaFin: ''
});

// Validación del formulario
const formErrors = ref({});

// Estado para el filtro actual
const filtroActual = ref('proximos'); // 'todos', 'proximos', 'pasados'

// Listas filtradas según el filtro actual
const listasFiltradas = computed(() => {
    const hoy = new Date();

    if (filtroActual.value === 'todos') {
        return listasOrdenadas.value;
    } else if (filtroActual.value === 'pasados') {
        return listasOrdenadas.value.filter(lista => new Date(lista.fechaInicio) < hoy);
    } else { // proximos (default)
        return listasOrdenadas.value.filter(lista => new Date(lista.fechaInicio) >= hoy);
    }
});

// Verificar si hay listas
const hayListas = computed(() => {
    return listasFiltradas.value.length > 0;
});

// Formatear fecha para mostrar
function formatearFecha(fecha) {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Calcular días restantes para un viaje
function diasRestantes(fechaInicio) {
    const hoy = new Date();
    const inicio = new Date(fechaInicio);
    const diferencia = inicio - hoy;
    const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));

    if (dias < 0) return 'Viaje pasado';
    if (dias === 0) return '¡Hoy!';
    if (dias === 1) return 'Mañana';
    return `En ${dias} días`;
}

// Calcular porcentaje de completado
function porcentajeCompletado(lista) {
    if (!lista.items || lista.items.length === 0) return 0;

    const completados = lista.items.filter(item => item.completado).length;
    return Math.round((completados / lista.items.length) * 100);
}

// Abrir modal para crear nueva lista
function abrirModalNuevaLista() {
    if (!isUserAuthenticated()) {
        showAuthModal.value = true;
        return;
    }

    // Inicializar con fecha de hoy
    const hoy = new Date().toISOString().split('T')[0];
    nuevaLista.value = {
        nombre: '',
        destino: '',
        fechaInicio: hoy,
        fechaFin: hoy
    };

    showNewListModal.value = true;
}

// Validar formulario
function validarFormulario() {
    formErrors.value = {};
    let isValid = true;

    if (!nuevaLista.value.nombre.trim()) {
        formErrors.value.nombre = 'El nombre es obligatorio';
        isValid = false;
    }

    if (!nuevaLista.value.destino.trim()) {
        formErrors.value.destino = 'El destino es obligatorio';
        isValid = false;
    }

    if (!nuevaLista.value.fechaInicio) {
        formErrors.value.fechaInicio = 'La fecha de inicio es obligatoria';
        isValid = false;
    }

    if (!nuevaLista.value.fechaFin) {
        formErrors.value.fechaFin = 'La fecha de fin es obligatoria';
        isValid = false;
    }

    if (nuevaLista.value.fechaInicio && nuevaLista.value.fechaFin) {
        const inicio = new Date(nuevaLista.value.fechaInicio);
        const fin = new Date(nuevaLista.value.fechaFin);

        if (fin < inicio) {
            formErrors.value.fechaFin = 'La fecha de fin no puede ser anterior a la fecha de inicio';
            isValid = false;
        }
    }

    return isValid;
}

// Crear nueva lista
function crearNuevaLista() {
    if (!validarFormulario()) return;

    const lista = crearLista(
        nuevaLista.value.nombre,
        nuevaLista.value.destino,
        nuevaLista.value.fechaInicio,
        nuevaLista.value.fechaFin
    );

    if (lista) {
        showNewListModal.value = false;
        router.push({ name: 'TripListDetail', params: { id: lista.id } });
    }
}

// Ir a la vista de detalle de una lista
function verLista(id) {
    router.push({ name: 'TripListDetail', params: { id } });
}

// Manejar inicio de sesión exitoso
function handleLoginSuccess() {
    showAuthModal.value = false;
    // Mostrar el modal de nueva lista después de iniciar sesión
    setTimeout(() => {
        abrirModalNuevaLista();
    }, 500);
}

// Cambiar el filtro actual
function cambiarFiltro(filtro) {
    filtroActual.value = filtro;
}

// Verificar viajes y enviar notificaciones si es necesario
async function verificarViajesYNotificar() {
    if (isUserAuthenticated()) {
        try {
            await checkTripsAndNotify();
            // No mostramos notificación en la UI para no interrumpir la experiencia del usuario
            console.log('Verificación de viajes completada');
        } catch (error) {
            console.error('Error al verificar viajes:', error);
        }
    }
}

onMounted(() => {
    // Si no hay autenticación, mostrar modal de login
    if (!isUserAuthenticated()) {
        showAuthModal.value = true;
    } else {
        // Verificar viajes y enviar notificaciones si es necesario
        verificarViajesYNotificar();
    }
});
</script>

<template>
    <div class="trip-lists-container">
        <div class="container py-4">
            <!-- Encabezado con ilustración -->
            <div class="header-container mb-5">
                <div class="text-center">
                    <div class="illustration-container mb-3">
                        <div class="illustration-icon">
                            <i class="bi bi-suitcase-fill"></i>
                        </div>
                    </div>
                    <h1 class="display-5 fw-bold">Mis Viajes</h1>
                    <p class="lead text-muted">Organiza tus viajes y no olvides nada importante</p>
                    <!-- Filtros de viajes -->
                    <div class="trip-filters">
                        <button class="filter-btn" :class="{ active: filtroActual === 'todos' }"
                            @click="cambiarFiltro('todos')">
                            <i class="bi bi-grid-3x3-gap-fill me-1"></i> Todos
                        </button>
                        <button class="filter-btn" :class="{ active: filtroActual === 'proximos' }"
                            @click="cambiarFiltro('proximos')">
                            <i class="bi bi-calendar-check me-1"></i> Próximos
                        </button>
                        <button class="filter-btn" :class="{ active: filtroActual === 'pasados' }"
                            @click="cambiarFiltro('pasados')">
                            <i class="bi bi-calendar-x me-1"></i> Pasados
                        </button>
                    </div>
                </div>

                <!-- Nuevo botón de agregar viaje -->
                <button class="btn-add-trip" @click="abrirModalNuevaLista">
                    <span class="btn-text">Nuevo Viaje</span>
                    <span class="btn-icon"><i class="bi bi-plus-lg"></i></span>
                </button>
            </div>

            <!-- Spinner de carga -->
            <div v-if="isLoading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
            </div>

            <!-- Mensaje cuando no hay listas -->
            <div v-else-if="!hayListas" class="text-center py-5">
                <div class="empty-state">
                    <div class="empty-illustration mb-4">
                        <i class="bi bi-suitcase display-1"></i>
                    </div>
                    <h3 v-if="filtroActual === 'todos'">No tienes viajes</h3>
                    <h3 v-else-if="filtroActual === 'proximos'">No tienes viajes próximos</h3>
                    <h3 v-else>No tienes viajes pasados</h3>

                    <p class="text-muted mb-4" v-if="filtroActual === 'todos' || filtroActual === 'proximos'">
                        Crea tu primer viaje para empezar a organizar
                    </p>
                    <p class="text-muted mb-4" v-else>
                        Tus viajes pasados aparecerán aquí
                    </p>

                    <button class="btn btn-primary btn-lg" @click="abrirModalNuevaLista">
                        <i class="bi bi-plus-lg me-2"></i> Nuevo Viaje
                    </button>
                </div>
            </div>

            <!-- Lista de viajes -->
            <div v-else class="trip-cards">
                <div v-for="lista in listasFiltradas" :key="lista.id" class="trip-card" @click="verLista(lista.id)">
                    <div class="trip-card-header">
                        <div class="trip-date">
                            <span class="trip-day">{{ new Date(lista.fechaInicio).getDate() }}</span>
                            <span class="trip-month">{{ new Date(lista.fechaInicio).toLocaleString('es-ES', {
                                month:
                                    'short'
                            }) }}</span>
                        </div>
                        <div class="trip-badge"
                            :class="diasRestantes(lista.fechaInicio) === '¡Hoy!' ? 'trip-badge-today' : ''">
                            {{ diasRestantes(lista.fechaInicio) }}
                        </div>
                    </div>

                    <div class="trip-card-body">
                        <h3 class="trip-title">{{ lista.nombre }}</h3>
                        <p class="trip-destination">
                            <i class="bi bi-geo-alt-fill"></i> {{ lista.destino }}
                        </p>

                        <div class="trip-dates">
                            <i class="bi bi-calendar3"></i>
                            {{ formatearFecha(lista.fechaInicio) }} - {{ formatearFecha(lista.fechaFin) }}
                        </div>

                        <!-- Progreso -->
                        <div class="trip-progress">
                            <div class="progress">
                                <div class="progress-bar"
                                    :class="porcentajeCompletado(lista) === 100 ? 'bg-success' : ''" role="progressbar"
                                    :style="`width: ${porcentajeCompletado(lista)}%`"
                                    :aria-valuenow="porcentajeCompletado(lista)" aria-valuemin="0" aria-valuemax="100">
                                </div>
                            </div>
                            <div class="trip-progress-text">
                                <span>{{lista.items.filter(item => item.completado).length}}/{{ lista.items.length
                                }}</span>
                                <span>{{ porcentajeCompletado(lista) }}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal para crear nueva lista -->
        <div class="modal fade" :class="{ show: showNewListModal }" tabindex="-1"
            :style="{ display: showNewListModal ? 'block' : 'none' }">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Nuevo Viaje</h5>
                        <button type="button" class="btn-close" @click="showNewListModal = false"></button>
                    </div>
                    <div class="modal-body">
                        <form @submit.prevent="crearNuevaLista">
                            <div class="mb-3">
                                <label for="nombreViaje" class="form-label">¿A dónde vas?</label>
                                <input type="text" class="form-control form-control-lg"
                                    :class="{ 'is-invalid': formErrors.nombre }" id="nombreViaje"
                                    v-model="nuevaLista.nombre" placeholder="Ej: Vacaciones en Barcelona" autofocus>
                                <div class="invalid-feedback">{{ formErrors.nombre }}</div>
                            </div>

                            <div class="mb-3">
                                <label for="destinoViaje" class="form-label">Destino</label>
                                <div class="input-group">
                                    <span class="input-group-text"><i class="bi bi-geo-alt"></i></span>
                                    <input type="text" class="form-control"
                                        :class="{ 'is-invalid': formErrors.destino }" id="destinoViaje"
                                        v-model="nuevaLista.destino" placeholder="Ej: Barcelona, España">
                                </div>
                                <div class="invalid-feedback">{{ formErrors.destino }}</div>
                            </div>

                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="fechaInicio" class="form-label">Fecha de Inicio</label>
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="bi bi-calendar-event"></i></span>
                                        <input type="date" class="form-control"
                                            :class="{ 'is-invalid': formErrors.fechaInicio }" id="fechaInicio"
                                            v-model="nuevaLista.fechaInicio">
                                    </div>
                                    <div class="invalid-feedback">{{ formErrors.fechaInicio }}</div>
                                </div>

                                <div class="col-md-6 mb-3">
                                    <label for="fechaFin" class="form-label">Fecha de Fin</label>
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="bi bi-calendar-event"></i></span>
                                        <input type="date" class="form-control"
                                            :class="{ 'is-invalid': formErrors.fechaFin }" id="fechaFin"
                                            v-model="nuevaLista.fechaFin">
                                    </div>
                                    <div class="invalid-feedback">{{ formErrors.fechaFin }}</div>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-link" @click="showNewListModal = false">Cancelar</button>
                        <button type="button" class="btn btn-primary" @click="crearNuevaLista">Crear Viaje</button>
                    </div>
                </div>
            </div>
        </div>
        <div v-if="showNewListModal" class="modal-backdrop fade show"></div>

        <!-- Modal de autenticación -->
        <AuthModal :visible="showAuthModal" @close="showAuthModal = false" @login-success="handleLoginSuccess" />
    </div>
</template>

<style scoped>
.trip-lists-container {
    min-height: 80vh;
    padding-top: 2rem;
    padding-bottom: 5rem;
    background-color: #f8f9fa;
}

/* Ilustración */
.illustration-container {
    display: flex;
    justify-content: center;
}

.illustration-icon {
    width: 150px;
    height: 150px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 5rem;
    color: var(--color-primary);
    background-color: rgba(var(--color-primary-rgb), 0.1);
    border-radius: 50%;
}

/* Contenedor del encabezado */
.header-container {
    position: relative;
    padding-top: 1rem;
}

/* Botón de agregar viaje */
.btn-add-trip {
    position: absolute;
    top: 0;
    right: 0;
    display: flex;
    align-items: center;
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%);
    color: white;
    border: none;
    border-radius: 12px;
    padding: 0.75rem 1.25rem;
    font-weight: 600;
    box-shadow: 0 4px 15px rgba(var(--color-primary-rgb), 0.3);
    transition: all 0.3s ease;
    overflow: hidden;
    z-index: 10;
}

.btn-add-trip:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(var(--color-primary-rgb), 0.4);
}

.btn-add-trip:active {
    transform: translateY(0);
    box-shadow: 0 4px 10px rgba(var(--color-primary-rgb), 0.3);
}

.btn-text {
    margin-right: 0.5rem;
}

.btn-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
}

/* Responsive para el botón */
@media (max-width: 767px) {
    .btn-add-trip {
        position: relative;
        margin-top: 1rem;
        width: auto;
        display: inline-flex;
        justify-content: center;
    }

    .header-container {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
}

/* Estado vacío */
.empty-state {
    background-color: white;
    border-radius: 1rem;
    padding: 3rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
}

.empty-illustration {
    color: var(--color-primary);
    opacity: 0.7;
}

/* Tarjetas de viaje */
.trip-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
}

.trip-card {
    background-color: white;
    border-radius: 1rem;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
    transition: transform 0.3s, box-shadow 0.3s;
    cursor: pointer;
}

.trip-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
}

.trip-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: var(--color-primary);
    color: white;
}

.trip-date {
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: white;
    color: var(--color-primary);
    border-radius: 0.5rem;
    padding: 0.5rem;
    min-width: 60px;
}

.trip-day {
    font-size: 1.5rem;
    font-weight: bold;
    line-height: 1;
}

.trip-month {
    font-size: 0.8rem;
    text-transform: uppercase;
}

.trip-badge {
    background-color: rgba(255, 255, 255, 0.2);
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.8rem;
}

.trip-badge-today {
    background-color: var(--color-accent);
    font-weight: bold;
}

.trip-card-body {
    padding: 1.5rem;
}

.trip-title {
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
    color: var(--color-primary);
}

.trip-destination {
    color: #6c757d;
    margin-bottom: 0.5rem;
}

.trip-dates {
    color: #6c757d;
    font-size: 0.9rem;
    margin-bottom: 1rem;
}

.trip-progress {
    margin-top: 1rem;
}

.progress {
    height: 8px;
    margin-bottom: 0.5rem;
    border-radius: 4px;
    background-color: #e9ecef;
}

.progress-bar {
    background-color: var(--color-primary);
    border-radius: 4px;
}

.trip-progress-text {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: #6c757d;
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

.form-control {
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
}

.form-control:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 0.25rem rgba(var(--color-primary-rgb), 0.25);
}

.input-group-text {
    background-color: white;
    border-right: none;
}

.form-control {
    border-left: none;
}

.btn-primary {
    background-color: var(--color-primary);
    border-color: var(--color-primary);
    border-radius: 0.5rem;
    padding: 0.5rem 1.5rem;
}

.btn-primary:hover {
    background-color: var(--color-accent);
    border-color: var(--color-accent);
}

.btn-link {
    color: var(--color-primary);
}

/* Responsive */
@media (max-width: 767px) {
    .trip-cards {
        grid-template-columns: 1fr;
    }

    .empty-state {
        padding: 2rem 1rem;
    }
}

/* Filtros */
.trip-filters {
    display: flex;
    justify-content: center;
    margin: 1.5rem 0;
    gap: 0.5rem;
}

.filter-btn {
    background-color: white;
    border: 1px solid #e9ecef;
    border-radius: 2rem;
    padding: 0.5rem 1.25rem;
    font-size: 0.9rem;
    color: #6c757d;
    transition: all 0.2s ease;
    cursor: pointer;
}

.filter-btn:hover {
    background-color: #f8f9fa;
    color: var(--color-primary);
}

.filter-btn.active {
    background-color: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
    box-shadow: 0 2px 10px rgba(var(--color-primary-rgb), 0.3);
}

/* Mensaje cuando no hay listas */
.empty-state {
    background-color: white;
    border-radius: 1rem;
    padding: 3rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
    text-align: center;
}
</style>
