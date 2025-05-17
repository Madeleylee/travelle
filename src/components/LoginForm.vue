<script setup>
import { ref, onMounted } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useRouter, useRoute } from 'vue-router';

const { loginUsuario } = useAuth();
const router = useRouter();
const route = useRoute();

const email = ref('');
const password = ref('');
const rememberMe = ref(false);
const error = ref('');
const loading = ref(false);

// Obtener la ruta de redirección si existe
const redirectPath = ref('');

onMounted(() => {
    // Capturar la ruta de redirección de la query
    if (route.query.redirect) {
        redirectPath.value = route.query.redirect;
    }
});

async function handleLogin() {
    error.value = '';
    loading.value = true;

    try {
        const user = await loginUsuario(email.value, password.value);

        // Mostrar notificación de éxito
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.textContent = `¡Bienvenido ${user.nombre}!`;
        document.body.appendChild(notification);

        // Eliminar notificación después de 3 segundos
        setTimeout(() => {
            notification.remove();
        }, 3000);

        // Redirigir al usuario a la página que intentaba visitar o al inicio
        if (redirectPath.value) {
            router.push(redirectPath.value);
        } else {
            router.push('/');
        }
    } catch (err) {
        error.value = err.message || 'Credenciales incorrectas';
    } finally {
        loading.value = false;
    }
}

function goToForgotPassword() {
    router.push('/recuperar-password');
}

function goToRegister() {
    router.push('/registro');
}
</script>

<template>
    <form @submit.prevent="handleLogin" class="auth-form">
        <h2>Iniciar sesión</h2>

        <div class="form-group">
            <label for="email">Correo electrónico</label>
            <input id="email" v-model="email" type="email" required />
        </div>

        <div class="form-group">
            <label for="password">Contraseña</label>
            <input id="password" v-model="password" type="password" required />
        </div>

        <div class="form-options">
            <div class="remember-me">
                <input id="remember" v-model="rememberMe" type="checkbox" />
                <label for="remember" class="checkbox-label">Recordarme</label>
            </div>

            <button type="button" class="forgot-link" @click="goToForgotPassword">
                ¿Olvidaste tu contraseña?
            </button>
        </div>

        <button type="submit" :disabled="loading" class="submit-button">
            <span v-if="loading" class="spinner"></span>
            <span v-else>Iniciar sesión</span>
        </button>

        <p v-if="error" class="error-message">{{ error }}</p>

        <div class="register-prompt">
            ¿No tienes cuenta?
            <button type="button" class="register-link" @click="goToRegister">
                Regístrate aquí
            </button>
        </div>
    </form>
</template>

<style scoped>
.auth-form {
    max-width: 400px;
    margin: auto;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    background-color: white;
}

h2 {
    text-align: center;
    margin-bottom: 1.5rem;
    color: var(--color-primary, #4a90e2);
}

.form-group {
    margin-bottom: 1rem;
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

.form-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.remember-me {
    display: flex;
    align-items: center;
}

.checkbox-label {
    margin-left: 0.5rem;
    margin-bottom: 0;
}

.forgot-link {
    background: none;
    border: none;
    color: var(--color-primary, #4a90e2);
    cursor: pointer;
    font-size: 0.9rem;
    text-decoration: underline;
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

.register-prompt {
    text-align: center;
    margin-top: 1.5rem;
    font-size: 0.9rem;
}

.register-link {
    background: none;
    border: none;
    color: var(--color-primary, #4a90e2);
    cursor: pointer;
    font-weight: 500;
    text-decoration: underline;
}

/* Estilo para la notificación de éxito */
:global(.success-notification) {
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #4caf50;
    color: white;
    padding: 1rem;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    animation: fadeIn 0.3s, fadeOut 0.3s 2.7s;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes fadeOut {
    from {
        opacity: 1;
        transform: translateY(0);
    }

    to {
        opacity: 0;
        transform: translateY(-20px);
    }
}
</style>