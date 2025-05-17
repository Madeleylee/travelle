<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useRouter, useRoute } from 'vue-router';

const { verificarTokenRecuperacion, restablecerContrasena } = useAuth();
const router = useRouter();
const route = useRoute();

const token = ref(route.params.token || '');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const error = ref('');
const success = ref(false);
const tokenError = ref(false);
const tokenVerified = ref(false);

const passwordsMatch = computed(() => {
    return !password.value || !confirmPassword.value || password.value === confirmPassword.value;
});

const passwordStrength = computed(() => {
    if (!password.value) {
        return { score: 0, text: '', class: '' };
    }

    let score = 0;

    // Longitud mínima
    if (password.value.length >= 8) score++;

    // Contiene números
    if (/\d/.test(password.value)) score++;

    // Contiene letras minúsculas y mayúsculas
    if (/[a-z]/.test(password.value) && /[A-Z]/.test(password.value)) score++;

    // Contiene caracteres especiales
    if (/[^a-zA-Z0-9]/.test(password.value)) score++;

    let text = '';
    let className = '';

    switch (score) {
        case 0:
        case 1:
            text = 'Débil';
            className = 'strength-weak';
            break;
        case 2:
            text = 'Regular';
            className = 'strength-medium';
            break;
        case 3:
            text = 'Buena';
            className = 'strength-good';
            break;
        case 4:
            text = 'Fuerte';
            className = 'strength-strong';
            break;
    }

    return { score, text, class: className };
});

const isFormValid = computed(() => {
    return password.value &&
        confirmPassword.value &&
        passwordsMatch.value &&
        passwordStrength.value.score >= 2 &&
        tokenVerified.value;
});

// Restablecer contraseña
async function handleSubmit() {
    if (!isFormValid.value) return;

    error.value = '';
    loading.value = true;

    try {
        if (password.value !== confirmPassword.value) {
            error.value = 'Las contraseñas no coinciden';
            loading.value = false;
            return;
        }

        const result = await restablecerContrasena(token.value, password.value);

        if (result.success) {
            success.value = true; // Esto activa la vista de éxito
        } else {
            error.value = result.error || 'Ha ocurrido un error al restablecer la contraseña.';
        }
    } catch (err) {
        console.error('Error al restablecer contraseña:', err);
        error.value = 'Ha ocurrido un error. Por favor, inténtalo más tarde.';
    } finally {
        loading.value = false;
    }
}

function goToLogin() {
    router.push('/login');
}

function goToForgotPassword() {
    router.push('/recuperar-password');
}

// Verificar token
onMounted(async () => {
    if (!token.value) {
        tokenError.value = true;
        return;
    }

    loading.value = true;

    try {
        const result = await verificarTokenRecuperacion(token.value);

        if (result.valid) {
            tokenVerified.value = true;
        } else {
            tokenError.value = true;
        }
    } catch (err) {
        console.error('Error al verificar token:', err);
        tokenError.value = true;
    } finally {
        loading.value = false;
    }
});
</script>

<template>
    <div class="reset-container">
        <div class="reset-form">
            <h2>Restablecer contraseña</h2>

            <div v-if="success" class="success-message">
                <div class="success-icon">✓</div>
                <h3>¡Contraseña actualizada!</h3>
                <p>
                    Tu contraseña ha sido restablecida correctamente.
                    Ahora puedes iniciar sesión con tu nueva contraseña.
                </p>
                <button @click="goToLogin" class="login-button">
                    Iniciar sesión
                </button>
            </div>

            <div v-else-if="tokenError" class="token-error">
                <div class="error-icon">!</div>
                <h3>Enlace inválido</h3>
                <p>
                    El enlace para restablecer tu contraseña es inválido o ha expirado.
                    Por favor, solicita un nuevo enlace.
                </p>
                <button @click="goToForgotPassword" class="request-button">
                    Solicitar nuevo enlace
                </button>
            </div>

            <form v-else @submit.prevent="handleSubmit" class="reset-password-form">
                <p class="instructions">
                    Crea una nueva contraseña para tu cuenta.
                </p>

                <div class="form-group">
                    <label for="password">Nueva contraseña</label>
                    <input id="password" v-model="password" type="password" placeholder="Ingresa tu nueva contraseña"
                        required />
                    <div v-if="password" class="password-strength">
                        <div class="strength-bar">
                            <div class="strength-indicator" :style="{ width: `${passwordStrength.score * 25}%` }"
                                :class="passwordStrength.class"></div>
                        </div>
                        <span :class="passwordStrength.class">{{ passwordStrength.text }}</span>
                    </div>
                </div>

                <div class="form-group">
                    <label for="confirmPassword">Confirmar contraseña</label>
                    <input id="confirmPassword" v-model="confirmPassword" type="password"
                        placeholder="Confirma tu nueva contraseña"
                        :class="{ 'input-error': confirmPassword && !passwordsMatch }" required />
                    <span v-if="confirmPassword && !passwordsMatch" class="error-text">
                        Las contraseñas no coinciden
                    </span>
                </div>

                <div v-if="error" class="error-message">
                    {{ error }}
                </div>

                <button type="submit" class="submit-button" :disabled="!isFormValid || loading">
                    <span v-if="loading" class="spinner"></span>
                    <span v-else>Restablecer contraseña</span>
                </button>
            </form>
        </div>
    </div>
</template>

<style scoped>
.reset-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 2rem;
    background-color: #f5f7fa;
}

.reset-form {
    max-width: 400px;
    width: 100%;
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

.input-error {
    border-color: #e53935 !important;
}

.error-text {
    display: block;
    color: #e53935;
    font-size: 0.8rem;
    margin-top: 0.25rem;
}

.password-strength {
    margin-top: 0.5rem;
}

.strength-bar {
    height: 4px;
    background-color: #eee;
    border-radius: 2px;
    margin-bottom: 0.25rem;
}

.strength-indicator {
    height: 100%;
    border-radius: 2px;
    transition: width 0.3s;
}

.strength-weak {
    background-color: #e53935;
    color: #e53935;
}

.strength-medium {
    background-color: #ff9800;
    color: #ff9800;
}

.strength-good {
    background-color: #4caf50;
    color: #4caf50;
}

.strength-strong {
    background-color: #2e7d32;
    color: #2e7d32;
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
    margin-bottom: 1rem;
    padding: 0.5rem;
    background-color: #ffebee;
    border-radius: 4px;
}

.success-message,
.token-error {
    text-align: center;
    padding: 1rem 0;
}

.success-icon,
.error-icon {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    margin: 0 auto 1rem;
}

.success-icon {
    background-color: #4caf50;
    color: white;
}

.error-icon {
    background-color: #e53935;
    color: white;
}

.success-message h3,
.token-error h3 {
    margin-bottom: 1rem;
    color: #333;
}

.success-message p,
.token-error p {
    margin-bottom: 1rem;
    color: #666;
}

.login-button,
.request-button {
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

.login-button:hover,
.request-button:hover {
    background-color: var(--color-primary-dark, #3a7bc8);
}
</style>