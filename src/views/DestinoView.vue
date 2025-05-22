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
const currentSlide = ref(0); // Slide actual del carrusel

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

// Funciones del carrusel 3D
function nextSlide() {
  if (destination.value && destination.value.imagenes.length > 0) {
    currentSlide.value = (currentSlide.value + 1) % destination.value.imagenes.length;
  }
}

function prevSlide() {
  if (destination.value && destination.value.imagenes.length > 0) {
    currentSlide.value = currentSlide.value === 0
      ? destination.value.imagenes.length - 1
      : currentSlide.value - 1;
  }
}

function goToSlide(index) {
  currentSlide.value = index;
}

// Volver atrás
function goBack() {
  safeGoBack(router); // Volver a la página anterior
}
</script>

<template>
  <div class="destination-view" v-if="destination">
    <!-- Header con botón Back separado del título -->
    <div class="back-button-container">
      <button @click="goBack" class="btn-back">
        <ArrowIcon :width="20" :height="20" />
        Back
      </button>
    </div>

    <!-- Título principal en su propio contenedor -->
    <div class="title-container">
      <h1>{{ destination.nombre }}</h1>
      <div class="header-line"></div>
    </div>

    <div class="destination-content">
      <!-- Carrusel 3D mejorado -->
      <div class="carousel-3d-wrapper">
        <div class="carousel-3d-container">
          <div class="carousel-3d-track">
            <div v-for="(image, index) in destination.imagenes" :key="index" class="carousel-3d-slide" :class="{
              'active': index === currentSlide,
              'prev': index === (currentSlide - 1 + destination.imagenes.length) % destination.imagenes.length,
              'next': index === (currentSlide + 1) % destination.imagenes.length,
              'prev-2': index === (currentSlide - 2 + destination.imagenes.length) % destination.imagenes.length,
              'next-2': index === (currentSlide + 2) % destination.imagenes.length
            }" @click="openImage(index)">
              <div class="slide-content">
                <div class="slide-frame">
                  <img :src="image" :alt="`${destination.nombre} - Image ${index + 1}`" class="slide-image" />
                  <div class="slide-reflection"></div>
                </div>
                <div class="slide-caption">
                  <p>Image {{ index + 1 }} of {{ destination.imagenes.length }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Controles del carrusel -->
        <div class="carousel-controls">
          <button @click="prevSlide" class="carousel-btn prev-btn">
            <i class="bi bi-chevron-left"></i>
          </button>
          <button @click="nextSlide" class="carousel-btn next-btn">
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>

        <!-- Indicadores -->
        <div class="carousel-indicators">
          <button v-for="(image, index) in destination.imagenes" :key="index" @click="goToSlide(index)"
            :class="['indicator', { active: index === currentSlide }]"></button>
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

    <!-- Modal de imagen -->
    <div v-if="selectedImage !== null" class="modal" @click="closeImage">
      <div class="modal-content" @click.stop>
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
  margin: 0 auto;
  font-family: 'Arial', sans-serif;
}

/* Contenedor del botón Back */
.back-button-container {
  margin-bottom: 1.5rem;
  position: relative;
  height: 40px;
}

/* Estilo para el botón de volver */
.btn-back {
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  align-items: center;
  background-color: var(--color-primary);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-weight: bold;
  z-index: 10;
}

/* Efecto hover para el botón de volver */
.btn-back:hover {
  background-color: var(--color-accent);
}

/* Contenedor del título */
.title-container {
  text-align: center;
  margin-bottom: 2rem;
}

/* Estilo para el título */
.title-container h1 {
  color: var(--color-primary);
  font-size: 2.5rem;
  margin: 0 0 0.5rem 0;
  font-weight: 700;
}

/* Línea decorativa debajo del título */
.header-line {
  height: 4px;
  width: 80px;
  background-color: var(--color-accent);
  margin: 0 auto;
}

/* Contenedor del contenido del destino */
.destination-content {
  display: grid;
  grid-template-rows: auto auto;
  gap: 2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

/* Carrusel 3D mejorado */
.carousel-3d-wrapper {
  position: relative;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%);
  border-radius: 20px;
  padding: 3rem 2rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  margin-bottom: 2rem;
}

.carousel-3d-wrapper::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  pointer-events: none;
  border-radius: 15px;
}

.carousel-3d-container {
  height: 400px;
  perspective: 1200px;
  position: relative;
}

.carousel-3d-track {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
}

.carousel-3d-slide {
  position: absolute;
  width: 320px;
  height: 240px;
  left: 50%;
  top: 50%;
  margin-left: -160px;
  margin-top: -120px;
  transition: all 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);
  cursor: pointer;
  transform-style: preserve-3d;
}

/* Posiciones del carrusel */
.carousel-3d-slide.active {
  transform: translateZ(0) scale(1.1);
  z-index: 10;
}

.carousel-3d-slide.prev {
  transform: translateX(-200px) translateZ(-100px) rotateY(35deg) scale(0.8);
  z-index: 9;
}

.carousel-3d-slide.next {
  transform: translateX(200px) translateZ(-100px) rotateY(-35deg) scale(0.8);
  z-index: 9;
}

.carousel-3d-slide.prev-2 {
  transform: translateX(-350px) translateZ(-200px) rotateY(55deg) scale(0.6);
  z-index: 8;
  opacity: 0.7;
}

.carousel-3d-slide.next-2 {
  transform: translateX(350px) translateZ(-200px) rotateY(-55deg) scale(0.6);
  z-index: 8;
  opacity: 0.7;
}

/* Slides que no están visibles */
.carousel-3d-slide:not(.active):not(.prev):not(.next):not(.prev-2):not(.next-2) {
  opacity: 0;
  transform: translateZ(-300px) scale(0.5);
}

.slide-content {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
}

.slide-frame {
  width: 100%;
  height: 200px;
  background: linear-gradient(145deg, #ffffff, #e6e6e6);
  border-radius: 15px;
  padding: 12px;
  box-shadow:
    0 25px 50px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  position: relative;
  overflow: hidden;
}

.slide-frame::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, transparent 50%);
  pointer-events: none;
  border-radius: 15px;
}

.slide-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.slide-reflection {
  position: absolute;
  bottom: -20px;
  left: 12px;
  right: 12px;
  height: 40px;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.1), transparent);
  border-radius: 0 0 8px 8px;
  transform: scaleY(-1);
  opacity: 0.3;
}

.slide-caption {
  position: absolute;
  bottom: -40px;
  left: 0;
  right: 0;
  text-align: center;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.slide-caption p {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.9;
}

/* Controles del carrusel */
.carousel-controls {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  padding: 0 1rem;
  pointer-events: none;
}

.carousel-btn {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  pointer-events: all;
}

.carousel-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

/* Indicadores */
.carousel-indicators {
  position: absolute;
  bottom: 1rem;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 8px;
}

.indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.indicator.active {
  background: white;
  transform: scale(1.2);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
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
  color: var(--color-primary);
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
  background-color: var(--color-primary);
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
  background-color: var(--color-accent);
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
  background: var(--color-primary);
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
@media (max-width: 1024px) {
  .destination-view {
    padding: 1.5rem;
  }

  .carousel-3d-container {
    height: 350px;
  }

  .carousel-3d-slide {
    width: 280px;
    height: 210px;
    margin-left: -140px;
    margin-top: -105px;
  }

  .slide-frame {
    height: 180px;
  }
}

@media (max-width: 768px) {
  .destination-view {
    padding: 1rem;
  }

  .title-container h1 {
    font-size: 2rem;
  }

  .destination-content {
    padding: 1.5rem 1rem;
    gap: 1.5rem;
  }

  .carousel-3d-wrapper {
    padding: 2rem 1rem;
  }

  .carousel-3d-container {
    height: 300px;
  }

  .carousel-3d-slide {
    width: 250px;
    height: 180px;
    margin-left: -125px;
    margin-top: -90px;
  }

  .slide-frame {
    height: 150px;
  }

  .carousel-3d-slide.prev {
    transform: translateX(-150px) translateZ(-80px) rotateY(25deg) scale(0.7);
  }

  .carousel-3d-slide.next {
    transform: translateX(150px) translateZ(-80px) rotateY(-25deg) scale(0.7);
  }

  .carousel-3d-slide.prev-2,
  .carousel-3d-slide.next-2 {
    display: none;
  }

  .carousel-btn {
    width: 40px;
    height: 40px;
    font-size: 1.2rem;
  }

  .modal-content {
    max-width: 90vw;
  }

  .modal-image {
    max-height: 50vh;
  }

  .info-section {
    padding: 1.25rem;
  }

  .info-section h2 {
    font-size: 1.3rem;
  }

  .btn-location {
    padding: 0.75rem;
    font-size: 0.9rem;
  }
}

@media (max-width: 576px) {
  .destination-view {
    padding: 0.75rem;
  }

  .title-container h1 {
    font-size: 1.8rem;
  }

  .header-line {
    width: 60px;
    height: 3px;
  }

  .destination-content {
    padding: 1rem;
    border-radius: 6px;
  }

  .carousel-3d-wrapper {
    padding: 1.5rem 0.75rem;
    border-radius: 15px;
  }

  .carousel-3d-container {
    height: 250px;
  }

  .carousel-3d-slide {
    width: 200px;
    height: 150px;
    margin-left: -100px;
    margin-top: -75px;
  }

  .slide-frame {
    height: 120px;
    padding: 8px;
  }

  .carousel-btn {
    width: 36px;
    height: 36px;
    font-size: 1rem;
  }

  .indicator {
    width: 8px;
    height: 8px;
  }

  .modal-content {
    padding: 1rem;
    max-width: 95vw;
  }

  .modal-image {
    max-height: 40vh;
  }

  .modal-close {
    top: -30px;
    font-size: 1.5rem;
  }

  .nav-button {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }
}

@media (max-width: 400px) {
  .title-container h1 {
    font-size: 1.5rem;
  }

  .carousel-3d-container {
    height: 220px;
  }

  .carousel-3d-slide {
    width: 180px;
    height: 135px;
    margin-left: -90px;
    margin-top: -67.5px;
  }

  .slide-frame {
    height: 110px;
  }

  .slide-caption p {
    font-size: 0.8rem;
  }

  .info-section h2 {
    font-size: 1.2rem;
  }

  .info-section p {
    font-size: 0.9rem;
  }

  .btn-location {
    font-size: 0.85rem;
  }
}
</style>

