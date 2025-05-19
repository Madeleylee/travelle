<!-- src/views/TestEmailView.vue -->
<template>
    <div class="container py-5">
        <h1 class="mb-4">Prueba de Servicio de Correo</h1>
        <div class="card">
            <div class="card-body">
                <div class="mb-3">
                    <label for="emailInput" class="form-label">Correo electrónico de prueba:</label>
                    <input type="email" class="form-control" id="emailInput" v-model="testEmail"
                        placeholder="tu@email.com">
                </div>
                <button class="btn btn-primary" @click="sendTestEmail" :disabled="loading || !testEmail">
                    {{ loading ? 'Enviando...' : 'Enviar correo de prueba' }}
                </button>

                <div v-if="result" class="mt-3 p-3" :class="resultClass">
                    <strong>{{ result.success ? '✅ Éxito:' : '❌ Error:' }}</strong>
                    {{ result.message }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { enviarCorreoNotificacion } from '@/services/emailService';

const testEmail = ref('');
const loading = ref(false);
const result = ref(null);

const resultClass = computed(() => {
    if (!result.value) return '';
    return result.value.success
        ? 'bg-success-subtle text-success'
        : 'bg-danger-subtle text-danger';
});

async function sendTestEmail() {
    if (!testEmail.value) return;

    loading.value = true;
    result.value = null;

    try {
        const response = await enviarCorreoNotificacion(
            testEmail.value,
            "Prueba de Servicio de Correo - Travelle",
            `
        <h2>¡Prueba exitosa!</h2>
        <p>Si estás viendo este correo, el servicio de correo de Travelle está funcionando correctamente.</p>
        <p>Fecha y hora de la prueba: ${new Date().toLocaleString()}</p>
      `
        );

        if (response.success) {
            result.value = {
                success: true,
                message: 'Correo enviado correctamente. Por favor, verifica tu bandeja de entrada.'
            };
        } else {
            result.value = {
                success: false,
                message: response.error || 'Error desconocido al enviar el correo.'
            };
        }
    } catch (error) {
        result.value = {
            success: false,
            message: error.message || 'Error inesperado al enviar el correo.'
        };
    } finally {
        loading.value = false;
    }
}
</script>