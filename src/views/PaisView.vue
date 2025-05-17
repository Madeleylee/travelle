<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DestinosPorCiudad from '@/components/DestinosPorCiudad.vue';
import { getPaisesConCiudades, getLugaresPorCiudad } from '@/composables/useDatabase';

const route = useRoute();
const router = useRouter();

const nombrePais = computed(() => route.params.nombrePais);
const pais = ref(null);
const ciudadSeleccionada = ref(null);
const lugarSeleccionado = ref(null);
const ciudadesConLugares = ref([]);
const loading = ref(true);
const error = ref(null);

// Cargar todas las ciudades y sus lugares
async function cargarCiudadesConLugares(paisActual) {
    try {
        loading.value = true;
        error.value = null;
        ciudadesConLugares.value = [];

        console.log('Cargando ciudades para país:', paisActual);

        if (!paisActual.ciudades || !Array.isArray(paisActual.ciudades)) {
            console.error('El país no tiene ciudades o no es un array:', paisActual);
            error.value = 'No se encontraron ciudades para este país';
            return;
        }

        for (const ciudad of paisActual.ciudades) {
            console.log('Procesando ciudad:', ciudad);

            // Usar id_ciudad que es el nombre correcto del campo
            const ciudadId = ciudad.id_ciudad;

            if (!ciudadId) {
                console.error('Ciudad sin ID:', ciudad);
                continue;
            }

            console.log(`Obteniendo lugares para ciudad ID: ${ciudadId}`);
            const lugares = await getLugaresPorCiudad(ciudadId);
            console.log(`Lugares obtenidos para ${ciudad.nombre}:`, lugares);

            ciudadesConLugares.value.push({
                nombre: ciudad.nombre,
                lugares: lugares || []
            });
        }

        console.log('Ciudades con lugares cargadas:', ciudadesConLugares.value);
    } catch (err) {
        console.error('Error al cargar ciudades con lugares:', err);
        error.value = 'Error al cargar los destinos';
    } finally {
        loading.value = false;
    }
}

const lugaresFiltrados = computed(() => {
    if (!ciudadSeleccionada.value) return [];
    const ciudad = ciudadesConLugares.value.find(c => c.nombre === ciudadSeleccionada.value);
    if (!ciudad) return [];
    let lugares = ciudad.lugares || [];
    if (lugarSeleccionado.value) {
        lugares = lugares.filter(lugar => lugar.nombre === lugarSeleccionado.value);
    }
    return lugares;
});

function selectCiudad(ciudad) {
    ciudadSeleccionada.value = ciudad;
    lugarSeleccionado.value = null;
    updateRouteQuery();
}

function updateRouteQuery() {
    router.replace({
        query: {
            ...(ciudadSeleccionada.value && { ciudad: ciudadSeleccionada.value }),
            ...(lugarSeleccionado.value && { lugar: lugarSeleccionado.value })
        }
    });
}

onMounted(async () => {
    try {
        const paises = await getPaisesConCiudades();
        console.log('Países obtenidos:', paises);

        pais.value = paises.find(p => p.nombre === nombrePais.value);
        console.log('País seleccionado:', pais.value);

        if (pais.value) {
            await cargarCiudadesConLugares(pais.value);
            ciudadSeleccionada.value = route.query.ciudad || null;
            lugarSeleccionado.value = route.query.lugar || null;
        } else {
            error.value = 'País no encontrado';
        }
    } catch (err) {
        console.error('Error al cargar datos iniciales:', err);
        error.value = 'Error al cargar los datos';
    } finally {
        loading.value = false;
    }
});

watch(() => route.params.nombrePais, async () => {
    try {
        loading.value = true;
        const paises = await getPaisesConCiudades();
        pais.value = paises.find(p => p.nombre === nombrePais.value);

        if (pais.value) {
            await cargarCiudadesConLugares(pais.value);
            ciudadSeleccionada.value = route.query.ciudad || null;
            lugarSeleccionado.value = route.query.lugar || null;
        } else {
            error.value = 'País no encontrado';
            ciudadesConLugares.value = [];
        }
    } catch (err) {
        console.error('Error al cambiar de país:', err);
        error.value = 'Error al cargar los datos';
        ciudadesConLugares.value = [];
    } finally {
        loading.value = false;
    }
});
</script>

<template>
    <div class="pais-view">
        <div v-if="loading" class="loading-container">
            <div class="spinner"></div>
            <p>Cargando destinos...</p>
        </div>

        <div v-else-if="error" class="error-container">
            <p>{{ error }}</p>
            <button @click="$router.go(0)" class="retry-button">Reintentar</button>
        </div>

        <template v-else-if="pais">
            <h1>Destinos en {{ nombrePais }}</h1>

            <div class="ciudades-nav">
                <button @click="selectCiudad(null)" :class="{ active: !ciudadSeleccionada }" class="btn-ciudad">
                    Todos
                </button>
                <button v-for="ciudad in ciudadesConLugares" :key="ciudad.nombre" @click="selectCiudad(ciudad.nombre)"
                    :class="{ active: ciudadSeleccionada === ciudad.nombre }" class="btn-ciudad">
                    {{ ciudad.nombre }}
                </button>
            </div>

            <div v-if="ciudadesConLugares.length === 0" class="no-data">
                No se encontraron ciudades para este país.
            </div>

            <template v-else>
                <DestinosPorCiudad v-if="ciudadSeleccionada" :nombrePais="nombrePais" :nombreCiudad="ciudadSeleccionada"
                    :lugares="lugaresFiltrados" />

                <template v-else>
                    <div v-for="ciudad in ciudadesConLugares" :key="ciudad.nombre" class="ciudad-section">
                        <h2 class="ciudad-titulo">{{ ciudad.nombre }}</h2>
                        <div v-if="ciudad.lugares && ciudad.lugares.length > 0">
                            <DestinosPorCiudad :nombrePais="nombrePais" :nombreCiudad="ciudad.nombre"
                                :lugares="ciudad.lugares" />
                        </div>
                        <div v-else class="no-data">
                            No hay lugares disponibles para esta ciudad.
                        </div>
                    </div>
                </template>
            </template>
        </template>

        <div v-else class="error-container">
            <p>País no encontrado</p>
            <button @click="$router.push('/')" class="retry-button">Volver al inicio</button>
        </div>
    </div>
</template>

<style scoped>
.pais-view {
    padding: 2rem;
    padding-top: 5rem;
}

h1 {
    color: var(--color-primary);
    font-size: 2.5rem;
    margin-bottom: 2rem;
    text-align: center;
}

.ciudades-nav {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    justify-content: center;
    margin-bottom: 2rem;
}

.btn-ciudad {
    padding: 0.5rem 1rem;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 1rem;
    color: var(--color-text);
    border-bottom: 2px solid transparent;
    transition: all 0.3s ease;
}

.btn-ciudad.active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
}

.ciudad-section {
    margin-bottom: 3rem;
}

.ciudad-titulo {
    color: var(--color-text);
    margin-bottom: 1rem;
    font-size: 1.5rem;
}

.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-top-color: var(--color-primary);
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 1rem;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.error-container,
.no-data {
    text-align: center;
    padding: 2rem;
    color: #666;
}

.retry-button {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background-color: var(--color-primary);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

@media (max-width: 1024px) {
    .pais-view {
        padding: 2rem;
        padding-top: 4rem;
    }
}

@media (max-width: 768px) {
    .pais-view {
        padding: 2rem;
        padding-top: 4rem;
    }

    .ciudades-nav {
        gap: 0.5rem;
    }

    .btn-ciudad {
        font-size: 0.9rem;
    }
}
</style>