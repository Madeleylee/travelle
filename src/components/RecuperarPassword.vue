<script setup>
import { ref } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useRouter } from 'vue-router';

const { solicitarRecuperacion } = useAuth();
const router = useRouter();

const email = ref('');
const loading = ref(false);
const error = ref('');
const submitted = ref(false);

async function handleRecover() {
    error.value = '';
    loading.value = true;

    try {
        await solicitarRecuperacion(email.value);
        submitted.value = true;
    } catch (err) {
        error.value = 'Ha ocurrido un error. Por favor, inténtalo más tarde.';
        console.error(err);
    } finally {
        loading.value = false;
    }
}


function goToLogin() {
    router.push('/login');
}
</script>

<template>
    <div class="recover-container">
        <form @submit.prevent="handleRecover" class="auth-form">
            <h2>Recuperar contraseña</h2>

            <div v-if="submitted" class="success-message">
                <div class="success-icon">✓</div>
                <h3>Solicitud enviada</h3>
                <p>
                    Si el correo <strong>{{ email }}</strong> está registrado en nuestra plataforma,
                    recibirás un enlace para restablecer tu contraseña.
                </p>
                <p class="small">
                    Revisa tu bandeja de entrada y la carpeta de spam.
                </p>
                <button type="button" class="back-button" @click="goToLogin">
                    Volver a inicio de sesión
                </button>
            </div>

            <template v-else>
                <p class="instructions">
                    Introduce tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                </p>

                <div class="form-group">
                    <label for="email">Correo electrónico</label>
                    <input id="email" v-model="email" type="email" required />
                </div>

                <button type="submit" :disabled="loading" class="submit-button">
                    <span v-if="loading" class="spinner"></span>
                    <span v-else>Enviar enlace de recuperación</span>
                </button>

                <p v-if="error" class="error-message">{{ error }}</p>

                <div class="login-link-container">
                    <button type="button" class="login-link" @click="goToLogin">
                        Volver a inicio de sesión
                    </button>
                </div>
            </template>
        </form>
    </div>
</template>

<style scoped>
.recover-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 2rem;
    background-color: #f5f7fa;
}

.auth-form {
    max-width: 400px;
    width: 100%;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    background-color: white;
}

h2 {
    text-align: center;
    margin-bottom: 1rem;
    color: var(--color-primary, #4a90e2);
}

.instructions {
    text-align: center;
    margin-bottom: 1.5rem;
    color: #666;
}

.form-group {
    margin-bottom: 1.5rem;
}

label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
}

input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
}

input:focus {
    outline: none;
    border-color: var(--color-primary, #4a90e2);
    box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
}

.submit-button {
    width: 100%;
    padding: 0.75rem;
    background-color: var(--color-primary, #4a90e2);
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
}

.submit-button:hover:not(:disabled) {
    background-color: var(--color-primary-dark, #3a7bc8);
}

.submit-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.error-message {
    color: #e53935;
    text-align: center;
    margin-top: 1rem;
    padding: 0.5rem;
    background-color: #ffebee;
    border-radius: 4px;
}

.login-link-container {
    text-align: center;
    margin-top: 1.5rem;
}

.login-link {
    background: none;
    border: none;
    color: var(--color-primary, #4a90e2);
    cursor: pointer;
    font-size: 0.9rem;
    text-decoration: underline;
}

.success-message {
    text-align: center;
    padding: 1rem 0;
}

.success-icon {
    width: 60px;
    height: 60px;
    background-color: #4caf50;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    margin: 0 auto 1rem;
}

.success-message h3 {
    margin-bottom: 1rem;
    color: #333;
}

.success-message p {
    margin-bottom: 1rem;
    color: #666;
}

.success-message .small {
    font-size: 0.9rem;
    color: #888;
}

.back-button {
    padding: 0.75rem 1.5rem;
    background-color: var(--color-primary, #4a90e2);
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    margin-top: 1rem;
}

.back-button:hover {
    background-color: var(--color-primary-dark, #3a7bc8);
}
</style>