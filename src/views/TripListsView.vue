<script setup>
// Importaciones de Vue y composables necesarios
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTripLists } from '@/composables/useTripLists';
import { useAuth } from '@/composables/useAuth';
import AuthModal from '@/components/AuthModal.vue';
import { checkTripsAndNotify } from '@/services/tripNotificationService';

// Inicialización del router y composables
const router = useRouter();
const { isUserAuthenticated } = useAuth();
const {
    tripLists,        // Lista completa de viajes
    listasOrdenadas,  // Listas ordenadas por fecha
    listasProximas,   // Listas de viajes próximos
    isLoading,        // Estado de carga
    crearLista,       // Función para crear una nueva lista
    cargarListas      // Función para cargar listas desde el almacenamiento
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
// Calcula dinámicamente qué listas mostrar basado en el filtro seleccionado
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
// Se usa para mostrar el estado vacío cuando no hay viajes
const hayListas = computed(() => {
    return listasFiltradas.value.length > 0;
});

// Formatear fecha para mostrar en formato DD/MM/YYYY
function formatearFecha(fecha) {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Calcular días restantes para un viaje
// Devuelve un texto descriptivo según la proximidad del viaje
function diasRestantes(fechaInicio) {
    const hoy = new Date();
    const inicio = new Date(fechaInicio);
    const diferencia = inicio - hoy;
    const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));

    if (dias < 0) return 'Past trip';
    if (dias === 0) return 'Today!';
    if (dias === 1) return 'Tomorrow';
    return `In ${dias} days`;
}

// Calcular porcentaje de completado
// Se usa para mostrar la barra de progreso de cada viaje
function porcentajeCompletado(lista) {
    if (!lista.items || lista.items.length === 0) return 0;

    const completados = lista.items.filter(item => item.completado).length;
    return Math.round((completados / lista.items.length) * 100);
}

// Abrir modal para crear nueva lista
// Si el usuario no está autenticado, muestra el modal de login primero
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
// Verifica que todos los campos requeridos estén completos y sean válidos
function validarFormulario() {
    formErrors.value = {};
    let isValid = true;

    if (!nuevaLista.value.nombre.trim()) {
        formErrors.value.nombre = 'Name is required';
        isValid = false;
    }

    if (!nuevaLista.value.destino.trim()) {
        formErrors.value.destino = 'Destination is required';
        isValid = false;
    }

    if (!nuevaLista.value.fechaInicio) {
        formErrors.value.fechaInicio = 'Start date is required';
        isValid = false;
    }

    if (!nuevaLista.value.fechaFin) {
        formErrors.value.fechaFin = 'End date is required';
        isValid = false;
    }

    if (nuevaLista.value.fechaInicio && nuevaLista.value.fechaFin) {
        const inicio = new Date(nuevaLista.value.fechaInicio);
        const fin = new Date(nuevaLista.value.fechaFin);

        if (fin < inicio) {
            formErrors.value.fechaFin = 'End date cannot be earlier than start date';
            isValid = false;
        }
    }

    return isValid;
}

// Crear nueva lista
// Valida el formulario y llama a la función crearLista del composable
async function crearNuevaLista() {
    if (!validarFormulario()) return;

    try {
        console.log("Creando nueva lista con datos:", nuevaLista.value);

        const lista = crearLista(
            nuevaLista.value.nombre,
            nuevaLista.value.destino,
            nuevaLista.value.fechaInicio,
            nuevaLista.value.fechaFin
        );

        if (lista) {
            console.log("Lista creada exitosamente:", lista);
            showNewListModal.value = false;

            // Esperar un momento para asegurar que la lista se guarde
            setTimeout(() => {
                router.push({ name: 'TripListDetail', params: { id: lista.id } });
            }, 100);
        } else {
            console.error("Error al crear lista: la función crearLista devolvió null o undefined");
            alert("Could not create the trip. Please try again.");
        }
    } catch (error) {
        console.error("Error al crear nueva lista:", error);
        alert("An error occurred while creating the trip. Please try again.");
    }
}

// Ir a la vista de detalle de una lista
// Verifica que la lista exista antes de navegar
function verLista(id) {
    try {
        // Verificar que la lista existe antes de navegar
        const listaExistente = listasOrdenadas.value.find(l => l.id === id);
        if (!listaExistente) {
            console.error('Lista no encontrada:', id);
            alert("The selected list was not found.");
            return;
        }

        console.log("Navegando a lista:", id);
        router.push({ name: 'TripListDetail', params: { id } });
    } catch (error) {
        console.error("Error al navegar a la lista:", error);
        alert("An error occurred while opening the list. Please try again.");
    }
}

// Manejar inicio de sesión exitoso
// Cierra el modal de autenticación y abre el modal de nueva lista
function handleLoginSuccess() {
    showAuthModal.value = false;
    // Mostrar el modal de nueva lista después de iniciar sesión
    setTimeout(() => {
        abrirModalNuevaLista();
    }, 500);
}

// Cambiar el filtro actual
// Actualiza la vista para mostrar todos, próximos o pasados
function cambiarFiltro(filtro) {
    filtroActual.value = filtro;
}

// Verificar viajes y enviar notificaciones si es necesario
// Esta función es la que activa el envío de correos electrónicos
async function verificarViajesYNotificar() {
    if (isUserAuthenticated()) {
        try {
            // Esta llamada verifica las fechas de los viajes y envía
            // correos de recordatorio o felicitación según corresponda
            await checkTripsAndNotify();
            // No mostramos notificación en la UI para no interrumpir la experiencia del usuario
            console.log('Verificación de viajes completada');
        } catch (error) {
            console.error('Error al verificar viajes:', error);
        }
    }
}

// Recargar listas
// Actualiza el estado isLoading durante la carga
async function recargarListas() {
    try {
        isLoading.value = true;
        await cargarListas();
        console.log("Listas recargadas:", tripLists.value.length);
    } catch (error) {
        console.error("Error al recargar listas:", error);
    } finally {
        isLoading.value = false;
    }
}

// Hook de ciclo de vida: Se ejecuta cuando el componente se monta
onMounted(async () => {
    // Recargar listas al montar el componente
    await recargarListas();

    // Si no hay autenticación, mostrar modal de login
    if (!isUserAuthenticated()) {
        showAuthModal.value = true;
    } else {
        // Verificar viajes y enviar notificaciones si es necesario
        // Esta es la llamada que activa el envío de correos
        verificarViajesYNotificar();
    }
});
</script>

<template>
    <div class="trip-lists-container">
        <div class="container py-4">
            <!-- Cabecera de la página con título y contador de viajes -->
            <div class="countries-header">
                <h1>My Trips</h1>
                <p v-if="listasFiltradas.length > 0">Organize your {{ listasFiltradas.length }} trips</p>
            </div>

            <!-- Sección de filtros -->
            <div class="favorites-filters">
                <!-- Buscador de viajes (similar al buscador de países) -->
                <div class="search-filter">
                    <i class="bi bi-search"></i>
                    <input type="text" placeholder="Search by trip name..." class="form-control" />
                </div>

                <!-- Filtro por tipo de viaje (similar al filtro por continente) -->
                <div class="continent-filters">
                    <span class="filter-label">Filter by status:</span>
                    <div class="continent-buttons">
                        <!-- Botones para cada tipo de viaje con iconos -->
                        <button class="continent-btn" :class="{ active: filtroActual === 'todos' }"
                            @click="cambiarFiltro('todos')">
                            <i class="bi bi-grid-3x3-gap-fill"></i>
                            All
                        </button>
                        <button class="continent-btn" :class="{ active: filtroActual === 'proximos' }"
                            @click="cambiarFiltro('proximos')">
                            <i class="bi bi-calendar-check"></i>
                            Upcoming
                        </button>
                        <button class="continent-btn" :class="{ active: filtroActual === 'pasados' }"
                            @click="cambiarFiltro('pasados')">
                            <i class="bi bi-calendar-x"></i>
                            Past
                        </button>
                    </div>
                </div>
            </div>

            <!-- Botón flotante para agregar nuevo viaje -->
            <button class="btn-add-trip" @click="abrirModalNuevaLista">
                <span class="btn-text">New Trip</span>
                <span class="btn-icon"><i class="bi bi-plus-lg"></i></span>
            </button>

            <!-- Spinner de carga -->
            <div v-if="isLoading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>

            <!-- Mensaje cuando no hay listas -->
            <div v-else-if="!hayListas" class="text-center py-5">
                <div class="empty-state">
                    <div class="empty-illustration mb-4">
                        <i class="bi bi-suitcase display-1"></i>
                    </div>
                    <h3 v-if="filtroActual === 'todos'">You don't have any trips</h3>
                    <h3 v-else-if="filtroActual === 'proximos'">You don't have upcoming trips</h3>
                    <h3 v-else>You don't have past trips</h3>

                    <p class="text-muted mb-4" v-if="filtroActual === 'todos' || filtroActual === 'proximos'">
                        Create your first trip to start organizing
                    </p>
                    <p class="text-muted mb-4" v-else>
                        Your past trips will appear here
                    </p>

                    <button class="btn btn-primary btn-lg" @click="abrirModalNuevaLista">
                        <i class="bi bi-plus-lg me-2"></i> New Trip
                    </button>
                </div>
            </div>

            <!-- Lista de viajes -->
            <div v-else class="trip-cards">
                <div v-for="lista in listasFiltradas" :key="lista.id" class="trip-card" @click="verLista(lista.id)">
                    <div class="trip-card-header">
                        <div class="trip-date">
                            <span class="trip-day">{{ new Date(lista.fechaInicio).getDate() }}</span>
                            <span class="trip-month">{{ new Date(lista.fechaInicio).toLocaleString('en-US', {
                                month:
                                    'short'
                            }) }}</span>
                        </div>
                        <div class="trip-badge"
                            :class="diasRestantes(lista.fechaInicio) === 'Today!' ? 'trip-badge-today' : ''">
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
                                <span>{{lista.items && lista.items.filter(item => item.completado).length || 0}}/{{
                                    lista.items ? lista.items.length : 0 }}</span>
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
                        <h5 class="modal-title">New Trip</h5>
                        <button type="button" class="btn-close" @click="showNewListModal = false"></button>
                    </div>
                    <div class="modal-body">
                        <form @submit.prevent="crearNuevaLista">
                            <div class="mb-3">
                                <label for="nombreViaje" class="form-label">Where are you going?</label>
                                <input type="text" class="form-control form-control-lg"
                                    :class="{ 'is-invalid': formErrors.nombre }" id="nombreViaje"
                                    v-model="nuevaLista.nombre" placeholder="Ex: Vacation in Barcelona" autofocus>
                                <div class="invalid-feedback">{{ formErrors.nombre }}</div>
                            </div>

                            <div class="mb-3">
                                <label for="destinoViaje" class="form-label">Destination</label>
                                <div class="input-group">
                                    <span class="input-group-text"><i class="bi bi-geo-alt"></i></span>
                                    <input type="text" class="form-control"
                                        :class="{ 'is-invalid': formErrors.destino }" id="destinoViaje"
                                        v-model="nuevaLista.destino" placeholder="Ex: Barcelona, Spain">
                                </div>
                                <div class="invalid-feedback">{{ formErrors.destino }}</div>
                            </div>

                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="fechaInicio" class="form-label">Start Date</label>
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="bi bi-calendar-event"></i></span>
                                        <input type="date" class="form-control"
                                            :class="{ 'is-invalid': formErrors.fechaInicio }" id="fechaInicio"
                                            v-model="nuevaLista.fechaInicio">
                                    </div>
                                    <div class="invalid-feedback">{{ formErrors.fechaInicio }}</div>
                                </div>

                                <div class="col-md-6 mb-3">
                                    <label for="fechaFin" class="form-label">End Date</label>
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
                        <button type="button" class="btn btn-link" @click="showNewListModal = false">Cancel</button>
                        <button type="button" class="btn btn-primary" @click="crearNuevaLista">Create Trip</button>
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
/* Estilos para el contenedor principal */
.trip-lists-container {
    min-height: 80vh;
    padding-top: 2rem;
    padding-bottom: 5rem;
    background-color: #f8f9fa;
}

/* Estilos para la ilustración del encabezado */
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

/* Estilos para el contenedor del encabezado */
.header-container {
    position: relative;
    padding-top: 1rem;
}

/* Estilos para el botón de agregar viaje */
.btn-add-trip {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    display: flex;
    align-items: center;
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%);
    color: white;
    border: none;
    border-radius: 50px;
    padding: 0.75rem 1.5rem;
    font-weight: 600;
    box-shadow: 0 4px 15px rgba(var(--color-primary-rgb), 0.3);
    transition: all 0.3s ease;
    z-index: 100;
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

/* Responsive para el botón - Versión móvil solo con "+" */
@media (max-width: 767px) {
    .btn-add-trip {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        padding: 0;
        justify-content: center;
    }

    .btn-text {
        display: none;
    }

    .btn-icon {
        width: 100%;
        height: 100%;
        background-color: transparent;
        font-size: 1.5rem;
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

/* Estilos para la cabecera de la página (estilo Countries) */
.countries-header {
    margin-bottom: 2.5rem;
    text-align: center;
    position: relative;
}

/* Estilos para el título principal */
.countries-header h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    color: var(--color-primary, #3a506b);
    font-weight: 700;
    position: relative;
    display: inline-block;
}

/* Línea decorativa debajo del título */
.countries-header h1::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 4px;
    background-color: var(--color-accent, #ff6b6b);
    border-radius: 2px;
}

/* Estilos para el párrafo de la cabecera */
.countries-header p {
    color: #6c757d;
    font-size: 1.1rem;
    margin-top: 1rem;
}

/* Estilos para el contenedor de filtros */
.favorites-filters {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    margin-bottom: 2rem;
    background-color: #f8f9fa;
    padding: 1.25rem;
    border-radius: 12px;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
}

/* Estilos para el filtro de búsqueda */
.search-filter {
    flex: 1;
    position: relative;
}

/* Posicionamiento del icono de búsqueda */
.search-filter i {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: #6c757d;
}

/* Estilos para el campo de búsqueda */
.search-filter input {
    padding: 0.75rem 1rem 0.75rem 40px;
    border-radius: 30px;
    border: 1px solid #e0e0e0;
    width: 100%;
    font-size: 0.95rem;
    transition: all 0.3s ease;
}

/* Estilos para el campo de búsqueda cuando está enfocado */
.search-filter input:focus {
    outline: none;
    border-color: var(--color-primary, #3a506b);
    box-shadow: 0 0 0 3px rgba(58, 80, 107, 0.1);
}

/* Estilos para los filtros de continente */
.continent-filters {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

/* Etiqueta para el filtro de continentes */
.filter-label {
    font-size: 0.9rem;
    color: #6c757d;
    font-weight: 500;
}

/* Contenedor para los botones de continente */
.continent-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

/* Estilos para los botones de continente */
.continent-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    border: 1px solid #e0e0e0;
    background-color: white;
    color: #6c757d;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

/* Estilos para los iconos en los botones de continente */
.continent-btn i {
    font-size: 0.85rem;
}

/* Efecto hover para los botones de continente */
.continent-btn:hover {
    background-color: #f0f0f0;
    border-color: #d0d0d0;
}

/* Estilos para el botón de continente activo/seleccionado */
.continent-btn.active {
    background-color: var(--color-primary, #3a506b);
    color: white;
    border-color: var(--color-primary, #3a506b);
}

/* Ajustes responsivos para el header estilo Countries */
@media (max-width: 768px) {
    .countries-header h1 {
        font-size: 1.8rem;
    }

    .countries-header p {
        font-size: 1rem;
    }

    .favorites-filters {
        padding: 1rem;
    }

    .continent-buttons {
        gap: 0.4rem;
    }

    .continent-btn {
        padding: 0.35rem 0.7rem;
        font-size: 0.8rem;
    }
}
</style>