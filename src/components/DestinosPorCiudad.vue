<script setup>
import DestinoCard from "./DestinoCard.vue";

// Definición de las props que el componente espera recibir
defineProps({
    nombrePais: {
        type: String,
        required: true
    },
    nombreCiudad: {
        type: String,
        required: true
    },
    lugares: {
        type: Array,
        required: true
    }
});
</script>

<template>
    <div class="destinos-por-ciudad">
        <!-- Cuadrícula para organizar los destinos -->
        <div class="lugares-grid">
            <!-- Iteración sobre los lugares y renderizado del componente DestinoCard para cada lugar -->
            <DestinoCard v-for="lugar in lugares" :key="lugar.nombre" :destino="lugar" :nombrePais="nombrePais"
                :nombreCiudad="nombreCiudad" />
        </div>
    </div>
</template>

<style scoped>
/* Estilos específicos para el contenedor de destinos */
.destinos-por-ciudad {
    margin-bottom: 2rem;
}

/* Estilos para la cuadrícula de lugares */
.lugares-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    /* Tres columnas iguales */
    gap: 2rem;
    /* Espacio entre elementos de la cuadrícula */
}

/* Media queries para ajustar el diseño en pantallas más pequeñas */
@media (max-width: 1024px) {
    .lugares-grid {
        grid-template-columns: repeat(2, 1fr);
        /* Dos columnas en pantallas medianas */
    }
}

@media (max-width: 768px) {
    .lugares-grid {
        grid-template-columns: 1fr;
        /* Una columna en pantallas pequeñas */
    }
}
</style>
