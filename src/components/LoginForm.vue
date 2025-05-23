<script setup>
import { ref, onMounted } from 'vue';
import { useAuth } from '@/composables/useAuth'; // Hook personalizado para autenticación
import { useRouter, useRoute } from 'vue-router'; // Para navegación y obtener parámetros

// Usamos las funciones del hook de autenticación
const { loginUsuario } = useAuth();

// Obtenemos el router y la ruta actual
const router = useRouter();
const route = useRoute();

// Variables reactivas para los campos del formulario
const email = ref('');
const password = ref('');
const rememberMe = ref(false); // Opción "Recordarme"
const error = ref(''); // Para mostrar mensajes de error
const loading = ref(false); // Estado de carga durante el login

// Ruta a donde se redirigirá después del login exitoso
const redirectPath = ref('');

// Al montar el componente, obtenemos la ruta de redirección si viene como query param
onMounted(() => {
    if (route.query.redirect) {
        redirectPath.value = route.query.redirect;
    }
});

// Función que maneja el inicio de sesión
async function handleLogin() {
    error.value = '';
    loading.value = true;

    try {
        const user = await loginUsuario(email.value, password.value);

        // Mostrar notificación de éxito
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.textContent = `Welcome ${user.nombre}!`;
        document.body.appendChild(notification);

        // Eliminar notificación después de 3 segundos
        setTimeout(() => {
            notification.remove();
        }, 3000);

        // Redirigir al usuario a la página deseada o al inicio
        if (redirectPath.value) {
            router.push(redirectPath.value);
        } else {
            router.push('/');
        }
    } catch (err) {
        error.value = err.message || 'Invalid credentials';
    } finally {
        loading.value = false;
    }
}

// Navegar a recuperar contraseña
function goToForgotPassword() {
    router.push('/recuperar-password');
}

// Navegar a registro
function goToRegister() {
    router.push('/registro');
}
</script>

<template>
    <form @submit.prevent="handleLogin" class="auth-form">
        <!-- Título -->
        <h2>Sign in</h2>

        <!-- Campo: Correo electrónico -->
        <div class="form-group">
            <label for="email">Email address</label>
            <input id="email" v-model="email" type="email" required />
        </div>

        <!-- Campo: Contraseña -->
        <div class="form-group">
            <label for="password">Password</label>
            <input id="password" v-model="password" type="password" required />
        </div>

        <!-- Recordarme / Enlace de recuperación -->
        <div class="form-options">
            <div class="remember-me">
                <input id="remember" v-model="rememberMe" type="checkbox" />
                <label for="remember" class="checkbox-label">Remember me</label>
            </div>

            <button type="button" class="forgot-link" @click="goToForgotPassword">
                Forgot your password?
            </button>
        </div>

        <!-- Botón de envío -->
        <button type="submit" :disabled="loading" class="submit-button">
            <span v-if="loading" class="spinner"></span>
            <span v-else>Sign in</span>
        </button>

        <!-- Mensaje de error -->
        <p v-if="error" class="error-message">{{ error }}</p>

        <!-- Enlace a registro -->
        <div class="register-prompt">
            Don't have an account?
            <button type="button" class="register-link" @click="goToRegister">
                Register here
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

/* Notificación de éxito global */
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