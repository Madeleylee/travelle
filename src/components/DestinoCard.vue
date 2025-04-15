<script setup>
import { defineProps } from 'vue';
import data from '../assets/data/data.json';

// Definición de las props que el componente espera recibir
const props = defineProps({
    destino: {
        type: Object,
        required: true
    },
    nombrePais: {
        type: String,
        required: true
    }
});

// Función para obtener la ciudad a la que pertenece un destino
function getCiudad(nombreDestino) {
    const pais = data.paises.find(p => p.name === props.nombrePais);
    if (pais) {
        for (const [nombreCiudad, ciudad] of Object.entries(pais.ciudades)) {
            if (ciudad.lugares.some(lugar => lugar.nombre === nombreDestino)) {
                return nombreCiudad;
            }
        }
    }
    return '';
}
</script>

<template>
    <!-- Tarjeta de destino con imagen, información y enlace para ver más -->
    <div class="destino-card">
        <!-- Imagen del destino -->
        <img :src="destino.rutaImagen[0]" :alt="destino.nombre" class="destino-imagen">
        <!-- Información del destino -->
        <div class="destino-info">
            <h3>{{ destino.nombre }}</h3>
            <p>{{ destino.tipo }}</p>
            <p>Precio: {{ destino.precio === 0 ? 'Gratis' : `${destino.precio}€` }}</p>
            <p>Valoración: {{ destino.valoracion }} ⭐</p>
        </div>
        <!-- Enlace para ver más detalles del destino -->
        <router-link
            :to="{ name: 'Destino', params: { nombrePais, nombreCiudad: getCiudad(destino.nombre), nombreDestino: destino.nombre } }"
            class="ver-mas-btn">
            Ver más
        </router-link>
    </div>
</template>

<style scoped>
/* Estilos específicos para la tarjeta de destino */
.destino-card {
    background-color: var(--color-backgroundCard);
    border-radius: 8px;
    box-shadow: var(--color-primary);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 400px;
    width: 100%;
}

/* Estilos para la imagen del destino */
.destino-imagen {
    width: 100%;
    height: 200px;
    object-fit: cover;
}

/* Estilos para la información del destino */
.destino-info {
    padding: 1rem;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
}

/* Estilos para el título del destino */
h3 {
    margin: 0 0 0.5rem;
    font-size: 1.2rem;
    color: var(--color-primary);
}

/* Estilos para los párrafos de información */
p {
    margin: 0 0 0.5rem;
    font-size: 0.9rem;
    color: var(--color-text);
}

/* Estilos para el botón de ver más */
.ver-mas-btn {
    background-color: var(--color-primary);
    color: var(--color-textWhite);
    text-decoration: none;
    padding: 0.5rem;
    text-align: center;
    transition: background-color 0.3s;
    margin-top: auto;
}

/* Efecto hover para el botón de ver más */
.ver-mas-btn:hover {
    background-color: var(--color-accent);
}

/* Media queries para ajustar el diseño en pantallas más pequeñas */
@media (max-width: 1024px) {
    .destino-card {
        height: 350px;
    }

    .destino-imagen {
        height: 150px;
    }

    h3 {
        font-size: 1.1rem;
    }

    p {
        font-size: 0.8rem;
    }
}

@media (max-width: 768px) {
    .destino-card {
        height: 300px;
    }

    .destino-imagen {
        height: 120px;
    }

    h3 {
        font-size: 1rem;
    }

    p {
        font-size: 0.75rem;
    }
}
</style>
