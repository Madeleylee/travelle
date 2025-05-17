<script setup>
import { ref, computed, onMounted } from 'vue';
import DestinoCard from '../components/DestinoCard.vue';
import { getDestinosAleatorios } from '@/composables/useDatabase'; // Nueva función que crearemos

// Estado local para guardar los destinos
const destinos = ref([]);

// Cargar destinos aleatorios al montar el componente
onMounted(async () => {
    destinos.value = await getDestinosAleatorios(6); // Pedimos 6 destinos
});

// Computada por si quieres hacer algún filtrado extra
const destinosAleatorios = computed(() => destinos.value);
</script>

<template>
    <div class="home">
        <section class="hero">
            <h1>Descubre Europa con Travelle</h1>
            <p>Comparte tus aventuras y encuentra nuevos destinos</p>
        </section>

        <section class="destinos-destacados">
            <h2>Destinos Destacados</h2>
            <div class="destinos-grid">
                <!-- Mostrar los destinos obtenidos -->
                <DestinoCard v-for="destino in destinosAleatorios"
                    :key="`${destino.nombre}-${destino.ciudad}-${destino.pais}`" :destino="destino"
                    :nombrePais="destino.pais" :nombreCiudad="destino.ciudad" />

            </div>
        </section>
    </div>
</template>

<style scoped>
.home {
    padding: 2rem;
    padding-top: 5rem;
}

.hero {
    text-align: center;
    margin-bottom: 2rem;
}

h1 {
    color: var(--color-primary);
    font-size: 2.5rem;
    margin-bottom: 1rem;
}

h2 {
    color: var(--color-primary);
    font-size: 2rem;
    margin-bottom: 1rem;
    text-align: center;
}

.destinos-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
    justify-content: center;
}

@media (max-width: 1024px) {
    .home {
        padding: 2rem;
        padding-top: 4rem;
    }

    .destinos-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 768px) {
    .home {
        padding: 2rem;
        padding-top: 3rem;
    }

    .destinos-grid {
        grid-template-columns: 1fr;
    }
}
</style>
