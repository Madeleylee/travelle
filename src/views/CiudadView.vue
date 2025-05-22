<script setup>
// Importaciones necesarias (Necessary imports)
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { getPaisesConCiudades, getLugaresPorCiudad } from '@/composables/useDatabase'; // funciones ya adaptadas (already adapted functions)
import DestinoCard from "@/components/DestinoCard.vue";

// Ruta actual (Current route)
const route = useRoute();

// Variables reactivas (Reactive variables)
const lugares = ref([]);
const nombrePais = computed(() => route.params.nombrePais);
const nombreCiudad = computed(() => route.params.nombreCiudad);
const ciudadEncontrada = ref(false);

// Obtener lugares de la ciudad (Get city places)
onMounted(async () => {
    const paises = await getPaisesConCiudades();

    // Buscar el país (Find the country)
    const pais = paises.find(p => p.nombre.trim().toLowerCase() === nombrePais.value.trim().toLowerCase());

    if (pais) {
        // Buscar la ciudad dentro del país (Find the city within the country)
        const ciudad = pais.ciudades.find(c => c.nombre.trim().toLowerCase() === nombreCiudad.value.trim().toLowerCase());

        if (ciudad) {
            ciudadEncontrada.value = true;
            lugares.value = await getLugaresPorCiudad(ciudad.id);
        }
    }
});
</script>

<template>
    <div class="ciudad-view" v-if="ciudadEncontrada">
        <h1>Destinations in {{ nombreCiudad }}</h1>
        <div class="lugares-container">
            <div class="lugares-grid">
                <DestinoCard v-for="lugar in lugares" :key="lugar.id_lugar" :destino="lugar" :nombrePais="nombrePais"
                    :nombreCiudad="nombreCiudad" />
            </div>
        </div>
    </div>

    <div v-else class="error-view">
        <h1>City not found</h1>
        <router-link to="/" class="btn-volver">Return to home</router-link>
    </div>
</template>

<style scoped>
.ciudad-view {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    padding-top: 5rem;
}

h1 {
    color: var(--color-primary);
    font-size: 2.5rem;
    margin-bottom: 2rem;
    text-align: center;
}

.lugares-container {
    padding: 0 1rem;
}

.lugares-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
}

.error-view {
    text-align: center;
    padding: 4rem 2rem;
}

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

.btn-volver:hover {
    background-color: var(--color-accent);
}

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