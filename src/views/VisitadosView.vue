<template>
    <div class="visitados-container">
        <div class="container py-5">
            <h1 class="text-center mb-4">Mis Lugares Visitados</h1>

            <!-- Contenido placeholder -->
            <div class="row justify-content-center">
                <div class="col-md-8">
                    <div class="card shadow-sm">
                        <div class="card-body text-center py-5">
                            <i class="bi bi-check-circle-fill display-1 text-success mb-3"></i>
                            <h2 class="mb-3">¡Página protegida!</h2>
                            <p class="lead">Esta es la página de lugares visitados. Solo los usuarios autenticados
                                pueden verla.</p>
                            <p>Aquí podrás ver y gestionar todos los lugares que has visitado.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
// Aquí puedes añadir la lógica para cargar los lugares visitados
</script>

<style scoped>
.visitados-container {
    min-height: 80vh;
    padding-top: 2rem;
}

h1 {
    color: var(--color-primary);
    margin-bottom: 2rem;
}
</style>
  
