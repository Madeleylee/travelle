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
    <div class="ciudad-page">
        <div class="container py-4">
            <!-- Vista principal que se muestra cuando se encuentra la ciudad -->
            <div v-if="ciudadEncontrada">
                <!-- Cabecera de la página con título y contador de destinos -->
                <div class="ciudad-header">
                    <h1>Destinations in {{ nombreCiudad }}</h1>
                    <p v-if="lugares.length > 0">Discover {{ lugares.length }} amazing places in {{ nombreCiudad }}</p>
                </div>

                <!-- Cuadrícula de tarjetas de destino -->
                <div class="lugares-grid">
                    <DestinoCard v-for="lugar in lugares" :key="lugar.id_lugar" :destino="lugar"
                        :nombrePais="nombrePais" :nombreCiudad="nombreCiudad" />
                </div>
            </div>

            <!-- Vista de error que se muestra cuando no se encuentra la ciudad -->
            <div v-else class="no-results text-center py-5">
                <i class="bi bi-geo-alt-fill display-1 text-muted"></i>
                <h3 class="mt-3">City not found</h3>
                <p class="text-muted">The city you're looking for doesn't exist or has been removed.</p>
                <router-link to="/" class="btn-volver">
                    <span>Return to home</span>
                    <i class="bi bi-arrow-right"></i>
                </router-link>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Estilos para la página de ciudad */
.ciudad-page {
    min-height: 100vh;
    background-color: var(--color-background);
}

/* Estilos para la cabecera de la página */
.ciudad-header {
    margin-bottom: 2.5rem;
    text-align: center;
    position: relative;
}

/* Estilos para el título principal */
.ciudad-header h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    color: var(--color-primary, #3a506b);
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
    background-color: var(--color-accent, #ff6b6b);
    border-radius: 2px;
}

/* Estilos para el párrafo de la cabecera */
.ciudad-header p {
    color: #6c757d;
    font-size: 1.1rem;
    margin-top: 1rem;
}

/* Cuadrícula para organizar las tarjetas de destino */
.lugares-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1.5rem;
}

/* Estilos para el mensaje de no resultados */
.no-results {
    color: var(--color-text);
}

/* Media query para pantallas medianas */
@media (max-width: 767.98px) {
    .lugares-grid {
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 1rem;
    }

    .btn-volver {
        padding: 0.5rem 1.2rem;
        font-size: 0.9rem;
    }
}

/* Media query para pantallas pequeñas */
@media (max-width: 576px) {
    .ciudad-header h1 {
        font-size: 1.8rem;
    }

    .ciudad-header p {
        font-size: 1rem;
    }

    .lugares-grid {
        grid-template-columns: 1fr;
        max-width: 400px;
        margin: 0 auto;
    }

    .btn-volver {
        padding: 0.4rem 1rem;
        font-size: 0.85rem;
    }
}
</style>
