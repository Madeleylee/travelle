<script setup>
// Importaciones necesarias
import { ref, computed, onMounted } from 'vue';
import DestinoCard from '../components/DestinoCard.vue';
import { getDestinosAleatorios } from '@/composables/useDatabase';

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
        <section class="countries-header">
            <h1>Discover Europe with Travelle</h1>
            <p>Share your adventures and find new destinations</p>
        </section>

        <section class="destinos-destacados">
            <h2>Featured Destinations</h2>
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

/* Estilos para la cabecera de la página */
.countries-header {
    margin-bottom: 2.5rem;
    text-align: center;
    position: relative;
}

/* Estilos para el título principal */
.countries-header h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    color: var(--color-primary, #3a506b);
    font-weight: 700;
    position: relative;
    display: inline-block;
}

/* Línea decorativa debajo del título */
.countries-header h1::after {
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
.countries-header p {
    color: #6c757d;
    font-size: 1.1rem;
    margin-top: 1rem;
}

/* Ajustes responsivos para la cabecera */
@media (max-width: 576px) {
    .countries-header h1 {
        font-size: 1.8rem;
    }

    .countries-header p {
        font-size: 1rem;
    }
}
</style>
