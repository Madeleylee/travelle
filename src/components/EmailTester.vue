<!-- src/components/EmailTester.vue -->
<template>
    <div class="email-tester">
        <h3>Prueba de envío de correos</h3>
        <div class="form-group">
            <label for="testEmail">Correo de prueba:</label>
            <input type="email" id="testEmail" v-model="testEmail" class="form-control"
                placeholder="correo@ejemplo.com">
        </div>
        <button @click="sendTestEmail" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Enviando...' : 'Enviar correo de prueba' }}
        </button>
        <div v-if="result" class="result mt-3" :class="result.success ? 'success' : 'error'">
            {{ result.success ? '✅ Correo enviado correctamente' : `❌ Error: ${result.error}` }}
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { enviarCorreoNotificacion } from '@/services/emailServices';

const testEmail = ref('');
const loading = ref(false);
const result = ref(null);

async function sendTestEmail() {
    if (!testEmail.value) {
        result.value = { success: false, error: 'Por favor, ingresa un correo electrónico' };
        return;
    }

    loading.value = true;
    result.value = null;

    try {
        result.value = await enviarCorreoNotificacion(
            testEmail.value,
            "Prueba de servicio de correo",
            `<h2>¡Prueba exitosa!</h2>
       <p>Si estás viendo este correo, el servicio de correo de Travelle está funcionando correctamente.</p>
       <p>Fecha y hora de la prueba: ${new Date().toLocaleString()}</p>`
        );
    } catch (error) {
        result.value = { success: false, error: error.message };
    } finally {
        loading.value = false;
    }
}
</script>

<style scoped>
.email-tester {
    max-width: 500px;
    margin: 0 auto;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background-color: #f9f9f9;
}

.form-group {
    margin-bottom: 15px;
}

.form-control {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.btn {
    padding: 8px 16px;
    background-color: var(--color-primary);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.result {
    padding: 10px;
    border-radius: 4px;
}

.success {
    background-color: #d4edda;
    color: #155724;
}

.error {
    background-color: #f8d7da;
    color: #721c24;
}
</style>