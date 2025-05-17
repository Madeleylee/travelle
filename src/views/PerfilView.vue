<template>
    <div class="perfil-container">
        <div class="container py-5">
            <h1 class="text-center mb-4">Mi Perfil</h1>

            <!-- Contenido placeholder -->
            <div class="row justify-content-center">
                <div class="col-md-8">
                    <div class="card shadow-sm">
                        <div class="card-body text-center py-5">
                            <i class="bi bi-person-circle display-1 text-primary mb-3"></i>
                            <h2 class="mb-3">¡Página protegida!</h2>
                            <p class="lead">Esta es la página de perfil. Solo los usuarios autenticados pueden verla.
                            </p>
                            <p>Aquí podrás ver y editar tu información personal.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useAuth } from '@/composables/useAuth';

// Call the hook at the top level
const { getUsuarioActual } = useAuth();
const usuario = getUsuarioActual();
</script>

<style scoped>
.perfil-container {
    min-height: 80vh;
    padding-top: 2rem;
}

h1 {
    color: var(--color-primary);
    margin-bottom: 2rem;
}
</style>
  
