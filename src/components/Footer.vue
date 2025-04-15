<script setup>
import { computed } from 'vue';
import data from '../assets/data/data.json';

// Propiedad computada para obtener el año actual
const currentYear = computed(() => new Date().getFullYear());

// Propiedad computada para obtener los datos de los países
const paises = computed(() => data.paises);

// Función para desplazarse suavemente hacia la parte superior de la página
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth' // Habilita el desplazamiento suave
    });
}
</script>

<template>
    <footer class="footer">
        <div class="footer-content">
            <!-- Sección de marca -->
            <div class="footer-section brand">
                <h3>Travelle</h3>
                <p>Descubre Europa con nosotros</p>
                <!-- Enlace para volver arriba -->
                <a href="#" @click.prevent="scrollToTop" class="scroll-top">Volver arriba</a>
            </div>
            <!-- Sección de países -->
            <div class="footer-section countries">
                <h4>Explora nuevos destinos</h4>
                <!-- Lista de países con enlaces -->
                <ul class="paises-list">
                    <li v-for="pais in paises" :key="pais.id">
                        <router-link :to="{ name: 'Pais', params: { nombrePais: pais.name } }">
                            {{ pais.name }}
                        </router-link>
                    </li>
                </ul>
            </div>
        </div>
        <!-- Parte inferior del pie de página -->
        <div class="footer-bottom">
            <p>&copy; {{ currentYear }} Travelle. Todos los derechos reservados.</p>
        </div>
    </footer>
</template>

<style scoped>
/* Estilos específicos para el pie de página */
.footer {
    background-color: var(--color-primary);
    color: var(--color-textWhite);
    padding: 3rem 0 1rem;
    font-family: 'Playfair Display', serif;
}

/* Contenedor de contenido del pie de página */
.footer-content {
    display: flex;
    justify-content: space-between;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
}

/* Secciones del pie de página */
.footer-section {
    margin-bottom: 1.5rem;
}

/* Sección de marca */
.footer-section.brand {
    flex: 1;
}

/* Sección de países */
.footer-section.countries {
    flex: 2;
}

/* Estilos para encabezados en las secciones */
.footer-section h3 {
    font-size: 2rem;
    margin-bottom: 1rem;
    font-weight: 700;
}

.footer-section h4 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    font-weight: 600;
}

/* Estilos para párrafos en las secciones */
.footer-section p {
    font-size: 1.1rem;
    margin-bottom: 1rem;
}

/* Estilo para el enlace de desplazamiento hacia arriba */
.scroll-top {
    display: inline-block;
    color: var(--color-accent);
    text-decoration: none;
    font-weight: 600;
    transition: color 0.3s;
}

/* Efecto hover para el enlace de desplazamiento hacia arriba */
.scroll-top:hover {
    color: var(--color-textWhite);
}

/* Estilos para la lista de países */
.paises-list {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    list-style-type: none;
    padding: 0;
}

/* Estilos para los enlaces de la lista de países */
.paises-list a {
    color: var(--color-textWhite);
    text-decoration: none;
    transition: color 0.3s;
    font-size: 1.1rem;
}

/* Efecto hover para los enlaces de la lista de países */
.paises-list a:hover {
    color: var(--color-accent);
}

/* Estilos para la parte inferior del pie de página */
.footer-bottom {
    text-align: center;
    padding-top: 2rem;
    margin-top: 2rem;
    border-top: 1px solid var(--color-text);
    font-size: 0.9rem;
}

/* Media queries para ajustar el diseño en pantallas más pequeñas */
@media (max-width: 768px) {
    .footer-content {
        flex-direction: column;
    }

    .footer-section {
        margin-bottom: 2rem;
    }

    .paises-list {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 480px) {
    .paises-list {
        grid-template-columns: 1fr;
    }
}
</style>
