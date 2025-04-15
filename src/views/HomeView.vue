<script setup>
import { computed } from 'vue'; // Importa la función computed
import DestinoCard from '../components/DestinoCard.vue';
import data from '../assets/data/data.json';

// Obtiene todos los destinos de todos los países y ciudades
const todosLosDestinos = computed(() =>
    // FlatMap mapea todos los países, luego todos las ciudades y luego todos los lugares
    data.paises.flatMap(pais =>
        Object.entries(pais.ciudades).flatMap(([nombreCiudad, ciudad]) =>
            ciudad.lugares.map(lugar => ({
                ...lugar,
                pais: pais.name,
                ciudad: nombreCiudad
            }))
        )
    )
);

// Obtiene 6 destinos aleatorios de todos los destinos 
const destinosAleatorios = computed(() => {
    //sort() ordena los destinos aleatoriamente
    const shuffled = [...todosLosDestinos.value].sort(() => 0.5 - Math.random());
   //slice() devuelve los 6 destinos aleatorios
    return shuffled.slice(0, 6);

});
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
                <!-- Muestra 6 destinos aleatorios en la sección Destinos Destacados -->
                <DestinoCard v-for="destino in destinosAleatorios"
                    :key="`${destino.nombre}-${destino.ciudad}-${destino.pais}`" :destino="destino"
                    :nombrePais="destino.pais" :nombreCiudad="destino.ciudad" />
                <!-- :key se utiliza para identificar de manera única cada destino en la lista
                :destino="destino" se pasa la información del destino a la tarjeta -->
            </div>
        </section>
    </div>
</template>


<style scoped>
/* Estilos para la página de inicio */
.home {
    padding: 2rem;
    padding-top: 5rem;
}

/* Estilos para la sección hero */
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

/* Grid para mostrar los destinos destacados */
.destinos-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
    justify-content: center;
}

/* Responsive design */
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