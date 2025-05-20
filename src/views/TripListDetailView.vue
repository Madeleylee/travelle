<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTripLists } from '@/composables/useTripLists';
import { useAuth } from '@/composables/useAuth';
import AuthModal from '@/components/AuthModal.vue';

const route = useRoute();
const router = useRouter();
const { isUserAuthenticated } = useAuth();
const {
    obtenerLista,
    actualizarLista,
    eliminarLista,
    agregarItem,
    actualizarItem,
    eliminarItem,
    toggleCompletado,
    categorias,
    obtenerCategoria
} = useTripLists();

// ID de la lista actual
const listaId = ref(route.params.id);

// Estado para la lista actual
const lista = ref(null);
const isLoading = ref(true);
const error = ref(null);

// Estado para el modal de autenticación
const showAuthModal = ref(false);

// Estado para el formulario de nuevo elemento
const nuevoItem = ref({
    texto: '',
    categoria: 'otros',
    prioridad: 2
});

// Estado para edición de elemento
const itemEnEdicion = ref(null);

// Elementos filtrados
const elementosFiltrados = computed(() => {
    if (!lista.value || !lista.value.items) return [];
    return [...lista.value.items];
});

// Elementos agrupados por categoría
const elementosPorCategoria = computed(() => {
    if (!lista.value || !lista.value.items) return [];

    const grupos = {};

    // Inicializar grupos para todas las categorías
    categorias.forEach(cat => {
        grupos[cat.id] = {
            nombre: cat.nombre,
            icon: cat.icon,
            items: []
        };
    });

    // Agrupar elementos por categoría
    lista.value.items.forEach(item => {
        if (grupos[item.categoria]) {
            grupos[item.categoria].items.push(item);
        } else {
            grupos['otros'].items.push(item);
        }
    });

    // Convertir a array y filtrar categorías vacías
    return Object.values(grupos).filter(grupo => grupo.items.length > 0);
});

// Estadísticas
const estadisticas = computed(() => {
    if (!lista.value || !lista.value.items || lista.value.items.length === 0) {
        return {
            total: 0,
            completados: 0,
            pendientes: 0,
            porcentaje: 0
        };
    }

    const total = lista.value.items.length;
    const completados = lista.value.items.filter(item => item.completado).length;

    return {
        total,
        completados,
        pendientes: total - completados,
        porcentaje: Math.round((completados / total) * 100)
    };
});

// Días restantes para el viaje
const diasRestantes = computed(() => {
    if (!lista.value || !lista.value.fechaInicio) return 0;

    const hoy = new Date();
    const inicio = new Date(lista.value.fechaInicio);
    const diferencia = inicio - hoy;
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
});

// Texto para mostrar los días restantes
const textoTiempoRestante = computed(() => {
    if (!lista.value) return '';

    const dias = diasRestantes.value;

    if (dias < 0) {
        // El viaje ya pasó
        const diasPasados = Math.abs(dias);
        const fechaFin = new Date(lista.value.fechaFin);
        const hoy = new Date();

        if (hoy > fechaFin) {
            return 'Viaje finalizado';
        } else {
            return `Viaje en curso (día ${diasPasados + 1})`;
        }
    } else if (dias === 0) {
        return '¡El viaje es hoy!';
    } else if (dias === 1) {
        return 'El viaje es mañana';
    } else {
        return `Faltan ${dias} días`;
    }
});

// Formatear fecha
function formatearFecha(fecha) {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Cargar la lista
async function cargarLista() {
    isLoading.value = true;
    error.value = null;

    try {
        const listaEncontrada = obtenerLista(listaId.value);

        if (!listaEncontrada) {
            error.value = 'Lista no encontrada';
            router.push({ name: 'TripLists' });
            return;
        }

        lista.value = listaEncontrada;
    } catch (err) {
        console.error('Error al cargar la lista:', err);
        error.value = 'No se pudo cargar la lista';
    } finally {
        isLoading.value = false;
    }
}

// Agregar un nuevo elemento
function agregarNuevoItem() {
    if (!nuevoItem.value.texto.trim()) return;

    agregarItem(
        listaId.value,
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

    // Enfocar el input para añadir otro elemento rápidamente
    setTimeout(() => {
        document.getElementById('nuevoItemInput')?.focus();
    }, 100);
}

// Eliminar un elemento
function eliminarElemento(itemId) {
    eliminarItem(listaId.value, itemId);
}

// Marcar un elemento como completado o pendiente
function marcarCompletado(itemId) {
    toggleCompletado(listaId.value, itemId);
}

// Eliminar la lista
function eliminarListaActual() {
    if (confirm('¿Estás seguro de que deseas eliminar esta lista? Esta acción no se puede deshacer.')) {
        eliminarLista(listaId.value);
        router.push({ name: 'TripLists' });
    }
}

// Volver a la lista de viajes
function volverAListas() {
    router.push({ name: 'TripLists' });
}

// Manejar inicio de sesión exitoso
function handleLoginSuccess() {
    showAuthModal.value = false;
    cargarLista();
}

let initialAuthCheck = true;

onMounted(() => {
    cargarDatos();
});

async function cargarDatos() {
    // Verificar autenticación solo en la primera carga
    if (initialAuthCheck) {
        initialAuthCheck = false;
        if (!isUserAuthenticated()) {
            showAuthModal.value = true;
            return;
        }
    }
    cargarLista();
}

// Observar cambios en la ruta para recargar la lista
watch(() => route.params.id, (newId) => {
    if (newId) {
        listaId.value = newId;
        cargarLista();
    }
});
</script>

<template>
    <div class="trip-detail-container">
        <!-- Spinner de carga -->
        <div v-if="isLoading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
        </div>

        <!-- Mensaje de error -->
        <div v-else-if="error" class="alert alert-danger" role="alert">
            {{ error }}
            <button class="btn btn-outline-danger ms-3" @click="volverAListas">Volver a mis listas</button>
        </div>

        <!-- Contenido de la lista -->
        <div v-else-if="lista" class="trip-content">
            <!-- Encabezado -->
            <div class="trip-header">
                <button class="btn-back" @click="volverAListas">
                    <i class="bi bi-arrow-left"></i>
                </button>

                <div class="trip-header-content">
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
                </div>

                <div class="trip-countdown">
                    <div class="countdown-value">{{ diasRestantes >= 0 ? diasRestantes : '0' }}</div>
                    <div class="countdown-label">días</div>
                </div>
            </div>

            <!-- Barra de progreso -->
            <div class="progress-container">
                <div class="progress">
                    <div class="progress-bar" :class="estadisticas.porcentaje === 100 ? 'bg-success' : ''"
                        role="progressbar" :style="`width: ${estadisticas.porcentaje}%`"
                        :aria-valuenow="estadisticas.porcentaje" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
                <div class="progress-text">
                    <span>{{ estadisticas.completados }}/{{ estadisticas.total }} elementos</span>
                    <span>{{ estadisticas.porcentaje }}% completado</span>
                </div>
            </div>

            <!-- Formulario para agregar nuevo elemento -->
            <div class="add-item-form">
                <div class="input-group">
                    <span class="input-group-text">
                        <i class="bi bi-plus-circle"></i>
                    </span>
                    <input id="nuevoItemInput" type="text" class="form-control" v-model="nuevoItem.texto"
                        placeholder="Añadir elemento a la lista..." @keyup.enter="agregarNuevoItem">
                    <select class="form-select category-select" v-model="nuevoItem.categoria">
                        <option v-for="cat in categorias" :key="cat.id" :value="cat.id">
                            {{ cat.nombre }}
                        </option>
                    </select>
                    <button class="btn btn-primary" @click="agregarNuevoItem">
                        Añadir
                    </button>
                </div>
            </div>

            <!-- Lista de elementos por categoría -->
            <div class="items-container">
                <div v-for="grupo in elementosPorCategoria" :key="grupo.nombre" class="category-group">
                    <div class="category-header">
                        <i :class="`bi bi-${grupo.icon}`"></i>
                        <h2>{{ grupo.nombre }}</h2>
                    </div>

                    <div class="items-list">
                        <div v-for="item in grupo.items" :key="item.id" class="item-card"
                            :class="{ 'item-completed': item.completado }">
                            <div class="item-checkbox">
                                <input type="checkbox" :checked="item.completado" @change="marcarCompletado(item.id)"
                                    class="form-check-input">
                            </div>

                            <div class="item-content">
                                <div class="item-text" :class="{ 'text-decoration-line-through': item.completado }">
                                    {{ item.texto }}
                                </div>
                            </div>

                            <div class="item-actions">
                                <button class="btn-action" @click.stop="eliminarElemento(item.id)">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Mensaje cuando no hay elementos -->
                <div v-if="elementosFiltrados.length === 0" class="empty-items">
                    <div class="empty-illustration">
                        <i class="bi bi-list-check"></i>
                    </div>
                    <p>No hay elementos en esta lista</p>
                    <p class="text-muted">Añade elementos para tu viaje</p>
                </div>
            </div>

            <!-- Botón para eliminar lista -->
            <div class="delete-container">
                <button class="btn btn-outline-danger" @click="eliminarListaActual">
                    <i class="bi bi-trash me-2"></i> Eliminar lista
                </button>
            </div>
        </div>

        <!-- Modal de autenticación -->
        <AuthModal :visible="showAuthModal" @close="showAuthModal = false" @login-success="handleLoginSuccess" />
    </div>
</template>

<style scoped>
.trip-detail-container {
    min-height: 100vh;
    background-color: #f8f9fa;
    padding-bottom: 5rem;
}

/* Encabezado */
.trip-header {
    background-color: var(--color-primary);
    color: white;
    padding: 2rem 1rem;
    display: flex;
    align-items: center;
    position: relative;
}

.btn-back {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 1rem;
    transition: background-color 0.2s;
}

.btn-back:hover {
    background: rgba(255, 255, 255, 0.3);
}

.trip-header-content {
    flex: 1;
}

.trip-title {
    font-size: 1.75rem;
    margin-bottom: 0.5rem;
    font-weight: bold;
}

.trip-info {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    font-size: 0.9rem;
    opacity: 0.9;
}

.trip-destination,
.trip-dates {
    display: flex;
    align-items: center;
}

.trip-destination i,
.trip-dates i {
    margin-right: 0.5rem;
}

.trip-countdown {
    background: white;
    color: var(--color-primary);
    border-radius: 50%;
    width: 70px;
    height: 70px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.countdown-value {
    font-size: 1.5rem;
    font-weight: bold;
    line-height: 1;
}

.countdown-label {
    font-size: 0.8rem;
    text-transform: uppercase;
}

/* Barra de progreso */
.progress-container {
    background: white;
    padding: 1rem;
    margin: 0 1rem;
    border-radius: 0.5rem;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    margin-top: -1.5rem;
    position: relative;
    z-index: 10;
}

.progress {
    height: 10px;
    margin-bottom: 0.5rem;
    border-radius: 5px;
    background-color: #e9ecef;
}

.progress-bar {
    background-color: var(--color-primary);
    border-radius: 5px;
    transition: width 0.5s ease;
}

.progress-text {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: #6c757d;
}

/* Formulario para añadir elementos */
.add-item-form {
    padding: 1rem;
    margin: 1rem;
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.input-group {
    border-radius: 0.5rem;
    overflow: hidden;
}

.input-group-text {
    background-color: white;
    border-right: none;
}

.form-control {
    border-left: none;
    border-right: none;
    padding: 0.75rem 1rem;
}

.category-select {
    max-width: 150px;
    border-left: none;
}

.btn-primary {
    background-color: var(--color-primary);
    border-color: var(--color-primary);
}

.btn-primary:hover {
    background-color: var(--color-accent);
    border-color: var(--color-accent);
}

/* Lista de elementos */
.items-container {
    padding: 0 1rem;
}

.category-group {
    background: white;
    border-radius: 0.5rem;
    overflow: hidden;
    margin-bottom: 1rem;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.category-header {
    display: flex;
    align-items: center;
    padding: 1rem;
    background-color: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
}

.category-header i {
    margin-right: 0.75rem;
    color: var(--color-primary);
    font-size: 1.25rem;
}

.category-header h2 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #343a40;
}

.items-list {
    padding: 0.5rem 0;
}

.item-card {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #f1f3f5;
    transition: background-color 0.2s;
}

.item-card:last-child {
    border-bottom: none;
}

.item-card:hover {
    background-color: #f8f9fa;
}

.item-completed {
    background-color: #f8f9fa;
}

.item-checkbox {
    margin-right: 1rem;
}

.form-check-input {
    width: 1.25rem;
    height: 1.25rem;
    cursor: pointer;
}

.form-check-input:checked {
    background-color: var(--color-primary);
    border-color: var(--color-primary);
}

.item-content {
    flex: 1;
}

.item-text {
    transition: all 0.3s;
}

.text-decoration-line-through {
    color: #6c757d;
}

.item-actions {
    display: flex;
    gap: 0.5rem;
}

.btn-action {
    background: none;
    border: none;
    color: #6c757d;
    padding: 0.25rem;
    border-radius: 0.25rem;
    transition: color 0.2s, background-color 0.2s;
}

.btn-action:hover {
    color: #dc3545;
    background-color: #f8f9fa;
}

/* Estado vacío */
.empty-items {
    text-align: center;
    padding: 3rem 1rem;
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.empty-illustration {
    font-size: 3rem;
    color: var(--color-primary);
    opacity: 0.5;
    margin-bottom: 1rem;
}

/* Botón eliminar */
.delete-container {
    text-align: center;
    margin-top: 2rem;
}

.btn-outline-danger {
    border-color: #dc3545;
    color: #dc3545;
    padding: 0.5rem 1.5rem;
    border-radius: 0.5rem;
}

.btn-outline-danger:hover {
    background-color: #dc3545;
    color: white;
}

/* Responsive */
@media (max-width: 767px) {
    .trip-header {
        flex-direction: column;
        align-items: flex-start;
        padding: 1.5rem 1rem;
    }

    .btn-back {
        margin-bottom: 1rem;
    }

    .trip-countdown {
        position: absolute;
        top: 1.5rem;
        right: 1rem;
        width: 60px;
        height: 60px;
    }

    .trip-info {
        flex-direction: column;
        gap: 0.5rem;
    }

    .category-select {
        max-width: 100%;
        border-top: 1px solid #ced4da;
        border-left: 1px solid #ced4da;
    }

    .input-group {
        flex-wrap: wrap;
    }

    .input-group>.form-control {
        border-radius: 0;
        width: 100%;
    }

    .input-group>.btn {
        border-radius: 0;
        width: 100%;
        margin-top: 1px;
    }
}
</style>
