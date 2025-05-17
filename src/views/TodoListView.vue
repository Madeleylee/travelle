<template>
    <div class="lista-container">
        <div class="container py-5">
            <h1 class="text-center mb-4">Mi Lista de Viajes</h1>

            <!-- Contenido placeholder -->
            <div class="row justify-content-center">
                <div class="col-md-8">
                    <div class="card shadow-sm">
                        <div class="card-body text-center py-5">
                            <i class="bi bi-list-check display-1 text-primary mb-3"></i>
                            <h2 class="mb-3">¡Página protegida!</h2>
                            <p class="lead">Esta es la página de lista de viajes. Solo los usuarios autenticados pueden
                                verla.</p>
                            <p>Aquí podrás planificar tus próximos viajes y hacer listas de lugares para visitar.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
// Aquí puedes añadir la lógica para gestionar la lista de viajes
</script>

<style scoped>
.lista-container {
    min-height: 80vh;
    padding-top: 2rem;
}

h1 {
    color: var(--color-primary);
    margin-bottom: 2rem;
}
</style>
  
