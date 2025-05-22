<template>
  <div v-if="cargando" class="loading-container">
    <div class="loading-spinner"></div>
    <p>Cargando detalles del viaje...</p>
  </div>

  <div v-else-if="error" class="error-container">
    <p>{{ error }}</p>
    <button @click="cargarLista" class="btn-retry">Intentar de nuevo</button>
  </div>

  <div v-else-if="lista" class="trip-detail-container">
    <!-- Cabecera -->
    <header class="trip-header">
      <div class="trip-header-content">
        <div class="trip-title-section">
          <div class="title-with-back">
            <button @click="volverAtras" class="btn-back">
              <font-awesome-icon icon="arrow-left" />
            </button>
            <h1 class="trip-title">{{ lista.nombre }}</h1>
          </div>
          <div class="trip-actions">
            <button @click="editarLista" class="btn-icon-text">
              <font-awesome-icon icon="edit" /> Editar
            </button>
          </div>
        </div>
        <div class="trip-meta">
          <div class="trip-destination">
            <font-awesome-icon icon="map-marker-alt" />
            {{ lista.destino }}
          </div>
          <div class="trip-dates">
            <font-awesome-icon icon="calendar-alt" />
            {{ formatearFecha(lista.fechaInicio) }} - {{ formatearFecha(lista.fechaFin) }}
          </div>
        </div>
      </div>
    </header>

    <!-- Progreso -->
    <div class="trip-progress-container">
      <div class="progress-header">
        <h2>Progreso del viaje</h2>
        <div class="progress-percentage">{{ calcularPorcentajeCompletado() }}%</div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${calcularPorcentajeCompletado()}%` }" :class="{
          'progress-low': calcularPorcentajeCompletado() < 30,
          'progress-medium': calcularPorcentajeCompletado() >= 30 && calcularPorcentajeCompletado() < 70,
          'progress-high': calcularPorcentajeCompletado() >= 70
        }"></div>
      </div>
      <div class="progress-stats">
        <div class="stat">
          <div class="stat-value">{{ itemsCompletados }}</div>
          <div class="stat-label">Completados</div>
        </div>
        <div class="stat">
          <div class="stat-value">{{ itemsPendientes }}</div>
          <div class="stat-label">Pendientes</div>
        </div>
        <div class="stat">
          <div class="stat-value">{{ diasRestantes }}</div>
          <div class="stat-label">{{ diasRestantes === 1 ? 'Día' : 'Días' }} restantes</div>
        </div>
      </div>
    </div>

    <!-- Lista de elementos -->
    <div class="items-container">
      <div class="items-header">
        <div class="items-header-top">
          <h2>¿Qué necesitas para tu viaje?</h2>
          <button @click="mostrarModalCrearItem" class="btn-add-item">
            <font-awesome-icon icon="plus" /> Añadir
          </button>
        </div>

        <!-- Filtro de categorías -->
        <div class="categories-filter">
          <button @click="mostrarTodasCategorias = true; categoriaSeleccionada = ''" class="category-pill"
            :class="{ 'category-selected': mostrarTodasCategorias }">
            <font-awesome-icon icon="list" /> Todos
          </button>
          <button v-for="cat in categorias" :key="cat.id" @click="seleccionarCategoria(cat.id)" class="category-pill"
            :class="{ 'category-selected': categoriaSeleccionada === cat.id }">
            <font-awesome-icon :icon="cat.icon" /> {{ cat.nombre }}
          </button>
        </div>
      </div>

      <!-- Elementos -->
      <div v-if="itemsFiltrados.length === 0" class="empty-items">
        <div class="empty-illustration">
          <font-awesome-icon icon="suitcase-rolling" />
        </div>
        <p>No hay elementos {{ !mostrarTodasCategorias && categoriaSeleccionada ? `en la categoría
          ${obtenerNombreCategoria(categoriaSeleccionada)}` : 'en tu lista' }}</p>
        <p class="empty-hint">Haz clic en el botón <strong>"Añadir"</strong> en la parte superior para comenzar a crear
          tu lista.</p>
      </div>

      <div v-else class="items-list">
        <div v-for="item in itemsFiltrados" :key="item.id" class="item-card"
          :class="{ 'item-completed': item.completado }">
          <div class="item-checkbox">
            <input type="checkbox" :checked="item.completado" @change="toggleItemCompletado(item)"
              :id="`item-${item.id}`" />
            <label :for="`item-${item.id}`"></label>
          </div>
          <div class="item-content" @click="editarItem(item)">
            <div class="item-text">{{ item.texto }}</div>
            <div class="item-details">
              <div v-if="item.categoria" class="item-category">
                <font-awesome-icon :icon="obtenerIconoCategoria(item.categoria)" />
                {{ obtenerNombreCategoria(item.categoria) }}
              </div>
              <div v-if="item.notas" class="item-notes">
                <font-awesome-icon icon="sticky-note" /> {{ item.notas }}
              </div>
            </div>
          </div>
          <div class="item-actions">
            <button @click.stop="editarItem(item)" class="btn-icon" title="Editar">
              <font-awesome-icon icon="edit" />
            </button>
            <button @click.stop="eliminarItem(item)" class="btn-icon" title="Eliminar">
              <font-awesome-icon icon="trash" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal para crear/editar item -->
  <div v-if="mostrarModal" class="modal-overlay" @click="cerrarModal">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h2>{{ modoEdicion ? 'Editar elemento' : 'Añadir a tu lista' }}</h2>
        <button @click="cerrarModal" class="btn-close">
          <font-awesome-icon icon="times" />
        </button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="guardarItem">
          <div class="form-group">
            <label for="texto">¿Qué necesitas llevar?</label>
            <input type="text" id="texto" v-model="itemActual.texto" required
              placeholder="Ej. Pasaporte, cargador, cámara..." class="form-input" autofocus />
          </div>

          <div class="form-group">
            <label>Categoría</label>
            <div class="category-selector">
              <div v-for="cat in categoriasList" :key="cat.id" @click="itemActual.categoria = cat.id"
                class="category-option" :class="{ 'category-option-selected': itemActual.categoria === cat.id }">
                <font-awesome-icon :icon="cat.icon" />
                <span>{{ cat.nombre }}</span>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="notas">Notas adicionales (opcional)</label>
            <textarea id="notas" v-model="itemActual.notas" placeholder="Añade detalles importantes..."
              class="form-textarea"></textarea>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="itemActual.completado" />
              <span>Ya tengo este elemento</span>
            </label>
          </div>

          <div class="form-actions">
            <button type="button" @click="cerrarModal" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-primary">
              {{ modoEdicion ? 'Guardar cambios' : 'Añadir a mi lista' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Modal para editar lista -->
  <div v-if="mostrarModalLista" class="modal-overlay" @click="cerrarModalLista">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h2>Editar viaje</h2>
        <button @click="cerrarModalLista" class="btn-close">
          <font-awesome-icon icon="times" />
        </button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="guardarLista">
          <div class="form-group">
            <label for="nombre">Nombre del viaje</label>
            <input type="text" id="nombre" v-model="listaEditada.nombre" required placeholder="Ej. Vacaciones de verano"
              class="form-input" />
          </div>
          <div class="form-group">
            <label for="destino">Destino</label>
            <input type="text" id="destino" v-model="listaEditada.destino" required placeholder="Ej. Barcelona, España"
              class="form-input" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="fechaInicio">Fecha de inicio</label>
              <input type="date" id="fechaInicio" v-model="listaEditada.fechaInicio" required class="form-input" />
            </div>
            <div class="form-group">
              <label for="fechaFin">Fecha de fin</label>
              <input type="date" id="fechaFin" v-model="listaEditada.fechaFin" required class="form-input" />
            </div>
          </div>
          <div class="form-group">
            <label for="descripcion">Descripción (opcional)</label>
            <textarea id="descripcion" v-model="listaEditada.descripcion" placeholder="Describe tu viaje..."
              class="form-textarea"></textarea>
          </div>
          <div class="form-actions">
            <button type="button" @click="cerrarModalLista" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-primary">Guardar cambios</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Sistema de notificaciones -->
  <div class="notifications-container">
    <div v-for="(notification, index) in notifications" :key="index" class="notification" :class="notification.type">
      <div class="notification-icon">
        <font-awesome-icon :icon="notification.icon" />
      </div>
      <div class="notification-content">
        <div class="notification-title">{{ notification.title }}</div>
        <div class="notification-message">{{ notification.message }}</div>
      </div>
      <button @click="removeNotification(index)" class="notification-close">
        <font-awesome-icon icon="times" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTripLists } from '@/composables/useTripLists';
import { safeGoBack } from '@/utils/navegation';

// Router
const route = useRoute();
const router = useRouter();

// Estado
const lista = ref(null);
const cargando = ref(true);
const error = ref(null);
const mostrarModal = ref(false);
const mostrarModalLista = ref(false);
const modoEdicion = ref(false);
const itemActual = ref({
  texto: '',
  categoria: 'otros',
  notas: '',
  completado: false
});
const listaEditada = ref({});
const mostrarTodasCategorias = ref(true);
const categoriaSeleccionada = ref('');
const notifications = ref([]);

// Control de notificaciones de guardado automático
let lastSaveNotification = 0;
const NOTIFICATION_COOLDOWN = 3000; // 3 segundos entre notificaciones

// Composables
const {
  obtenerLista,
  actualizarLista,
  agregarItem,
  actualizarItem,
  eliminarItem: eliminarItemLista,
  toggleCompletado,
  categorias: categoriasList,
  obtenerCategoria
} = useTripLists();

// Cargar lista al montar el componente
const cargarLista = async () => {
  cargando.value = true;
  error.value = null;

  try {
    // Verificar que el ID existe en la ruta
    const id = route.params.id;
    if (!id) {
      throw new Error('ID de lista no proporcionado');
    }

    console.log("Cargando lista con ID:", id);

    // Obtener la lista
    const resultado = obtenerLista(id);

    if (!resultado) {
      console.error("Lista no encontrada con ID:", id);
      throw new Error('No se encontró la lista de viaje');
    }

    lista.value = resultado;
    console.log("Lista cargada:", lista.value);

    // Asegurarse de que items sea un array
    if (!lista.value.items) {
      lista.value.items = [];
    }

  } catch (err) {
    console.error('Error al cargar lista:', err);
    error.value = 'No se pudo cargar la lista de viaje. Por favor, intenta de nuevo.';
  } finally {
    cargando.value = false;
  }
}

onMounted(() => {
  cargarLista();
});

// Limpiar al desmontar
onUnmounted(() => {
  // Limpiar cualquier recurso si es necesario
});

// Observar cambios en la lista para mostrar notificación de guardado automático
watch(
  () => lista.value,
  () => {
    if (lista.value) {
      const now = Date.now();
      if (now - lastSaveNotification > NOTIFICATION_COOLDOWN) {
        showNotification({
          type: 'success',
          icon: 'user-check',
          title: 'Guardado automático',
          message: 'Tus cambios se guardan automáticamente'
        });
        lastSaveNotification = now;
      }
    }
  },
  { deep: true }
);

// Computados
const itemsCompletados = computed(() => {
  if (!lista.value || !lista.value.items) return 0;
  return lista.value.items.filter(item => item.completado).length;
});

const itemsPendientes = computed(() => {
  if (!lista.value || !lista.value.items) return 0;
  return lista.value.items.filter(item => !item.completado).length;
});

const diasRestantes = computed(() => {
  if (!lista.value || !lista.value.fechaInicio) return 0;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const fechaInicio = new Date(lista.value.fechaInicio);
  fechaInicio.setHours(0, 0, 0, 0);


  if (fechaInicio < hoy) return 0;

  return Math.ceil((fechaInicio - hoy) / (1000 * 60 * 60 * 24));
});

const categorias = computed(() => {
  // Convertir los iconos de texto a objetos de icono para Font Awesome
  return categoriasList.map(cat => ({
    ...cat,
    icon: cat.icon // Asumimos que los iconos ya están en el formato correcto
  }));
});

const itemsFiltrados = computed(() => {
  if (!lista.value || !lista.value.items) return [];

  if (mostrarTodasCategorias.value || !categoriaSeleccionada.value) {
    return lista.value.items;
  }

  return lista.value.items.filter(item => item.categoria === categoriaSeleccionada.value);
});

// Métodos
function calcularPorcentajeCompletado() {
  if (!lista.value || !lista.value.items || lista.value.items.length === 0) return 0;
  return Math.round((itemsCompletados.value / lista.value.items.length) * 100);
}

function formatearFecha(fecha) {
  if (!fecha) return '';
  return new Date(fecha).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function mostrarModalCrearItem() {
  modoEdicion.value = false;

  // Usar la categoría seleccionada si existe, de lo contrario usar 'otros'
  const categoriaInicial = !mostrarTodasCategorias.value && categoriaSeleccionada.value
    ? categoriaSeleccionada.value
    : 'otros';

  itemActual.value = {
    texto: '',
    categoria: categoriaInicial,
    notas: '',
    completado: false
  };

  mostrarModal.value = true;
}

function editarItem(item) {
  modoEdicion.value = true;
  itemActual.value = { ...item };
  mostrarModal.value = true;
}

async function guardarItem() {
  if (!lista.value) return;

  try {
    if (!itemActual.value.texto.trim()) {
      alert("El texto del elemento es obligatorio");
      return;
    }

    if (modoEdicion.value && itemActual.value.id) {
      // Actualizar item existente
      console.log("Actualizando item:", itemActual.value);
      const resultado = actualizarItem(lista.value.id, itemActual.value.id, itemActual.value);
      if (!resultado) {
        throw new Error("No se pudo actualizar el elemento");
      }

      // Mostrar notificación
      showNotification({
        type: 'success',
        icon: 'check-circle',
        title: 'Elemento actualizado',
        message: 'El elemento se ha actualizado correctamente'
      });
    } else {
      // Crear nuevo item
      console.log("Creando nuevo item:", itemActual.value);
      const resultado = agregarItem(
        lista.value.id,
        itemActual.value.texto,
        itemActual.value.categoria,
        1,
        itemActual.value.notas // Añadir las notas como parámetro
      );
      if (!resultado) {
        throw new Error("No se pudo crear el elemento");
      }

      // Mostrar notificación
      showNotification({
        type: 'success',
        icon: 'check-circle',
        title: 'Elemento añadido',
        message: 'El elemento se ha añadido correctamente a tu lista'
      });
    }

    cerrarModal();
    await cargarLista();
  } catch (err) {
    console.error('Error al guardar item:', err);

    // Mostrar notificación de error
    showNotification({
      type: 'error',
      icon: 'exclamation-circle',
      title: 'Error',
      message: 'Ocurrió un error al guardar el elemento. Por favor, intenta de nuevo.'
    });
  }
}

async function eliminarItem(item) {
  if (!lista.value || !item.id) return;

  if (!confirm("¿Estás seguro de que deseas eliminar este elemento?")) {
    return;
  }

  try {
    console.log("Eliminando item:", item.id);
    const resultado = eliminarItemLista(lista.value.id, item.id);
    if (!resultado) {
      throw new Error("No se pudo eliminar el elemento");
    }

    // Mostrar notificación
    showNotification({
      type: 'info',
      icon: 'trash',
      title: 'Elemento eliminado',
      message: 'El elemento se ha eliminado correctamente'
    });

    await cargarLista();
  } catch (err) {
    console.error('Error al eliminar item:', err);

    // Mostrar notificación de error
    showNotification({
      type: 'error',
      icon: 'exclamation-circle',
      title: 'Error',
      message: 'Ocurrió un error al eliminar el elemento. Por favor, intenta de nuevo.'
    });
  }
}

async function toggleItemCompletado(item) {
  if (!lista.value) return;

  try {
    console.log("Cambiando estado de item:", item.id);
    const resultado = toggleCompletado(lista.value.id, item.id);
    if (!resultado) {
      throw new Error("No se pudo cambiar el estado del elemento");
    }

    // Mostrar notificación
    showNotification({
      type: 'success',
      icon: 'check-circle',
      title: 'Estado actualizado',
      message: item.completado ? 'Elemento marcado como pendiente' : 'Elemento marcado como completado'
    });

    await cargarLista();
  } catch (err) {
    console.error('Error al actualizar estado del item:', err);

    // Mostrar notificación de error
    showNotification({
      type: 'error',
      icon: 'exclamation-circle',
      title: 'Error',
      message: 'Ocurrió un error al actualizar el estado del elemento. Por favor, intenta de nuevo.'
    });
  }
}

function seleccionarCategoria(categoria) {
  mostrarTodasCategorias.value = false;
  if (categoriaSeleccionada.value === categoria) {
    categoriaSeleccionada.value = '';
    mostrarTodasCategorias.value = true;
  } else {
    categoriaSeleccionada.value = categoria;
  }
}

function obtenerNombreCategoria(categoriaId) {
  const categoria = obtenerCategoria(categoriaId);
  return categoria ? categoria.nombre : 'Sin categoría';
}

function obtenerIconoCategoria(categoriaId) {
  const categoria = obtenerCategoria(categoriaId);
  return categoria ? categoria.icon : 'box';
}

function editarLista() {
  if (!lista.value) return;

  listaEditada.value = { ...lista.value };
  mostrarModalLista.value = true;
}

async function guardarLista() {
  if (!lista.value) return;

  try {
    if (!listaEditada.value.nombre.trim()) {
      alert("El nombre del viaje es obligatorio");
      return;
    }

    if (!listaEditada.value.destino.trim()) {
      alert("El destino es obligatorio");
      return;
    }

    console.log("Actualizando lista:", listaEditada.value);
    const resultado = actualizarLista(lista.value.id, listaEditada.value);
    if (!resultado) {
      throw new Error("No se pudo actualizar la lista");
    }

    // Mostrar notificación
    showNotification({
      type: 'success',
      icon: 'check-circle',
      title: 'Viaje actualizado',
      message: 'Los detalles del viaje se han actualizado correctamente'
    });

    cerrarModalLista();
    await cargarLista();
  } catch (err) {
    console.error('Error al guardar lista:', err);

    // Mostrar notificación de error
    showNotification({
      type: 'error',
      icon: 'exclamation-circle',
      title: 'Error',
      message: 'Ocurrió un error al guardar los cambios. Por favor, intenta de nuevo.'
    });
  }
}

function cerrarModal() {
  mostrarModal.value = false;
}

function cerrarModalLista() {
  mostrarModalLista.value = false;
}

function volverAtras() {
  safeGoBack(router, { name: 'TripLists' });
}

// Sistema de notificaciones
function showNotification(notification) {
  notifications.value.push({
    ...notification,
    id: Date.now()
  });

  // Auto-eliminar después de 5 segundos
  setTimeout(() => {
    removeNotification(0);
  }, 5000);
}

function removeNotification(index) {
  notifications.value.splice(index, 1);
}
</script>

<style scoped>
/* Estilos generales */
.trip-detail-container {
  font-family: 'Roboto', sans-serif;
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px 80px;
  color: #333;
}

/* Estados de carga y error */
.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 0;
  text-align: center;
}

.loading-spinner {
  border: 4px solid #f3f4f6;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.btn-retry {
  margin-top: 20px;
  background-color: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-retry:hover {
  background-color: #2980b9;
}

/* Cabecera */
.trip-header {
  padding: 20px 0;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 30px;
}

.trip-header-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.trip-title-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.title-with-back {
  display: flex;
  align-items: center;
  gap: 15px;
}

.btn-back {
  background: none;
  border: none;
  color: #3498db;
  font-size: 20px;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-back:hover {
  background-color: #f0f9ff;
  transform: translateX(-3px);
}

.trip-title {
  font-size: 32px;
  color: #3498db;
  margin: 0;
  font-weight: 700;
}

.trip-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  color: #666;
  font-size: 16px;
}

.trip-destination,
.trip-dates {
  display: flex;
  align-items: center;
  gap: 8px;
}

.trip-destination i,
.trip-dates i {
  color: #3498db;
}

.trip-actions {
  display: flex;
  gap: 10px;
}

.btn-icon-text {
  background-color: #f8f9fa;
  color: #555;
  border: 1px solid #ddd;
  padding: 8px 15px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-icon-text:hover {
  background-color: #e9ecef;
  color: #333;
}

.btn-icon-text i {
  font-size: 14px;
}

/* Progreso */
.trip-progress-container {
  background-color: #f8f9fa;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 35px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.progress-header h2 {
  margin: 0;
  font-size: 22px;
  color: #333;
  font-weight: 600;
}

.progress-percentage {
  font-size: 28px;
  font-weight: bold;
  color: #3498db;
}

.progress-bar {
  height: 12px;
  background-color: #e9ecef;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 25px;
}

.progress-fill {
  height: 100%;
  background-color: #2ecc71;
  transition: width 0.5s ease-in-out;
}

.progress-low {
  background-color: #e74c3c;
}

.progress-medium {
  background-color: #f39c12;
}

.progress-high {
  background-color: #2ecc71;
}

.progress-stats {
  display: flex;
  justify-content: space-around;
  text-align: center;
}

.stat {
  flex: 1;
  padding: 10px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.stat:hover {
  background-color: #e9ecef;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

/* Lista de elementos */
.items-container {
  position: relative;
}

.items-header {
  margin-bottom: 25px;
}

.items-header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.items-header h2 {
  margin: 0;
  font-size: 24px;
  color: #333;
  font-weight: 600;
}

.btn-add-item {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-add-item:hover {
  background-color: #2980b9;
  transform: translateY(-2px);
}

.btn-add-item:active {
  transform: translateY(0);
}

/* Categorías */
.categories-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 25px;
}

.category-pill {
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 20px;
  padding: 8px 15px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-pill:hover {
  background-color: #e9ecef;
}

.category-pill i {
  font-size: 14px;
}

.category-selected {
  background-color: #3498db;
  border-color: #3498db;
  color: white;
}

.category-selected:hover {
  background-color: #2980b9;
}

/* Lista vacía */
.empty-items {
  text-align: center;
  padding: 40px 0;
  color: #666;
  background-color: #f8f9fa;
  border-radius: 12px;
  margin-top: 20px;
}

.empty-illustration {
  font-size: 60px;
  color: #bbb;
  margin-bottom: 20px;
}

.empty-items p {
  font-size: 18px;
  margin-bottom: 20px;
}

.empty-hint {
  font-size: 14px;
  color: #777;
  margin-top: 10px;
}

.empty-items button {
  margin-top: 15px;
}

/* Lista de elementos */
.items-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.item-card {
  display: flex;
  align-items: flex-start;
  background-color: white;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  padding: 18px;
  transition: all 0.3s;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.item-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.item-completed {
  background-color: #f8f9fa;
  border-color: #e9ecef;
}

.item-completed .item-text {
  text-decoration: line-through;
  color: #aaa;
}

.item-checkbox {
  margin-right: 15px;
  padding-top: 2px;
}

.item-checkbox input[type="checkbox"] {
  display: none;
}

.item-checkbox label {
  display: inline-block;
  width: 24px;
  height: 24px;
  border: 2px solid #ddd;
  border-radius: 6px;
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
}

.item-checkbox label:hover {
  border-color: #3498db;
}

.item-checkbox input[type="checkbox"]:checked+label {
  background-color: #3498db;
  border-color: #3498db;
}

.item-checkbox input[type="checkbox"]:checked+label::after {
  content: '';
  position: absolute;
  left: 8px;
  top: 4px;
  width: 6px;
  height: 12px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.item-content {
  flex: 1;
  cursor: pointer;
}

.item-text {
  font-size: 18px;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.item-details {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.item-category {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background-color: #e9f7fe;
  color: #3498db;
  font-size: 13px;
  padding: 4px 10px;
  border-radius: 15px;
}

.item-notes {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #777;
  font-size: 13px;
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  color: #aaa;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.2s;
}

.btn-icon:hover {
  background-color: #f8f9fa;
  color: #333;
}

/* Botones principales */
.btn-primary {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-primary:hover {
  background-color: #2980b9;
  transform: translateY(-2px);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-secondary {
  background-color: #f8f9fa;
  color: #555;
  border: 1px solid #ddd;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background-color: #e9ecef;
  color: #333;
}

/* Modales */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.modal-container {
  background-color: white;
  border-radius: 12px;
  width: 90%;
  max-width: 550px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  padding: 20px 25px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 22px;
  color: #333;
  font-weight: 600;
}

.btn-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #aaa;
  font-size: 20px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-close:hover {
  background-color: #f8f9fa;
  color: #333;
}

.modal-body {
  padding: 25px;
}

.form-group {
  margin-bottom: 25px;
}

.form-row {
  display: flex;
  gap: 20px;
}

.form-row .form-group {
  flex: 1;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
  font-size: 16px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-weight: normal;
  color: #555;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #3498db;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  border-color: #3498db;
  outline: none;
}

.form-textarea {
  min-height: 120px;
  resize: vertical;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 30px;
}

/* Selector de categorías */
.category-selector {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.category-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 15px 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.category-option:hover {
  background-color: #f8f9fa;
}

.category-option i {
  font-size: 20px;
  color: #777;
}

.category-option span {
  font-size: 14px;
  color: #555;
}

.category-option-selected {
  background-color: #e9f7fe;
  border-color: #3498db;
}

.category-option-selected i,
.category-option-selected span {
  color: #3498db;
}

/* Sistema de notificaciones */
.notifications-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 350px;
}

.notification {
  display: flex;
  align-items: flex-start;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideInRight 0.3s ease-out;
  background-color: white;
  border-left: 4px solid #3498db;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.notification.success {
  border-left-color: #2ecc71;
}

.notification.error {
  border-left-color: #e74c3c;
}

.notification.info {
  border-left-color: #3498db;
}

.notification.warning {
  border-left-color: #f39c12;
}

.notification-icon {
  margin-right: 15px;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification.success .notification-icon {
  color: #2ecc71;
}

.notification.error .notification-icon {
  color: #e74c3c;
}

.notification.info .notification-icon {
  color: #3498db;
}

.notification.warning .notification-icon {
  color: #f39c12;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-weight: 600;
  margin-bottom: 5px;
  color: #333;
}

.notification-message {
  font-size: 14px;
  color: #666;
}

.notification-close {
  background: none;
  border: none;
  color: #aaa;
  cursor: pointer;
  padding: 5px;
  margin-left: 10px;
  font-size: 14px;
  transition: color 0.2s;
}

.notification-close:hover {
  color: #333;
}

/* Responsive */
@media (max-width: 768px) {
  .trip-title-section {
    flex-direction: column;
    align-items: flex-start;
  }

  .trip-actions {
    width: 100%;
    justify-content: space-between;
  }

  .progress-stats {
    flex-direction: column;
    gap: 15px;
  }

  .category-selector {
    grid-template-columns: repeat(2, 1fr);
  }

  .form-row {
    flex-direction: column;
    gap: 0;
  }

  .notifications-container {
    left: 20px;
    right: 20px;
    max-width: none;
  }
}

@media (max-width: 480px) {
  .category-selector {
    grid-template-columns: 1fr;
  }

  .item-details {
    flex-direction: column;
    gap: 5px;
  }

  .items-header-top {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .btn-add-item {
    align-self: flex-end;
  }

  .title-with-back {
    width: 100%;
  }
}
</style>
