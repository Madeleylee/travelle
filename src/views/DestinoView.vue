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
const nombrePais = computed(() => route.params.nombrePais);
const nombreCiudad = computed(() => route.params.nombreCiudad);
const nombreDestino = computed(() => route.params.nombreDestino);

// Variables reactivas
const destination = ref(null); // Información del destino
const selectedImage = ref(null); // Índice de la imagen seleccionada
const currentIndex = ref(0); // Índice actual para el carrusel 3D

// Cargar destino al montar
onMounted(async () => {
  try {
    destination.value = await getLugarPorNombreCiudadPais(nombreDestino.value, nombreCiudad.value, nombrePais.value);

    // Si no existe, redirigimos a home
    if (!destination.value) {
      router.push({ name: "Home" });
    }
  } catch (error) {
    console.error("Error fetching destination:", error);
    router.push({ name: "Home" }); // Redirect to home on error
  }
});

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

// Funciones para el carrusel 3D
function rotateCarousel(direction) {
  if (!destination.value || !destination.value.imagenes.length) return;

  const totalImages = destination.value.imagenes.length;

  if (direction === 'next') {
    currentIndex.value = (currentIndex.value + 1) % totalImages;
  } else {
    currentIndex.value = (currentIndex.value - 1 + totalImages) % totalImages;
  }
}

function getCardPosition(index) {
  if (!destination.value) return {};

  const totalImages = destination.value.imagenes.length;
  const angle = 360 / totalImages;
  const rotationY = (index - currentIndex.value) * angle;
  const zIndex = index === currentIndex.value ? 10 : 5;

  return {
    transform: `rotateY(${rotationY}deg) translateZ(250px)`,
    zIndex: zIndex
  };
}

// Volver atrás
function goBack() {
  safeGoBack(router); // Volver a la página anterior
}
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
        <h2 class="gallery-title">Photo Gallery</h2>

        <!-- Carrusel 3D -->
        <div class="carousel-3d-container">
          <div class="carousel-3d-stage">
            <div v-for="(image, index) in destination.imagenes" :key="index" class="carousel-3d-card"
              :style="getCardPosition(index)" @click="openImage(index)">
              <div class="carousel-3d-card-face">
                <img :src="image" :alt="`${destination.nombre} - Image ${index + 1}`" class="carousel-3d-image" />
                <div class="carousel-3d-caption">
                  <span>{{ destination.nombre }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Controles del carrusel -->
          <div class="carousel-3d-controls">
            <button @click="rotateCarousel('prev')" class="carousel-3d-control prev-control">
              <i class="bi bi-chevron-left"></i>
            </button>
            <button @click="rotateCarousel('next')" class="carousel-3d-control next-control">
              <i class="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="destination-info">
        <div class="info-section">
          <h2>Information</h2>
          <p><strong>City:</strong> {{ nombreCiudad }}</p>
          <p><strong>Country:</strong> {{ nombrePais }}</p>
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

    <!-- Modal de imagen (ajustado) -->
    <div v-if="selectedImage !== null" class="modal" @click="closeImage">
      <div class="modal-content">
        <button class="modal-close" @click="closeImage">&times;</button>
        <div class="modal-image-wrapper">
          <img :src="destination.imagenes[selectedImage]" :alt="`${destination.nombre} - Image ${selectedImage + 1}`"
            class="modal-image" />
        </div>
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

/* Contenedor de la galería */
.gallery-container {
  margin-bottom: 2rem;
}

.gallery-title {
  color: #4a6fa5;
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  text-align: center;
  font-weight: 600;
}

/* Carrusel 3D */
.carousel-3d-container {
  position: relative;
  height: 400px;
  perspective: 1000px;
  margin: 0 auto;
  background: linear-gradient(135deg, #1c2331, #2c3e50);
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.carousel-3d-stage {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.5s ease;
}

.carousel-3d-card {
  position: absolute;
  width: 300px;
  height: 200px;
  left: 50%;
  top: 50%;
  margin-left: -150px;
  margin-top: -100px;
  transition: all 0.5s ease;
  cursor: pointer;
  transform-style: preserve-3d;
}

.carousel-3d-card-face {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  border: 4px solid white;
  background-color: #0088cc;
  backface-visibility: hidden;
}

.carousel-3d-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.carousel-3d-caption {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  text-align: center;
  font-weight: 500;
}

.carousel-3d-controls {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 20px;
}

.carousel-3d-control {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.3s ease;
}

.carousel-3d-control:hover {
  background: rgba(255, 255, 255, 0.4);
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
  max-width: 80vw;
  max-height: 80vh;
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
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

/* Contenedor de la imagen en el modal */
.modal-image-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

/* Estilo para la imagen en el modal */
.modal-image {
  max-width: 100%;
  max-height: 60vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* Navegación del modal */
.modal-nav {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

/* Estilo para los botones de navegación */
.nav-button {
  background: #4a6fa5;
  border: none;
  color: white;
  font-size: 1.2rem;
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

  .carousel-3d-container {
    height: 300px;
    padding: 1rem;
  }

  .carousel-3d-card {
    width: 220px;
    height: 150px;
    margin-left: -110px;
    margin-top: -75px;
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

  .modal-content {
    max-width: 90vw;
  }

  .modal-image {
    max-height: 50vh;
  }
}

@media (max-width: 480px) {
  .carousel-3d-container {
    height: 250px;
  }

  .carousel-3d-card {
    width: 180px;
    height: 120px;
    margin-left: -90px;
    margin-top: -60px;
  }

  .modal-content {
    padding: 1rem;
  }

  .modal-image {
    max-height: 40vh;
  }
}
</style>
