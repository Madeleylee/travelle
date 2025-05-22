<script setup>
// Importaciones de Vue y Vue Router
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
// Importaciones de funciones de base de datos y componentes
import { getPaisesConCiudades, getLugaresPorCiudad } from '@/composables/useDatabase';
import DestinoCard from "@/components/DestinoCard.vue";

// Obtener la instancia de la ruta actual para acceder a los parámetros
const route = useRoute();

// Variables reactivas
const lugares = ref([]); // Array para almacenar los lugares/destinos de la ciudad
const nombrePais = computed(() => route.params.nombrePais); // Nombre del país extraído de los parámetros de la URL
const nombreCiudad = computed(() => route.params.nombreCiudad); // Nombre de la ciudad extraído de los parámetros de la URL
const ciudadEncontrada = ref(false); // Bandera para controlar si se encontró la ciudad

// Hook de ciclo de vida - Se ejecuta cuando el componente se monta
onMounted(async () => {
    // Obtener la lista de países con sus ciudades desde la base de datos
    const paises = await getPaisesConCiudades();

    // Buscar el país que coincide con el parámetro de la URL (insensible a mayúsculas/minúsculas)
    const pais = paises.find(p => p.nombre.trim().toLowerCase() === nombrePais.value.trim().toLowerCase());

    if (pais) {
        // Si se encuentra el país, buscar la ciudad dentro de ese país
        const ciudad = pais.ciudades.find(c => c.nombre.trim().toLowerCase() === nombreCiudad.value.trim().toLowerCase());

        if (ciudad) {
            // Si se encuentra la ciudad, marcarla como encontrada
            ciudadEncontrada.value = true;
            // Obtener los lugares/destinos de esa ciudad usando su ID
            lugares.value = await getLugaresPorCiudad(ciudad.id);
        } else {
            // Si no se encuentra la ciudad, mantener la bandera en falso
            ciudadEncontrada.value = false;
        }
    } else {
        // Si no se encuentra el país, mantener la bandera en falso
        ciudadEncontrada.value = false;
    }
});
</script>

<template>
    <!-- Vista principal que se muestra cuando se encuentra la ciudad -->
    <div class="ciudad-view" v-if="ciudadEncontrada">
        <!-- Título de la página con el nombre de la ciudad -->
        <div class="ciudad-header">
            <h1>Destinations in {{ nombreCiudad }}</h1>
            <p v-if="lugares.length > 0">Discover {{ lugares.length }} amazing places in {{ nombreCiudad }}</p>
        </div>

        <!-- Contenedor para los lugares/destinos -->
        <div class="lugares-container">
            <!-- Cuadrícula de tarjetas de destino -->
            <div class="lugares-grid">
                <!-- Renderizar una tarjeta por cada lugar encontrado -->
                <DestinoCard v-for="lugar in lugares" :key="lugar.id_lugar" :destino="lugar" :nombrePais="nombrePais"
                    :nombreCiudad="nombreCiudad" />
            </div>
        </div>
    </div>

    <!-- Vista de error que se muestra cuando no se encuentra la ciudad -->
    <div v-else class="error-view">
        <h1>City not found</h1>
        <!-- Enlace para volver a la página principal -->
        <router-link to="/" class="btn-volver">Return to home</router-link>
    </div>
</template>

<style scoped>
/* Estilos para la vista principal de la ciudad */
.ciudad-view {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    padding-top: 5rem;
}

/* Estilos para la cabecera de la ciudad */
.ciudad-header {
    margin-bottom: 2.5rem;
    text-align: center;
    position: relative;
}

/* Estilos para el título principal */
.ciudad-header h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    color: var(--color-primary);
    font-weight: 700;
    position: relative;
    display: inline-block;
}

/* Línea decorativa debajo del título */
.ciudad-header h1::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 4px;
    background-color: var(--color-accent);
    border-radius: 2px;
}

/* Estilos para el párrafo de la cabecera */
.ciudad-header p {
    color: #6c757d;
    font-size: 1.1rem;
    margin-top: 1rem;
}

/* Contenedor para los lugares/destinos */
.lugares-container {
    padding: 0 1rem;
}

/* Cuadrícula para organizar las tarjetas de destino */
.lugares-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1.5rem;
}

/* Estilos para la vista de error */
.error-view {
    text-align: center;
    padding: 4rem 2rem;
}

/* Estilos para el botón de volver */
.btn-volver {
    display: inline-block;
    margin-top: 1rem;
    padding: 0.6rem 1.5rem;
    background: linear-gradient(135deg, var(--color-primary), #2c3e50);
    color: white;
    text-decoration: none;
    border-radius: 25px;
    font-weight: 500;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Efecto hover para el botón de volver */
.btn-volver:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

/* Media query para pantallas medianas (tablets) */
@media (max-width: 1024px) {
    .ciudad-view {
        padding: 2rem;
        padding-top: 4rem;
    }

    .lugares-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

/* Media query para pantallas pequeñas (móviles) */
@media (max-width: 768px) {
    .ciudad-header h1 {
        font-size: 2rem;
    }

    .lugares-grid {
        grid-template-columns: 1fr;
        max-width: 400px;
        margin: 0 auto;
    }
}
</style>
