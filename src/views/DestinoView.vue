<script setup>
// Importaciones necesarias de Vue y Vue Router
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";

// Importación de datos de países, ciudades y lugares
import data from "../assets/data/data.json";

// Importación de componentes de iconos
import ArrowIcon from "../components/icons/ArrowIcon.vue";
import MapIcon from "../components/icons/MapIcon.vue";

// Obtener la ruta actual y el router para navegación
const route = useRoute();
const router = useRouter();

// Propiedades computadas para obtener el nombre del país, ciudad y destino desde la ruta
const nombrePais = computed(() => route.params.nombrePais);
const nombreCiudad = computed(() => route.params.nombreCiudad);
const nombreDestino = computed(() => route.params.nombreDestino);

// Propiedad computada para encontrar el destino en los datos importados
const destino = computed(() => {
  const pais = data.paises.find(p => p.name === nombrePais.value);
  if (pais) {
    const ciudad = pais.ciudades[nombreCiudad.value];
    if (ciudad) {
      return ciudad.lugares.find(lugar => lugar.nombre === nombreDestino.value);
    }
  }
  return null;
});

// Variable reactiva para almacenar el índice de la imagen seleccionada
const imagenSeleccionada = ref(null);

// Función para abrir una imagen en el modal
function abrirImagen(index) {
  imagenSeleccionada.value = index;
}

// Función para cerrar el modal de la imagen
function cerrarImagen() {
  imagenSeleccionada.value = null;
}

// Función para navegar a la imagen anterior
function imagenAnterior() {
  if (imagenSeleccionada.value > 0) {
    imagenSeleccionada.value--;
  }
}

// Función para navegar a la imagen siguiente
function imagenSiguiente() {
  if (imagenSeleccionada.value < destino.value.rutaImagen.length - 1) {
    imagenSeleccionada.value++;
  }
}

// Función para volver a la página anterior
function volverAtras() {
  //go(-1) se usa para navegar hacia atrás en el historial de navegación
  router.go(-1);
}

// Redirigir a la página principal si el destino no existe
if (!destino.value) {
  router.push({ name: 'Home' });
}
</script>

<template>
  <div class="destino-view" v-if="destino">
    <!-- Contenedor del encabezado con botón de volver y título -->
    <div class="header-container">
      <button @click="volverAtras" class="btn-volver">
        <!-- Icono de flecha para volver atrás -->
        <ArrowIcon :width="20" :height="20" />
        Volver
      </button>
      <h1>{{ destino.nombre }}</h1>
    </div>
    <!-- Contenedor del contenido del destino -->
    <div class="destino-content">
      <!-- Galería de imágenes -->
      <div class="galeria-container">
        <div class="galeria">
          <!-- Iterar sobre las imágenes y mostrarlas en la galería -->
          <img v-for="(imagen, index) in destino.rutaImagen" :key="index" :src="imagen"
            :alt="`${destino.nombre} - Imagen ${index + 1}`" class="galeria-imagen" @click="abrirImagen(index)" />
        </div>
      </div>
      <!-- Información del destino -->
      <div class="destino-info">
        <div class="info-section">
          <h2>Información</h2>
          <p><strong>Ciudad:</strong> {{ nombreCiudad }}</p>
          <p><strong>País:</strong> {{ nombrePais }}</p>
          <p><strong>Tipo:</strong> {{ destino.tipo }}</p>
          <p><strong>Precio:</strong> {{ destino.precio === 0 ? "Gratis" : destino.precio + ' €' }}</p>
          <p><strong>Valoración:</strong> {{ destino.valoracion }} ⭐</p>
        </div>
        <!-- Enlace a la ubicación en Google Maps -->
        <a :href="destino.ubicacion_url" target="_blank" rel="noopener noreferrer" class="btn-ubicacion">
          <MapIcon :width="20" :height="20" />
          Ver ubicación en Google Maps
        </a>
      </div>
    </div>

    <!-- Modal para ver imágenes en grande -->
    <div v-if="imagenSeleccionada !== null" class="modal" @click="cerrarImagen">
      <div class="modal-content">
        <button class="modal-close" @click="cerrarImagen">&times;</button>
        <img :src="destino.rutaImagen[imagenSeleccionada]" :alt="`${destino.nombre} - Imagen ${imagenSeleccionada + 1}`"
          class="modal-imagen" />
        <div class="modal-nav">
          <button @click.stop="imagenAnterior" :disabled="imagenSeleccionada === 0" class="nav-button">
            &#8592;
          </button>
          <span>{{ imagenSeleccionada + 1 }} / {{ destino.rutaImagen.length }}</span>
          <button @click.stop="imagenSiguiente" :disabled="imagenSeleccionada === destino.rutaImagen.length - 1"
            class="nav-button">
            &#8594;
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Estilos específicos para este componente */
.destino-view {
  padding: 2rem;
  max-width: 1200px;
  padding-top: 5rem;
  margin: 0 auto;
}

/* Contenedor del encabezado */
.header-container {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  margin-bottom: 2rem;
  position: relative;
}

/* Estilo para el botón de volver */
.btn-volver {
  position: relative;
  display: flex;
  align-items: center;
  background-color: var(--color-primary);
  color: var(--color-textWhite);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

/* Efecto hover para el botón de volver */
.btn-volver:hover {
  background-color: var(--color-accent);
}

/* Estilo para el título principal */
h1 {
  color: var(--color-primary);
  font-size: 2.5rem;
  text-align: center;
  width: 100%;
}

/* Contenedor del contenido del destino */
.destino-content {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 2rem;
  background-color: var(--color-textWhite);
  border-radius: 8px;
  box-shadow: 0 2px 4px var(--color-primary);
  padding: 2rem;
}

/* Estilo para la galería de imágenes */
.galeria {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

/* Estilo para cada imagen en la galería */
.galeria-imagen {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.3s ease;
}

/* Efecto hover para las imágenes de la galería */
.galeria-imagen:hover {
  transform: scale(1.05);
}

/* Contenedor de la información del destino */
.destino-info {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Sección de información */
.info-section {
  background-color: var(--color-background);
  padding: 1.5rem;
  border-radius: 8px;
}

/* Estilo para el título de la sección de información */
.info-section h2 {
  color: var(--color-primary);
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

/* Estilo para los párrafos de información */
.info-section p {
  margin-bottom: 0.5rem;
}

/* Estilo para el botón de ubicación */
.btn-ubicacion {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background-color: var(--color-primary);
  color: var(--color-textWhite);
  padding: 1rem;
  text-decoration: none;
  border-radius: 8px;
  transition: background-color 0.3s;
}

/* Efecto hover para el botón de ubicación */
.btn-ubicacion:hover {
  background-color: var(--color-accent);
}

/* Estilos para el modal */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-text);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

/* Contenedor del contenido del modal */
.modal-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
}

/* Estilo para el botón de cerrar el modal */
.modal-close {
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: none;
  color: var(--color-textWhite);
  font-size: 2rem;
  cursor: pointer;
}

/* Estilo para la imagen en el modal */
.modal-imagen {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
}

/* Navegación del modal */
.modal-nav {
  position: absolute;
  bottom: -40px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  color: var(--color-textWhite);
}

/* Estilo para los botones de navegación */
.nav-button {
  background: none;
  border: none;
  color: var(--color-textWhite);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
}

/* Estilo para los botones de navegación deshabilitados */
.nav-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}


/* Media queries para ajustar el diseño en pantallas más pequeñas */
@media (max-width: 768px) {
  .destino-view {
    padding: 2rem;
    padding-top: 4rem;
  }

  .destino-content {
    grid-template-columns: 1fr;
  }

  .galeria {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  h1 {
    font-size: 2rem;
  }

  .header-container {
    flex-direction: column;
    gap: 1rem;
  }

  .btn-volver {
    position: static;
    margin-bottom: 1rem;
  }
}
</style>
