<script setup>
// Importaciones necesarias

// Importación del componente DestinoCard
// Este componente se utiliza para mostrar la información de cada destino en la ciudad.
import DestinoCard from "../components/DestinoCard.vue";

// Importación de datos de países, ciudades y lugares
// Este archivo JSON contiene la información estructurada que se utilizará en el componente.
import data from "../assets/data/data.json";

// Obtener la ruta actual para acceder a los parámetros de la URL
const route = useRoute();

// Propiedades computadas para obtener el nombre del país y la ciudad desde los parámetros de la ruta
const nombrePais = computed(() => route.params.nombrePais);
const nombreCiudad = computed(() => route.params.nombreCiudad);

// Propiedad computada para encontrar la ciudad en los datos importados
// Busca el país y luego la ciudad dentro de ese país. Si no encuentra la ciudad, devuelve null.
const ciudad = computed(() => {
    const pais = data.paises.find(p => p.name === nombrePais.value);
    return pais ? pais.ciudades[nombreCiudad.value] : null;
});
</script>

<template>
    <!-- Estructura HTML del componente -->
    <div class="ciudad-view" v-if="ciudad">
        <!-- Título que muestra el nombre de la ciudad -->
        <h1>Destinos en {{ nombreCiudad }}</h1>
        <!-- Contenedor para los lugares dentro de la ciudad -->
        <div class="lugares-container">
            <div class="lugares-grid">
                <!-- Iteración sobre los lugares de la ciudad y renderizado del componente DestinoCard para cada lugar -->
                <DestinoCard v-for="lugar in ciudad.lugares" :key="lugar.nombre" :destino="lugar"
                    :nombrePais="nombrePais" :nombreCiudad="nombreCiudad" />
            </div>
        </div>
    </div>
    <!-- Vista de error si la ciudad no se encuentra -->
    <div v-else class="error-view">
        <h1>Ciudad no encontrada</h1>
        <!-- Enlace para volver al inicio -->
        <router-link to="/" class="btn-volver">Volver al inicio</router-link>
    </div>
</template>

<style scoped>
/* Estilos específicos para este componente */

.ciudad-view {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    padding-top: 5rem;
}

/* Estilo para el título principal */
h1 {
    color: var(--color-primary);
    font-size: 2.5rem;
    margin-bottom: 2rem;
    text-align: center;
}

/* Contenedor para los lugares */
.lugares-container {
    padding: 0 1rem;
}

/* Cuadrícula para organizar los lugares */
.lugares-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
}

/* Estilo para la vista de error */
.error-view {
    text-align: center;
    padding: 4rem 2rem;
}

/* Estilo para el botón de volver */
.btn-volver {
    display: inline-block;
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background-color: var(--color-primary);
    color: var(--color-textWhite);
    text-decoration: none;
    border-radius: 4px;
    transition: background-color 0.3s;
}

/* Efecto hover para el botón de volver */
.btn-volver:hover {
    background-color: var(--color-accent);
}

/* Media queries para ajustar el diseño en pantallas más pequeñas */
@media (max-width: 1024px) {
    .ciudad-view {
        padding: 2rem;
        padding-top: 4rem;
    }

    .lugares-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 768px) {
    .ciudad-view {
        padding: 2rem;
        padding-top: 4rem;
    }

    h1 {
        font-size: 2rem;
    }

    .lugares-grid {
        grid-template-columns: 1fr;
        max-width: 400px;
        margin: 0 auto;
    }
}
</style>
