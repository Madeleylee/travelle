<script setup>
// Importaciones
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getLugarPorNombreCiudadPais } from "@/composables/useDatabase";
import { safeGoBack } from '@/utils/navegation';

// Iconos
import ArrowIcon from "@/components/icons/ArrowIcon.vue";
import MapIcon from "@/components/icons/MapIcon.vue";

// Router
const route = useRoute();
const router = useRouter();

// Parámetros de la URL
const countryName = computed(() => route.params.nombrePais); // Nombre del país
const cityName = computed(() => route.params.nombreCiudad); // Nombre de la ciudad
const destinationName = computed(() => route.params.nombreDestino); // Nombre del destino

// Variables reactivas
const destination = ref(null); // Información del destino
const selectedImage = ref(null); // Índice de la imagen seleccionada

// Funciones de galería
function openImage(index) {
  selectedImage.value = index; // Abrir imagen en el modal
}

function closeImage() {
  selectedImage.value = null; // Cerrar el modal de imagen
}

function previousImage() {
  if (selectedImage.value > 0) {
    selectedImage.value--; // Ir a la imagen anterior
  }
}

function nextImage() {
  if (destination.value && selectedImage.value < destination.value.imagenes.length - 1) {
    selectedImage.value++; // Ir a la siguiente imagen
  }
}

// Volver atrás
function goBack() {
  safeGoBack(router); // Volver a la página anterior
}

// Cargar destino al montar
onMounted(async () => {
  destination.value = await getLugarPorNombreCiudadPais(destinationName.value, cityName.value, countryName.value);

  // Si no existe, redirigimos a home
  if (!destination.value) {
    router.push({ name: "Home" });
  }
});
</script>

<template>
  <div class="destination-view" v-if="destination">
    <div class="header-container">
      <button @click="goBack" class="btn-back">
        <ArrowIcon :width="20" :height="20" />
        Back
      </button>
      <h1>{{ destination.nombre }}</h1>
    </div>

    <div class="destination-content">
      <div class="gallery-container">
        <div class="gallery">
          <img v-for="(image, index) in destination.imagenes" :key="index" :src="image"
            :alt="`${destination.nombre} - Image ${index + 1}`" class="gallery-image" @click="openImage(index)" />
        </div>
      </div>

      <div class="destination-info">
        <div class="info-section">
          <h2>Information</h2>
          <p><strong>City:</strong> {{ cityName }}</p>
          <p><strong>Country:</strong> {{ countryName }}</p>
          <p><strong>Price:</strong> {{ destination.precio === 0 ? 'Free' : `${destination.precio} €` }}</p>
          <p><strong>Rating:</strong> {{ destination.valoracion }} ⭐</p>
        </div>

        <a :href="`https://www.google.com/maps/search/?api=1&query=${destination.latitud},${destination.longitud}`"
          target="_blank" rel="noopener noreferrer" class="btn-location">
          <MapIcon :width="20" :height="20" />
          View location on Google Maps
        </a>
      </div>
    </div>

    <!-- Modal de imagen -->
    <div v-if="selectedImage !== null" class="modal" @click="closeImage">
      <div class="modal-content">
        <button class="modal-close" @click="closeImage">&times;</button>
        <img :src="destination.imagenes[selectedImage]" :alt="`${destination.nombre} - Image ${selectedImage + 1}`"
          class="modal-image" />
        <div class="modal-nav">
          <button @click.stop="previousImage" :disabled="selectedImage === 0" class="nav-button">&#8592;</button>
          <span>{{ selectedImage + 1 }} / {{ destination.imagenes.length }}</span>
          <button @click.stop="nextImage" :disabled="selectedImage === destination.imagenes.length - 1"
            class="nav-button">&#8594;</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Estilos específicos para este componente */
.destination-view {
  padding: 2rem;
  max-width: 1200px;
  padding-top: 5rem;
  margin: 0 auto;
  font-family: 'Arial', sans-serif;
}

/* Contenedor del encabezado */
.header-container {
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
  position: relative;
}

/* Estilo para el botón de volver */
.btn-back {
  display: flex;
  align-items: center;
  background-color: #4a6fa5;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-weight: bold;
  margin-right: 1rem;
}

/* Efecto hover para el botón de volver */
.btn-back:hover {
  background-color: #3a5a8f;
}

/* Estilo para el título principal */
h1 {
  color: #4a6fa5;
  font-size: 2.5rem;
  margin: 0;
  flex-grow: 1;
  text-align: center;
}

/* Contenedor del contenido del destino */
.destination-content {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

/* Estilo para la galería de imágenes */
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

/* Estilo para cada imagen en la galería */
.gallery-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  filter: brightness(0.9);
}

/* Efecto hover para las imágenes de la galería */
.gallery-image:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  filter: brightness(1.1);
}

/* Contenedor de la información del destino */
.destination-info {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Sección de información */
.info-section {
  background-color: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Estilo para el título de la sección de información */
.info-section h2 {
  color: #4a6fa5;
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

/* Estilo para los párrafos de información */
.info-section p {
  margin-bottom: 0.5rem;
  color: #333;
}

/* Estilo para el botón de ubicación */
.btn-location {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background-color: #4a6fa5;
  color: white;
  padding: 1rem;
  text-decoration: none;
  border-radius: 8px;
  transition: background-color 0.3s;
  font-weight: bold;
  margin-top: 1rem;
}

/* Efecto hover para el botón de ubicación */
.btn-location:hover {
  background-color: #3a5a8f;
}

/* Estilos para el modal */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
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
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
}

/* Estilo para el botón de cerrar el modal */
.modal-close {
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
}

/* Estilo para la imagen en el modal */
.modal-image {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
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
  color: white;
}

/* Estilo para los botones de navegación */
.nav-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Estilo para los botones de navegación deshabilitados */
.nav-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Media queries para ajustar el diseño en pantallas más pequeñas */
@media (max-width: 768px) {
  .destination-view {
    padding: 1rem;
    padding-top: 3rem;
  }

  .destination-content {
    grid-template-columns: 1fr;
  }

  .gallery {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  h1 {
    font-size: 2rem;
  }

  .header-container {
    flex-direction: column;
    gap: 1rem;
  }

  .btn-back {
    position: static;
    margin-bottom: 1rem;
  }
}
</style>
