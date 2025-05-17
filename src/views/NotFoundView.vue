<template>
    <div class="not-found">
        <div class="container py-5 text-center">
            <h1 class="display-1">404</h1>
            <h2 class="mb-4">Página no encontrada</h2>
            <p class="lead mb-4">Lo sentimos, la página que estás buscando no existe o ha sido movida.</p>
            <router-link to="/" class="btn btn-primary">
                <i class="bi bi-house-door me-2"></i>Volver al inicio
            </router-link>
        </div>
    </div>
</template>

<style scoped>
.not-found {
    min-height: 80vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

h1 {
    color: var(--color-primary);
    font-weight: 700;
}

h2 {
    color: var(--color-text);
}
</style>
  
