<script setup>
import { ref, computed, watch } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useRouter } from 'vue-router';

// Definimos las propiedades del componente
const props = defineProps({
  visible: Boolean,
  redirectPath: {
    type: String,
    default: ''
  }
});

// Definimos los eventos que puede emitir
const emit = defineEmits(['close', 'login-success', 'register-success']);

const router = useRouter();
const {
  loginUsuario,
  registrarUsuario,
  solicitarRecuperacion,
  verificarEmailExistente,
  verificarUsernameExistente
} = useAuth();

// Estado del modal
const mode = ref('login'); // Modo actual: login, register o recover
const loading = ref(false); // Para mostrar spinner durante acciones
const error = ref(''); // Para almacenar mensajes de error
const success = ref(false); // Si la acción fue exitosa
const successMessage = ref(''); // Mensaje de éxito

// Campos del formulario
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const nombre = ref('');
const username = ref('');

// Estados de validación
const usernameChecking = ref(false); // Verificando si el nombre de usuario existe
const usernameAvailable = ref(null); // Disponibilidad del nombre de usuario
const usernameError = ref(''); // Error en nombre de usuario
const passwordStrength = ref(0); // Fuerza de la contraseña (0-4)

// Validaciones computadas
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

const passwordStrengthText = computed(() => {
  if (!password.value) return '';
  switch (passwordStrength.value) {
    case 1: return 'Weak';
    case 2: return 'Medium';
    case 3: return 'Good';
    case 4: return 'Strong';
    default: return '';
  }
});

const passwordStrengthClass = computed(() => {
  if (!password.value) return '';
  switch (passwordStrength.value) {
    case 1: return 'bg-danger';
    case 2: return 'bg-warning';
    case 3: return 'bg-info';
    case 4: return 'bg-success';
    default: return '';
  }
});

// Validación de formularios
const isLoginFormValid = computed(() => {
  return email.value && password.value && isValidEmail.value;
});

const isRegisterFormValid = computed(() => {
  return username.value &&
    nombre.value &&
    email.value &&
    password.value &&
    confirmPassword.value &&
    isValidEmail.value &&
    isValidUsername.value &&
    passwordsMatch.value &&
    usernameAvailable.value === true &&
    passwordStrength.value >= 2;
});

const isRecoverFormValid = computed(() => {
  return email.value && isValidEmail.value;
});

// Verifica si el nombre de usuario está disponible
async function checkUsernameAvailability() {
  if (!username.value || !isValidUsername.value) {
    usernameAvailable.value = null;
    usernameError.value = '';
    return;
  }
  usernameChecking.value = true;
  usernameAvailable.value = null;
  usernameError.value = '';
  try {
    const exists = await verificarUsernameExistente(username.value);
    usernameAvailable.value = !exists;
    if (exists) {
      usernameError.value = 'This username is already taken';
    }
  } catch (err) {
    console.error('Error checking username:', err);
    usernameError.value = 'Error checking availability';
  } finally {
    usernameChecking.value = false;
  }
}

// Evalúa la fuerza de la contraseña
function evaluatePasswordStrength(pass) {
  if (!pass) {
    passwordStrength.value = 0;
    return;
  }
  let score = 0;
  if (pass.length >= 8) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;
  if (/^(123|abc|qwerty|password|admin|user)/i.test(pass)) score = Math.max(1, score - 2);
  passwordStrength.value = Math.max(1, Math.min(4, score));
}

// Cierra el modal
function closeModal() {
  emit('close');
}

// Cambia entre modos: login, register, recover
function changeMode(newMode) {
  mode.value = newMode;
  error.value = '';
  success.value = false;
  successMessage.value = '';
}

// Inicia sesión
async function login() {
  if (!isLoginFormValid.value) return;
  error.value = '';
  loading.value = true;
  try {
    const user = await loginUsuario(email.value, password.value);
    success.value = true;
    successMessage.value = `Welcome back, ${user.nombre}!`;
    emit('login-success', user);
    setTimeout(() => {
      emit('close');
      if (props.redirectPath) {
        router.push(props.redirectPath);
      }
    }, 1500);
  } catch (err) {
    error.value = err.message || 'Invalid credentials';
  } finally {
    loading.value = false;
  }
}

// Registra un nuevo usuario
async function register() {
  if (!isRegisterFormValid.value) return;
  error.value = '';
  loading.value = true;
  try {
    const emailExists = await verificarEmailExistente(email.value);
    if (emailExists) {
      error.value = 'Email already registered';
      loading.value = false;
      return;
    }
    const usernameExists = await verificarUsernameExistente(username.value);
    if (usernameExists) {
      error.value = 'Username already taken';
      loading.value = false;
      return;
    }
    const user = await registrarUsuario({
      username: username.value,
      name: nombre.value,
      email: email.value,
      password: password.value
    });
    success.value = true;
    successMessage.value = 'Registration successful!';
    emit('register-success', user);
    setTimeout(() => {
      emit('close');
    }, 2000);
  } catch (err) {
    error.value = err.message || 'Registration error';
  } finally {
    loading.value = false;
  }
}

// Recupera contraseña
async function recover() {
  if (!isRecoverFormValid.value) return;
  error.value = '';
  loading.value = true;
  try {
    await solicitarRecuperacion(email.value);
    success.value = true;
    successMessage.value = 'If this email is registered, you will receive a recovery link.';
    setTimeout(() => {
      mode.value = 'login';
      success.value = false;
      resetForm();
    }, 3000);
  } catch (err) {
    error.value = 'An error occurred. Please try again later.';
    console.error(err);
  } finally {
    loading.value = false;
  }
}

// Reinicia los campos del formulario
function resetForm() {
  email.value = '';
  password.value = '';
  confirmPassword.value = '';
  nombre.value = '';
  username.value = '';
  error.value = '';
  usernameAvailable.value = null;
  usernameError.value = '';
  passwordStrength.value = 0;
}

// Reinicia formulario al cambiar de modo
function handleModeChange(newMode) {
  resetForm();
  changeMode(newMode);
}

// Observadores para validación en tiempo real
watch(username, (newValue) => {
  if (newValue && isValidUsername.value) {
    const timeoutId = setTimeout(() => {
      checkUsernameAvailability();
    }, 500);
    return () => clearTimeout(timeoutId);
  } else {
    usernameAvailable.value = null;
    usernameError.value = '';
  }
});

watch(password, (newValue) => {
  evaluatePasswordStrength(newValue);
});

// Reinicia al modo login cuando se abre
watch(() => props.visible, (newValue) => {
  if (newValue) {
    mode.value = 'login';
    resetForm();
    success.value = false;
  }
});
</script>

<template>
  <!-- Modal backdrop -->
  <div v-if="visible" class="modal-backdrop" @click.self="closeModal">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content bg-light p-3 rounded-4">
        <!-- Botón de cerrar -->
        <div class="modal-header border-0 p-0">
          <button type="button" class="btn-close position-absolute top-0 end-0 m-3 z-3" @click="closeModal"
            aria-label="Close"></button>
        </div>
        <div class="modal-body p-4 pt-2">
          <!-- Modo Login -->
          <div v-if="mode === 'login'">
            <h3 class="text-center mb-4 fw-bold text-primary">Sign in</h3>
            <div v-if="success" class="text-center py-3">
              <div class="d-flex justify-content-center mb-3">
                <div class="bg-success text-white rounded-circle d-flex align-items-center justify-content-center"
                  style="width: 60px; height: 60px;">
                  <i class="fas fa-check fs-3"></i>
                </div>
              </div>
              <p class="mb-0">{{ successMessage }}</p>
            </div>
            <form v-else @submit.prevent="login">
              <div class="mb-3">
                <input v-model="email" type="email" class="form-control form-control-lg"
                  :class="{ 'is-invalid': email && !isValidEmail }" placeholder="Email" required />
                <div v-if="email && !isValidEmail" class="invalid-feedback">
                  Invalid email
                </div>
              </div>
              <div class="mb-3">
                <input v-model="password" type="password" class="form-control form-control-lg" placeholder="Password"
                  required />
              </div>
              <div v-if="error" class="alert alert-danger py-2 text-center" role="alert">
                {{ error }}
              </div>
              <button type="submit"
                class="btn btn-primary btn-lg w-100 d-flex justify-content-center align-items-center"
                :disabled="!isLoginFormValid || loading">
                <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"
                  aria-hidden="true"></span>
                <span>Sign in</span>
              </button>
            </form>
            <div class="mt-4 text-center">
              <a href="#" class="text-decoration-none" @click.prevent="handleModeChange('register')">Don't have an
                account? Register</a>
              <div class="my-2">|</div>
              <a href="#" class="text-decoration-none" @click.prevent="handleModeChange('recover')">Forgot password?</a>
            </div>
          </div>

          <!-- Modo Registro -->
          <div v-else-if="mode === 'register'">
            <h3 class="text-center mb-4 fw-bold text-primary">Create Account</h3>
            <div v-if="success" class="text-center py-3">
              <div class="d-flex justify-content-center mb-3">
                <div class="bg-success text-white rounded-circle d-flex align-items-center justify-content-center"
                  style="width: 60px; height: 60px;">
                  <i class="fas fa-check fs-3"></i>
                </div>
              </div>
              <p class="mb-0">{{ successMessage }}</p>
            </div>
            <form v-else @submit.prevent="register">
              <div class="mb-3">
                <input v-model="nombre" type="text" class="form-control form-control-lg" placeholder="Your full name"
                  required />
              </div>
              <div class="mb-3">
                <input v-model="username" type="text" class="form-control form-control-lg" :class="{
                  'is-invalid': (username && !isValidUsername) || usernameError,
                  'is-valid': username && isValidUsername && usernameAvailable === true
                }" placeholder="Username" required />
                <div v-if="username && !isValidUsername" class="invalid-feedback">
                  Username must be 3–20 characters (letters, numbers, underscores)
                </div>
                <div v-else-if="usernameError" class="invalid-feedback">
                  {{ usernameError }}
                </div>
                <div v-else-if="usernameChecking" class="text-muted small mt-1">
                  <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                  Checking availability...
                </div>
                <div v-else-if="usernameAvailable === true" class="valid-feedback">
                  Username available
                </div>
              </div>
              <div class="mb-3">
                <input v-model="email" type="email" class="form-control form-control-lg"
                  :class="{ 'is-invalid': email && !isValidEmail }" placeholder="Email" required />
                <div v-if="email && !isValidEmail" class="invalid-feedback">
                  Invalid email
                </div>
              </div>
              <div class="mb-3">
                <input v-model="password" type="password" class="form-control form-control-lg" placeholder="Password"
                  required />
                <!-- Strength indicator -->
                <div v-if="password" class="mt-2">
                  <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="small">Security:</span>
                    <span class="small" :class="{
                      'text-danger': passwordStrength === 1,
                      'text-warning': passwordStrength === 2,
                      'text-info': passwordStrength === 3,
                      'text-success': passwordStrength === 4
                    }">{{ passwordStrengthText }}</span>
                  </div>
                  <div class="progress" style="height: 5px;">
                    <div class="progress-bar" :class="passwordStrengthClass"
                      :style="{ width: (passwordStrength * 25) + '%' }" role="progressbar"
                      :aria-valuenow="passwordStrength * 25" aria-valuemin="0" aria-valuemax="100">
                    </div>
                  </div>
                  <div class="small text-muted mt-1">
                    <ul class="ps-3 mb-0">
                      <li :class="{ 'text-success': password.length >= 8 }">At least 8 characters</li>
                      <li :class="{ 'text-success': /[A-Z]/.test(password) }">At least one uppercase letter</li>
                      <li :class="{ 'text-success': /[0-9]/.test(password) }">At least one number</li>
                      <li :class="{ 'text-success': /[^A-Za-z0-9]/.test(password) }">At least one special character</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div class="mb-3">
                <input v-model="confirmPassword" type="password" class="form-control form-control-lg" :class="{
                  'is-invalid': confirmPassword && !passwordsMatch,
                  'is-valid': confirmPassword && passwordsMatch && password
                }" placeholder="Confirm password" required />
                <div v-if="confirmPassword && !passwordsMatch" class="invalid-feedback">
                  Passwords do not match
                </div>
                <div v-else-if="confirmPassword && passwordsMatch && password" class="valid-feedback">
                  Passwords match
                </div>
              </div>
              <div v-if="error" class="alert alert-danger py-2 text-center" role="alert">
                {{ error }}
              </div>
              <button type="submit"
                class="btn btn-primary btn-lg w-100 d-flex justify-content-center align-items-center"
                :disabled="!isRegisterFormValid || loading">
                <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"
                  aria-hidden="true"></span>
                <span>Create Account</span>
              </button>
            </form>
          </div>

          <!-- Modo Recuperar Contraseña -->
          <div v-else-if="mode === 'recover'">
            <h3 class="text-center mb-4 fw-bold text-primary">Reset Password</h3>
            <div v-if="success" class="text-center py-3">
              <div class="d-flex justify-content-center mb-3">
                <div class="bg-success text-white rounded-circle d-flex align-items-center justify-content-center"
                  style="width: 60px; height: 60px;">
                  <i class="fas fa-check fs-3"></i>
                </div>
              </div>
              <p class="mb-0">{{ successMessage }}</p>
            </div>
            <form v-else @submit.prevent="recover">
              <div class="mb-3">
                <input v-model="email" type="email" class="form-control form-control-lg"
                  :class="{ 'is-invalid': email && !isValidEmail }" placeholder="Registered email" required />
                <div v-if="email && !isValidEmail" class="invalid-feedback">
                  Invalid email
                </div>
              </div>
              <div v-if="error" class="alert alert-danger py-2 text-center" role="alert">
                {{ error }}
              </div>
              <button type="submit"
                class="btn btn-primary btn-lg w-100 d-flex justify-content-center align-items-center"
                :disabled="!isRecoverFormValid || loading">
                <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"
                  aria-hidden="true"></span>
                <span>Send Reset Link</span>
              </button>
            </form>
            <div class="mt-4 text-center">
              <a href="#" class="text-decoration-none" @click.prevent="handleModeChange('login')">Remembered your
                password? Sign in</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal-dialog {
  width: 100%;
  max-width: 400px;
  margin: 1.75rem auto;
}

.btn-close {
  z-index: 10;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.btn-close:hover {
  opacity: 1;
}
</style>