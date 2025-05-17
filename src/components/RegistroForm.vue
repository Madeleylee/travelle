<script setup>
import { ref, computed } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useRouter } from 'vue-router';

const { registrarUsuario } = useAuth();
const router = useRouter();

const username = ref('');
const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const error = ref('');
const success = ref(false);

// Validaciones
const isValidEmail = computed(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !email.value || emailRegex.test(email.value);
});

const isValidUsername = computed(() => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return !username.value || usernameRegex.test(username.value);
});

const passwordsMatch = computed(() => {
    return !password.value || !confirmPassword.value || password.value === confirmPassword.value;
});

const isFormValid = computed(() => {
    return username.value &&
        name.value &&
        email.value &&
        password.value &&
        confirmPassword.value &&
        isValidEmail.value &&
        isValidUsername.value &&
        passwordsMatch.value;
});

async function handleRegister() {
    if (!isFormValid.value) return;

    error.value = '';
    loading.value = true;

    try {
        if (password.value !== confirmPassword.value) {
            error.value = 'Las contraseñas no coinciden';
            loading.value = false;
            return;
        }

        await registrarUsuario({
            username: username.value,
            name: name.value,
            email: email.value,
            password: password.value
        });

        success.value = true;

        // Redirigir después de un breve retraso
        setTimeout(() => {
            router.push('/');
        }, 2000);
    } catch (err) {
        error.value = err.message || 'Error al registrar usuario';
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <form @submit.prevent="handleRegister" class="auth-form">
        <h2>Crear cuenta</h2>

        <div v-if="success" class="success-message">
            <div class="success-icon">✓</div>
            <p>¡Registro exitoso! Serás redirigido en unos segundos...</p>
        </div>

        <template v-else>
            <div class="form-group">
                <label for="username">Nombre de usuario</label>
                <input id="username" v-model="username" type="text"
                    :class="{ 'input-error': username && !isValidUsername }" required />
                <span v-if="username && !isValidUsername" class="error-text">
                    El nombre de usuario debe tener entre 3 y 20 caracteres y solo puede contener letras, números y
                    guiones bajos
                </span>
            </div>

            <div class="form-group">
                <label for="name">Nombre completo</label>
                <input id="name" v-model="name" type="text" required />
            </div>

            <div class="form-group">
                <label for="email">Correo electrónico</label>
                <input id="email" v-model="email" type="email" :class="{ 'input-error': email && !isValidEmail }"
                    required />
                <span v-if="email && !isValidEmail" class="error-text">
                    Por favor, introduce un correo electrónico válido
                </span>
            </div>

            <div class="form-group">
                <label for="password">Contraseña</label>
                <input id="password" v-model="password" type="password" required />
            </div>

            <div class="form-group">
                <label for="confirmPassword">Confirmar contraseña</label>
                <input id="confirmPassword" v-model="confirmPassword" type="password"
                    :class="{ 'input-error': confirmPassword && !passwordsMatch }" required />
                <span v-if="confirmPassword && !passwordsMatch" class="error-text">
                    Las contraseñas no coinciden
                </span>
            </div>

            <button type="submit" :disabled="!isFormValid || loading" class="submit-button">
                <span v-if="loading" class="spinner"></span>
                <span v-else>Registrarse</span>
            </button>

            <p v-if="error" class="error-message">{{ error }}</p>
        </template>
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

.input-error {
    border-color: #e53935 !important;
}

.error-text {
    display: block;
    color: #e53935;
    font-size: 0.8rem;
    margin-top: 0.25rem;
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
    margin-top: 1rem;
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

.success-message {
    text-align: center;
    padding: 2rem 1rem;
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
</style>