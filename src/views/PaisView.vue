<script setup>
// Importaciones necesarias de Vue y Vue Router
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
// Importación del componente DestinosPorCiudad
import DestinosPorCiudad from "../components/DestinosPorCiudad.vue";
import data from "../assets/data/data.json"; // Importación del json

// Obtener la ruta actual y el router para navegación
const route = useRoute();
const router = useRouter();

// Propiedad computada para obtener el nombre del pais 
const nombrePais = computed(() => route.params.nombrePais);

// Variables reactivas para almacenar la ciudad y el lugar seleccionados
const ciudadSeleccionada = ref(null);
const lugarSeleccionado = ref(null);


// Propiedad computada para encontrar el país en los datos importados
const pais = computed(() =>
    data.paises.find((p) => p.name === nombrePais.value)
);

// Propiedad computada para filtrar los lugares basados en la ciudad y lugar seleccionados
const lugaresFiltered = computed(() => {
    if (!pais.value || !ciudadSeleccionada.value) return [];
    let lugares = pais.value.ciudades[ciudadSeleccionada.value].lugares;
    if (lugarSeleccionado.value) {
        lugares = lugares.filter(lugar => lugar.nombre === lugarSeleccionado.value);
    }
    return lugares;
});

// Función para seleccionar una ciudad y actualizar la ruta
function selectCiudad(ciudad) {
    ciudadSeleccionada.value = ciudad;
    lugarSeleccionado.value = null;
    updateRouteQuery();
}

// Función para actualizar la ruta con los parámetros de consulta basados en la ciudad y lugar seleccionados
function updateRouteQuery() {
    router.replace({
        query: {
            ...(ciudadSeleccionada.value && { ciudad: ciudadSeleccionada.value }),
            ...(lugarSeleccionado.value && { lugar: lugarSeleccionado.value })
        }
    });
}

// Hook del ciclo de vida que se ejecuta al montar el componente
onMounted(() => {
    ciudadSeleccionada.value = route.query.ciudad || null;
    lugarSeleccionado.value = route.query.lugar || null;
});

// Observador que reacciona a cambios en el parámetro nombrePais de la ruta
watch(() => route.params.nombrePais, () => {
    ciudadSeleccionada.value = route.query.ciudad || null;
    lugarSeleccionado.value = route.query.lugar || null;
});
</script>

<template>
    <div class="pais-view" v-if="pais">
        <!-- Título con el nombre del país -->
        <h1>Destinos en {{ nombrePais }}</h1>
        <!-- Navegación de ciudades -->
        <div class="ciudades-nav">
            <!-- Botón para mostrar todos los destinos -->
            <button @click="selectCiudad(null)" :class="{ active: !ciudadSeleccionada }" class="btn-ciudad">
                Todos
            </button>
            <!-- Botones para seleccionar una ciudad específica -->
            <button v-for="(_, ciudad) in pais.ciudades" :key="ciudad" @click="selectCiudad(ciudad)"
                :class="{ active: ciudadSeleccionada === ciudad }" class="btn-ciudad">
                {{ ciudad }}
            </button>
        </div>
        <!-- Componente para mostrar destinos por ciudad si una ciudad está seleccionada -->
        <DestinosPorCiudad v-if="ciudadSeleccionada" :nombrePais="nombrePais" :nombreCiudad="ciudadSeleccionada"
            :lugares="lugaresFiltered" />
        <!-- Si no hay ciudad seleccionada, muestra todos los destinos por ciudad -->
        <template v-else>
            <div v-for="(lugares, ciudad) in pais.ciudades" :key="ciudad" class="ciudad-section">
                <h2 class="ciudad-titulo">{{ ciudad }}</h2>
                <DestinosPorCiudad :nombrePais="nombrePais" :nombreCiudad="ciudad" :lugares="lugares.lugares" />
            </div>
        </template>
    </div>
</template>

<style scoped>
/* Estilo para el contenedor principal */
.pais-view {
    padding: 2rem;
    padding-top: 5rem;
}

/* Estilo para el título principal */
h1 {
    color: var(--color-primary);
    /* Color principal definido en variables CSS */
    font-size: 2.5rem;
    margin-bottom: 2rem;
    text-align: center;
}

/* Contenedor de navegación de ciudades */
.ciudades-nav {
    display: flex;
    gap: 1rem;
    /* Espacio entre botones */
    flex-wrap: wrap;
    /* Permite que los botones se envuelvan en varias líneas */
    justify-content: center;
    margin-bottom: 2rem;
}

/* Estilo para los botones de ciudad */
.btn-ciudad {
    padding: 0.5rem 1rem;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 1rem;
    color: var(--color-text);
    /* Color de texto definido en variables CSS */
    border-bottom: 2px solid transparent;
    /* Borde inferior transparente por defecto */
    transition: all 0.3s ease;
    /* Transición suave para cambios de estilo */
}

/* Estilo para botones activos */
.btn-ciudad.active {
    color: var(--color-primary);
    /* Cambia el color del texto cuando está activo */
    border-bottom-color: var(--color-primary);
    /* Cambia el color del borde inferior */
}

/* Estilo para la cuadrícula de destinos */
.destinos-grid {
    display: grid;
    gap: 2rem;
    /* Espacio entre elementos de la cuadrícula */
}

/* Sección de cada ciudad */
.ciudad-section {
    margin-bottom: 3rem;
}

/* Título de cada ciudad */
.ciudad-titulo {
    color: var(--color-text);
    margin-bottom: 1rem;
    font-size: 1.5rem;
}

/* Cuadrícula de lugares dentro de cada ciudad */
.ciudad-lugares {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    /* Tres columnas iguales */
    gap: 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

/* Media queries para ajustar el diseño en pantallas más pequeñas */
@media (max-width: 1024px) {
    .pais-view {
        padding: 2rem;
        padding-top: 4rem;
    }

    .ciudad-lugares {
        grid-template-columns: repeat(2, 1fr);
        /* Dos columnas en pantallas medianas */
    }
}

@media (max-width: 768px) {
    .pais-view {
        padding: 2rem;
        padding-top: 4rem;
    }


    .ciudades-nav {
        gap: 0.5rem;
        /* Menos espacio entre botones en pantallas pequeñas */
    }

    .btn-ciudad {
        font-size: 0.9rem;
        /* Texto más pequeño en botones */
    }

    .ciudad-lugares {
        grid-template-columns: 1fr;
        /* Una columna en pantallas pequeñas */
        max-width: 400px;
        margin: 0 auto;
    }
}
</style>
