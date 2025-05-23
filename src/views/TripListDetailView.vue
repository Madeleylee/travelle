<template>
  <!-- Pantalla de carga mientras se obtienen los datos -->
  <div v-if="cargando" class="loading-container">
    <div class="loading-spinner"></div>
    <p>Loading trip details...</p>
  </div>

  <!-- Pantalla de error si hay problemas al cargar los datos -->
  <div v-else-if="error" class="error-container">
    <p>{{ error }}</p>
    <button @click="cargarLista" class="btn-retry">Try again</button>
  </div>

  <!-- Contenido principal cuando los datos están cargados -->
  <div v-else-if="lista" class="trip-detail-container">
    <!-- Cabecera con información del viaje -->
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
              <font-awesome-icon icon="edit" /> Edit
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

    <!-- Sección de progreso del viaje -->
    <div class="trip-progress-container">
      <div class="progress-header">
        <h2>Trip Progress</h2>
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
          <div class="stat-label">Completed</div>
        </div>
        <div class="stat">
          <div class="stat-value">{{ itemsPendientes }}</div>
          <div class="stat-label">Pending</div>
        </div>
        <div class="stat">
          <div class="stat-value">{{ diasRestantes }}</div>
          <div class="stat-label">{{ diasRestantes === 1 ? 'Day' : 'Days' }} left</div>
        </div>
      </div>
    </div>

    <!-- Contenedor de elementos del viaje -->
    <div class="items-container">
      <div class="items-header">
        <div class="items-header-top">
          <h2>What do you need for your trip?</h2>
          <button @click="mostrarModalCrearItem" class="btn-add-item">
            <font-awesome-icon icon="plus" /> Add
          </button>
        </div>

        <!-- Filtro de categorías -->
        <div class="categories-filter">
          <button @click="mostrarTodasCategorias = true; categoriaSeleccionada = ''" class="category-pill"
            :class="{ 'category-selected': mostrarTodasCategorias }">
            <font-awesome-icon icon="list" /> All
          </button>
          <button v-for="cat in categorias" :key="cat.id" @click="seleccionarCategoria(cat.id)" class="category-pill"
            :class="{ 'category-selected': categoriaSeleccionada === cat.id }">
            <font-awesome-icon :icon="cat.icon" /> {{ cat.nombre }}
          </button>
        </div>
      </div>

      <!-- Mensaje cuando no hay elementos -->
      <div v-if="itemsFiltrados.length === 0" class="empty-items">
        <div class="empty-illustration">
          <font-awesome-icon icon="suitcase-rolling" />
        </div>
        <p>No items {{ !mostrarTodasCategorias && categoriaSeleccionada ? `in the
          ${obtenerNombreCategoria(categoriaSeleccionada)} category` : 'in your list' }}</p>
        <p class="empty-hint">Click the <strong>"Add"</strong> button at the top to start creating your list.</p>
      </div>

      <!-- Lista de elementos -->
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
            <button @click.stop="editarItem(item)" class="btn-icon" title="Edit">
              <font-awesome-icon icon="edit" />
            </button>
            <button @click.stop="eliminarItem(item)" class="btn-icon" title="Delete">
              <font-awesome-icon icon="trash" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal para crear/editar elemento -->
  <div v-if="mostrarModal" class="modal-overlay" @click="cerrarModal">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h2>{{ modoEdicion ? 'Edit Item' : 'Add to your list' }}</h2>
        <button @click="cerrarModal" class="btn-close">
          <font-awesome-icon icon="times" />
        </button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="guardarItem">
          <div class="form-group">
            <label for="texto">What do you need to pack?</label>
            <input type="text" id="texto" v-model="itemActual.texto" required
              placeholder="E.g. Passport, charger, camera..." class="form-input" autofocus />
          </div>

          <div class="form-group">
            <label>Category</label>
            <div class="category-selector">
              <div v-for="cat in categoriasList" :key="cat.id" @click="itemActual.categoria = cat.id"
                class="category-option" :class="{ 'category-option-selected': itemActual.categoria === cat.id }">
                <font-awesome-icon :icon="cat.icon" />
                <span>{{ cat.nombre }}</span>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="notas">Additional notes (optional)</label>
            <textarea id="notas" v-model="itemActual.notas" placeholder="Add important details..."
              class="form-textarea"></textarea>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="itemActual.completado" />
              <span>I already have this item</span>
            </label>
          </div>

          <div class="form-actions">
            <button type="button" @click="cerrarModal" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary">
              {{ modoEdicion ? 'Save Changes' : 'Add to my list' }}
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
        <h2>Edit Trip</h2>
        <button @click="cerrarModalLista" class="btn-close">
          <font-awesome-icon icon="times" />
        </button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="guardarLista">
          <div class="form-group">
            <label for="nombre">Trip Name</label>
            <input type="text" id="nombre" v-model="listaEditada.nombre" required placeholder="E.g. Summer Vacation"
              class="form-input" />
          </div>
          <div class="form-group">
            <label for="destino">Destination</label>
            <input type="text" id="destino" v-model="listaEditada.destino" required placeholder="E.g. Barcelona, Spain"
              class="form-input" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="fechaInicio">Start Date</label>
              <input type="date" id="fechaInicio" v-model="listaEditada.fechaInicio" required class="form-input" />
            </div>
            <div class="form-group">
              <label for="fechaFin">End Date</label>
              <input type="date" id="fechaFin" v-model="listaEditada.fechaFin" required class="form-input" />
            </div>
          </div>
          <div class="form-group">
            <label for="descripcion">Description (optional)</label>
            <textarea id="descripcion" v-model="listaEditada.descripcion" placeholder="Describe your trip..."
              class="form-textarea"></textarea>
          </div>
          <div class="form-actions">
            <button type="button" @click="cerrarModalLista" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary">Save Changes</button>
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
// Importaciones de Vue y composables necesarios
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTripLists } from '@/composables/useTripLists';
import { safeGoBack } from '@/utils/navegation';

// Obtener el router y la ruta actual
const route = useRoute();
const router = useRouter();

// Obtener funciones del composable useTripLists
const {
  obtenerLista,        // Función para obtener una lista por ID
  actualizarLista,     // Función para actualizar una lista
  agregarItem,         // Función para añadir un item a la lista
  actualizarItem,      // Función para actualizar un item existente
  eliminarItem: eliminarItemLista,  // Función para eliminar un item
  toggleCompletado,    // Función para marcar/desmarcar un item como completado
  categorias: categoriasList,  // Lista de categorías disponibles
  obtenerCategoria     // Función para obtener información de una categoría
} = useTripLists();

// Variables de estado para gestionar la interfaz
const lista = ref(null);                // Almacena los datos de la lista actual
const cargando = ref(true);             // Controla el estado de carga
const error = ref(null);                // Almacena mensajes de error
const mostrarModal = ref(false);        // Controla la visibilidad del modal de item
const mostrarModalLista = ref(false);   // Controla la visibilidad del modal de lista
const modoEdicion = ref(false);         // Indica si estamos editando o creando un item
const itemActual = ref({                // Datos del item que se está editando/creando
  texto: '',
  categoria: 'otros',
  notas: '',
  completado: false
});
const listaEditada = ref({});           // Datos de la lista que se está editando
const mostrarTodasCategorias = ref(true);  // Indica si mostrar todas las categorías
const categoriaSeleccionada = ref('');     // Categoría seleccionada para filtrar
const notifications = ref([]);             // Almacena las notificaciones

// Control de notificaciones de guardado automático
let lastSaveNotification = 0;
const NOTIFICATION_COOLDOWN = 3000; // 3 segundos entre notificaciones

// Función para cargar la lista desde el almacenamiento
const cargarLista = async () => {
  cargando.value = true;
  error.value = null;

  try {
    // Verificar que el ID existe en la ruta
    const id = route.params.id;
    if (!id) {
      throw new Error('Trip ID not provided');
    }

    console.log("Loading trip with ID:", id);

    // Obtener la lista
    const resultado = obtenerLista(id);

    if (!resultado) {
      console.error("Trip not found with ID:", id);
      throw new Error('Trip not found');
    }

    lista.value = resultado;
    console.log("Trip loaded:", lista.value);

    // Asegurarse de que items sea un array
    if (!lista.value.items) {
      lista.value.items = [];
    }

  } catch (err) {
    console.error('Error loading trip:', err);
    error.value = 'Could not load trip details. Please try again.';
  } finally {
    cargando.value = false;
  }
}

// Ejecutar al montar el componente
onMounted(() => {
  cargarLista();
});

// Limpiar recursos al desmontar el componente
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
          icon: 'check-circle',
          title: 'Auto-saved',
          message: 'Your changes are saved automatically'
        });
        lastSaveNotification = now;
      }
    }
  },
  { deep: true }  // Observar cambios profundos en el objeto
);

// Propiedades computadas
// Número de items completados
const itemsCompletados = computed(() => {
  if (!lista.value || !lista.value.items) return 0;
  return lista.value.items.filter(item => item.completado).length;
});

// Número de items pendientes
const itemsPendientes = computed(() => {
  if (!lista.value || !lista.value.items) return 0;
  return lista.value.items.filter(item => !item.completado).length;
});

// Días restantes para el viaje
const diasRestantes = computed(() => {
  if (!lista.value || !lista.value.fechaInicio) return 0;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const fechaInicio = new Date(lista.value.fechaInicio);
  fechaInicio.setHours(0, 0, 0, 0);

  if (fechaInicio < hoy) return 0;

  return Math.ceil((fechaInicio - hoy) / (1000 * 60 * 60 * 24));
});

// Lista de categorías con iconos
const categorias = computed(() => {
  return categoriasList.map(cat => ({
    ...cat,
    icon: cat.icon // Asumimos que los iconos ya están en el formato correcto
  }));
});

// Items filtrados según la categoría seleccionada
const itemsFiltrados = computed(() => {
  if (!lista.value || !lista.value.items) return [];

  if (mostrarTodasCategorias.value || !categoriaSeleccionada.value) {
    return lista.value.items;
  }

  return lista.value.items.filter(item => item.categoria === categoriaSeleccionada.value);
});

// Métodos
// Calcular el porcentaje de items completados
function calcularPorcentajeCompletado() {
  if (!lista.value || !lista.value.items || lista.value.items.length === 0) return 0;
  return Math.round((itemsCompletados.value / lista.value.items.length) * 100);
}

// Formatear fecha para mostrar en formato DD/MM/YYYY
function formatearFecha(fecha) {
  if (!fecha) return '';
  return new Date(fecha).toLocaleDateString('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Mostrar modal para crear un nuevo item
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

// Mostrar modal para editar un item existente
function editarItem(item) {
  modoEdicion.value = true;
  itemActual.value = { ...item };
  mostrarModal.value = true;
}

// Guardar un item (nuevo o editado)
async function guardarItem() {
  if (!lista.value) return;

  try {
    if (!itemActual.value.texto.trim()) {
      alert("Item text is required");
      return;
    }

    if (modoEdicion.value && itemActual.value.id) {
      // Actualizar item existente
      console.log("Updating item:", itemActual.value);
      const resultado = actualizarItem(lista.value.id, itemActual.value.id, itemActual.value);
      if (!resultado) {
        throw new Error("Could not update item");
      }

      // Mostrar notificación
      showNotification({
        type: 'success',
        icon: 'check-circle',
        title: 'Item updated',
        message: 'Item has been updated successfully'
      });
    } else {
      // Crear nuevo item
      console.log("Creating new item:", itemActual.value);
      const resultado = agregarItem(
        lista.value.id,
        itemActual.value.texto,
        itemActual.value.categoria,
        1,
        itemActual.value.notas // Añadir las notas como parámetro
      );
      if (!resultado) {
        throw new Error("Could not create item");
      }

      // Mostrar notificación
      showNotification({
        type: 'success',
        icon: 'check-circle',
        title: 'Item added',
        message: 'Item has been added to your list'
      });
    }

    cerrarModal();
    await cargarLista();
  } catch (err) {
    console.error('Error saving item:', err);

    // Mostrar notificación de error
    showNotification({
      type: 'error',
      icon: 'exclamation-circle',
      title: 'Error',
      message: 'An error occurred while saving the item. Please try again.'
    });
  }
}

// Eliminar un item de la lista
async function eliminarItem(item) {
  if (!lista.value || !item.id) return;

  if (!confirm("Are you sure you want to delete this item?")) {
    return;
  }

  try {
    console.log("Deleting item:", item.id);
    const resultado = eliminarItemLista(lista.value.id, item.id);
    if (!resultado) {
      throw new Error("Could not delete item");
    }

    // Mostrar notificación
    showNotification({
      type: 'info',
      icon: 'trash',
      title: 'Item deleted',
      message: 'Item has been deleted successfully'
    });

    await cargarLista();
  } catch (err) {
    console.error('Error deleting item:', err);

    // Mostrar notificación de error
    showNotification({
      type: 'error',
      icon: 'exclamation-circle',
      title: 'Error',
      message: 'An error occurred while deleting the item. Please try again.'
    });
  }
}

// Marcar/desmarcar un item como completado
async function toggleItemCompletado(item) {
  if (!lista.value) return;

  try {
    console.log("Toggling item status:", item.id);
    const resultado = toggleCompletado(lista.value.id, item.id);
    if (!resultado) {
      throw new Error("Could not change item status");
    }

    // Mostrar notificación
    showNotification({
      type: 'success',
      icon: 'check-circle',
      title: 'Status updated',
      message: item.completado ? 'Item marked as pending' : 'Item marked as completed'
    });

    await cargarLista();
  } catch (err) {
    console.error('Error updating item status:', err);

    // Mostrar notificación de error
    showNotification({
      type: 'error',
      icon: 'exclamation-circle',
      title: 'Error',
      message: 'An error occurred while updating the item status. Please try again.'
    });
  }
}

// Seleccionar una categoría para filtrar
function seleccionarCategoria(categoria) {
  mostrarTodasCategorias.value = false;
  if (categoriaSeleccionada.value === categoria) {
    categoriaSeleccionada.value = '';
    mostrarTodasCategorias.value = true;
  } else {
    categoriaSeleccionada.value = categoria;
  }
}

// Obtener el nombre de una categoría a partir de su ID
function obtenerNombreCategoria(categoriaId) {
  const categoria = obtenerCategoria(categoriaId);
  return categoria ? categoria.nombre : 'No category';
}

// Obtener el icono de una categoría a partir de su ID
function obtenerIconoCategoria(categoriaId) {
  const categoria = obtenerCategoria(categoriaId);
  return categoria ? categoria.icon : 'box';
}

// Mostrar modal para editar la lista
function editarLista() {
  if (!lista.value) return;

  listaEditada.value = { ...lista.value };
  mostrarModalLista.value = true;
}

// Guardar cambios en la lista
async function guardarLista() {
  if (!lista.value) return;

  try {
    if (!listaEditada.value.nombre.trim()) {
      alert("Trip name is required");
      return;
    }

    if (!listaEditada.value.destino.trim()) {
      alert("Destination is required");
      return;
    }

    console.log("Updating trip:", listaEditada.value);
    const resultado = actualizarLista(lista.value.id, listaEditada.value);
    if (!resultado) {
      throw new Error("Could not update trip");
    }

    // Mostrar notificación
    showNotification({
      type: 'success',
      icon: 'check-circle',
      title: 'Trip updated',
      message: 'Trip details have been updated successfully'
    });

    cerrarModalLista();
    await cargarLista();
  } catch (err) {
    console.error('Error saving trip:', err);

    // Mostrar notificación de error
    showNotification({
      type: 'error',
      icon: 'exclamation-circle',
      title: 'Error',
      message: 'An error occurred while saving changes. Please try again.'
    });
  }
}

// Cerrar el modal de item
function cerrarModal() {
  mostrarModal.value = false;
}

// Cerrar el modal de lista
function cerrarModalLista() {
  mostrarModalLista.value = false;
}

// Volver a la vista anterior
function volverAtras() {
  safeGoBack(router, { name: 'TripLists' });
}

// Sistema de notificaciones
// Mostrar una notificación
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

// Eliminar una notificación
function removeNotification(index) {
  notifications.value.splice(index, 1);
}
</script>

<style scoped>
/* Estilos generales del contenedor */
.trip-detail-container {
  font-family: 'Poppins', sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem 5rem;
  color: #333;
  background-color: #f8f9fa;
}

/* Estados de carga y error */
.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
  text-align: center;
  padding: 2rem;
}

.loading-spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-top: 4px solid var(--color-primary);
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin-bottom: 1.5rem;
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
  margin-top: 1.5rem;
  background-color: var(--color-primary);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.btn-retry:hover {
  background-color: var(--color-accent);
  transform: translateY(-2px);
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
}

/* Cabecera */
.trip-header {
  background-color: white;
  padding: 2rem;
  border-radius: 1rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.trip-header-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.trip-title-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.title-with-back {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-back {
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-back:hover {
  background-color: rgba(var(--color-primary-rgb), 0.1);
  transform: translateX(-3px);
}

.trip-title {
  font-size: 2rem;
  color: var(--color-primary);
  margin: 0;
  font-weight: 700;
}

.trip-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  color: #6c757d;
  font-size: 1rem;
}

.trip-destination,
.trip-dates {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.trip-destination svg,
.trip-dates svg {
  color: var(--color-primary);
}

.trip-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-icon-text {
  background-color: #f8f9fa;
  color: #555;
  border: 1px solid #ddd;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-icon-text:hover {
  background-color: #e9ecef;
  color: #333;
  transform: translateY(-2px);
}

.btn-icon-text svg {
  font-size: 0.875rem;
}

/* Progreso */
.trip-progress-container {
  background-color: white;
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.progress-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
  font-weight: 600;
}

.progress-percentage {
  font-size: 2rem;
  font-weight: bold;
  color: var(--color-primary);
}

.progress-bar {
  height: 10px;
  background-color: #e9ecef;
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 2rem;
}

.progress-fill {
  height: 100%;
  background-color: var(--color-primary);
  transition: width 0.5s ease-in-out;
}

.progress-low {
  background-color: #dc3545;
}

.progress-medium {
  background-color: #ffc107;
}

.progress-high {
  background-color: #28a745;
}

.progress-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  text-align: center;
}

.stat {
  background-color: #f8f9fa;
  padding: 1.25rem 1rem;
  border-radius: 0.75rem;
  transition: all 0.2s;
}

.stat:hover {
  background-color: #e9ecef;
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: var(--color-primary);
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #6c757d;
  font-weight: 500;
}

/* Lista de elementos */
.items-container {
  background-color: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.items-header {
  margin-bottom: 2rem;
}

.items-header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.items-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
  font-weight: 600;
}

.btn-add-item {
  background-color: var(--color-primary);
  color: white;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.2s;
  box-shadow: 0 4px 6px rgba(var(--color-primary-rgb), 0.2);
}

.btn-add-item:hover {
  background-color: var(--color-accent);
  transform: translateY(-2px);
  box-shadow: 0 6px 8px rgba(var(--color-primary-rgb), 0.3);
}

.btn-add-item:active {
  transform: translateY(0);
}

/* Categorías */
.categories-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.category-pill {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 2rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.category-pill:hover {
  background-color: #e9ecef;
  transform: translateY(-2px);
}

.category-pill svg {
  font-size: 0.875rem;
}

.category-selected {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
  box-shadow: 0 4px 6px rgba(var(--color-primary-rgb), 0.2);
}

.category-selected:hover {
  background-color: var(--color-accent);
}

/* Lista vacía */
.empty-items {
  text-align: center;
  padding: 3rem 2rem;
  color: #6c757d;
  background-color: #f8f9fa;
  border-radius: 0.75rem;
  margin-top: 1.5rem;
}

.empty-illustration {
  font-size: 4rem;
  color: #dee2e6;
  margin-bottom: 1.5rem;
}

.empty-items p {
  font-size: 1.125rem;
  margin-bottom: 1rem;
}

.empty-hint {
  font-size: 0.875rem;
  color: #adb5bd;
  margin-top: 0.75rem;
}

/* Lista de elementos */
.items-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.item-card {
  display: flex;
  align-items: flex-start;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 0.75rem;
  padding: 1.25rem;
  transition: all 0.3s;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.item-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  background-color: white;
}

.item-completed {
  background-color: #f0f9f0;
  border-color: #d1e7dd;
}

.item-completed .item-text {
  text-decoration: line-through;
  color: #adb5bd;
}

.item-checkbox {
  margin-right: 1rem;
  padding-top: 2px;
}

.item-checkbox input[type="checkbox"] {
  display: none;
}

.item-checkbox label {
  display: inline-block;
  width: 24px;
  height: 24px;
  border: 2px solid #ced4da;
  border-radius: 6px;
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
}

.item-checkbox label:hover {
  border-color: var(--color-primary);
}

.item-checkbox input[type="checkbox"]:checked+label {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
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
  font-size: 1.125rem;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.item-details {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.item-category {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background-color: rgba(var(--color-primary-rgb), 0.1);
  color: var(--color-primary);
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-weight: 500;
}

.item-notes {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: #6c757d;
  font-size: 0.875rem;
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-actions {
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.item-card:hover .item-actions {
  opacity: 1;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  color: #adb5bd;
  padding: 0.375rem;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.btn-icon:hover {
  background-color: #e9ecef;
  color: #333;
}

/* Botones principales */
.btn-primary {
  background-color: var(--color-primary);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
  box-shadow: 0 4px 6px rgba(var(--color-primary-rgb), 0.2);
}

.btn-primary:hover {
  background-color: var(--color-accent);
  transform: translateY(-2px);
  box-shadow: 0 6px 8px rgba(var(--color-primary-rgb), 0.3);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-secondary {
  background-color: #f8f9fa;
  color: #495057;
  border: 1px solid #e9ecef;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background-color: #e9ecef;
  color: #212529;
}

/* Modales */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  /* Aumentado para estar por encima del header */
  animation: fadeIn 0.2s ease-out;
  backdrop-filter: blur(3px);
  padding: 1rem;
  /* Añadido padding para móviles */
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
  border-radius: 1rem;
  width: 100%;
  max-width: 550px;
  max-height: calc(100vh - 2rem);
  /* Asegurar que no exceda la altura de la pantalla */
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  animation: slideUp 0.3s ease-out;
  margin: auto;
  /* Centrar el modal */
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
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--color-primary);
  font-weight: 600;
}

.btn-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #adb5bd;
  font-size: 1.25rem;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-close:hover {
  background-color: #f8f9fa;
  color: #495057;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-row {
  display: flex;
  gap: 1.5rem;
}

.form-row .form-group {
  flex: 1;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #495057;
  font-size: 1rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-weight: normal;
  color: #495057;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary);
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #ced4da;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
}

.form-textarea {
  min-height: 120px;
  resize: vertical;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

/* Selector de categorías */
.category-selector {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.category-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.category-option:hover {
  background-color: #f8f9fa;
  transform: translateY(-2px);
}

.category-option svg {
  font-size: 1.25rem;
  color: #6c757d;
}

.category-option span {
  font-size: 0.875rem;
  color: #495057;
  text-align: center;
}

.category-option-selected {
  background-color: rgba(var(--color-primary-rgb), 0.1);
  border-color: var(--color-primary);
}

.category-option-selected svg,
.category-option-selected span {
  color: var(--color-primary);
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
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  animation: slideInRight 0.3s ease-out;
  background-color: white;
  border-left: 4px solid var(--color-primary);
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
  border-left-color: #28a745;
}

.notification.error {
  border-left-color: #dc3545;
}

.notification.info {
  border-left-color: var(--color-primary);
}

.notification.warning {
  border-left-color: #ffc107;
}

.notification-icon {
  margin-right: 0.75rem;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification.success .notification-icon {
  color: #28a745;
}

.notification.error .notification-icon {
  color: #dc3545;
}

.notification.info .notification-icon {
  color: var(--color-primary);
}

.notification.warning .notification-icon {
  color: #ffc107;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: #212529;
}

.notification-message {
  font-size: 0.875rem;
  color: #6c757d;
}

.notification-close {
  background: none;
  border: none;
  color: #adb5bd;
  cursor: pointer;
  padding: 0.25rem;
  margin-left: 0.5rem;
  font-size: 0.875rem;
  transition: color 0.2s;
}

.notification-close:hover {
  color: #495057;
}

/* Responsive */
@media (max-width: 768px) {
  .trip-detail-container {
    padding: 1.5rem 1rem 5rem;
  }

  .trip-header,
  .trip-progress-container,
  .items-container {
    padding: 1.5rem;
  }

  .trip-title-section {
    flex-direction: column;
    align-items: flex-start;
  }

  .trip-actions {
    width: 100%;
    justify-content: flex-end;
    margin-top: 1rem;
  }

  .progress-stats {
    grid-template-columns: 1fr;
    gap: 1rem;
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

  .btn-add-item {
    padding: 0.5rem 1rem;
  }
}

@media (max-width: 480px) {

  .trip-header,
  .trip-progress-container,
  .items-container {
    padding: 1.25rem;
  }

  .category-selector {
    grid-template-columns: 1fr;
  }

  .item-details {
    flex-direction: column;
    gap: 0.5rem;
  }

  .items-header-top {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .btn-add-item {
    align-self: flex-end;
  }

  .title-with-back {
    width: 100%;
  }

  .form-actions {
    flex-direction: column;
    gap: 0.75rem;
  }

  .form-actions button {
    width: 100%;
  }

  .modal-container {
    width: 95%;
  }
}

/* Estilos específicos para modales en móvil */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 0.5rem;
    align-items: flex-start;
    padding-top: 2rem;
    /* Espacio para evitar el header */
  }

  .modal-container {
    max-height: calc(100vh - 4rem);
    width: 100%;
    margin-top: 1rem;
  }

  .modal-header {
    padding: 1rem 1rem 0.75rem;
  }

  .modal-body {
    padding: 1rem;
  }

  .form-actions {
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }

  .form-actions button {
    width: 100%;
    padding: 0.875rem;
  }
}

@media (max-width: 480px) {
  .modal-overlay {
    padding: 0.25rem;
    padding-top: 1.5rem;
  }

  .modal-container {
    max-height: calc(100vh - 3rem);
    border-radius: 0.75rem;
  }

  .modal-header h2 {
    font-size: 1.25rem;
  }

  .category-selector {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }

  .category-option {
    padding: 0.75rem 0.5rem;
  }
}
</style>
