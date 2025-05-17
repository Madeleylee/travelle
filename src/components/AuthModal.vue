<script setup>
import { ref, computed, watch } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useRouter } from 'vue-router';

const props = defineProps({
  visible: Boolean,
  redirectPath: {
    type: String,
    default: ''
  }
});
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
const mode = ref('login');
const loading = ref(false);
const error = ref('');
const success = ref(false);
const successMessage = ref('');

// Campos de formulario
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const nombre = ref('');
const username = ref('');

// Estados de validación
const usernameChecking = ref(false);
const usernameAvailable = ref(null);
const usernameError = ref('');
const passwordStrength = ref(0); // 0-4: 0=vacío, 1=débil, 2=medio, 3=bueno, 4=fuerte

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

const passwordStrengthText = computed(() => {
  if (!password.value) return '';
  switch (passwordStrength.value) {
    case 1: return 'Débil';
    case 2: return 'Media';
    case 3: return 'Buena';
    case 4: return 'Fuerte';
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
    passwordStrength.value >= 2; // Requerir al menos una contraseña de fuerza media
});

const isRecoverFormValid = computed(() => {
  return email.value && isValidEmail.value;
});

// Función para verificar disponibilidad del nombre de usuario
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
      usernameError.value = 'Este nombre de usuario ya está en uso';
    }
  } catch (err) {
    console.error('Error al verificar nombre de usuario:', err);
    usernameError.value = 'Error al verificar disponibilidad';
  } finally {
    usernameChecking.value = false;
  }
}

// Función para evaluar la fuerza de la contraseña
function evaluatePasswordStrength(pass) {
  if (!pass) {
    passwordStrength.value = 0;
    return;
  }

  let score = 0;

  // Longitud mínima
  if (pass.length >= 8) score++;

  // Complejidad
  if (/[A-Z]/.test(pass)) score++; // Mayúsculas
  if (/[0-9]/.test(pass)) score++; // Números
  if (/[^A-Za-z0-9]/.test(pass)) score++; // Caracteres especiales

  // Penalización por patrones comunes
  if (/^(123|abc|qwerty|password|admin|user)/i.test(pass)) score = Math.max(1, score - 2);

  // Limitar el score entre 1-4
  passwordStrength.value = Math.max(1, Math.min(4, score));
}

// Función para cerrar el modal
function closeModal() {
  emit('close');
}

// Cambiar de modo
function changeMode(newMode) {
  mode.value = newMode;
  error.value = '';
  success.value = false;
  successMessage.value = '';
}

// Iniciar sesión
async function login() {
  if (!isLoginFormValid.value) return;

  error.value = '';
  loading.value = true;

  try {
    const user = await loginUsuario(email.value, password.value);
    success.value = true;
    successMessage.value = `¡Bienvenido ${user.nombre}!`;

    // Emitir evento de inicio de sesión exitoso
    emit('login-success', user);

    // Cerrar modal después de un breve retraso
    setTimeout(() => {
      emit('close');

      // Si hay una ruta de redirección, navegar a ella
      if (props.redirectPath) {
        router.push(props.redirectPath);
      }
    }, 1500);
  } catch (err) {
    error.value = err.message || 'Credenciales incorrectas';
  } finally {
    loading.value = false;
  }
}


// Registrar usuario
async function register() {
  if (!isRegisterFormValid.value) return;

  error.value = '';
  loading.value = true;

  try {
    // Verificar si el email ya existe
    const emailExists = await verificarEmailExistente(email.value);
    if (emailExists) {
      error.value = 'El correo electrónico ya está registrado';
      loading.value = false;
      return;
    }

    // Verificar si el nombre de usuario ya existe (doble verificación)
    const usernameExists = await verificarUsernameExistente(username.value);
    if (usernameExists) {
      error.value = 'El nombre de usuario ya está en uso';
      loading.value = false;
      return;
    }

    // Registrar usuario
    const user = await registrarUsuario({
      username: username.value,
      name: nombre.value,
      email: email.value,
      password: password.value
    });

    success.value = true;
    successMessage.value = '¡Registro exitoso! Bienvenido a nuestra comunidad.';

    // Emitir evento de registro exitoso
    emit('register-success', user);

    // CAMBIO AQUÍ: Cerrar el modal en lugar de cambiar al modo de inicio de sesión
    setTimeout(() => {
      emit('close'); // Cerrar el modal completamente
    }, 2000);
  } catch (err) {
    error.value = err.message || 'Error al registrar usuario';
  } finally {
    loading.value = false;
  }
}

// Recuperar contraseña
async function recover() {
  if (!isRecoverFormValid.value) return;

  error.value = '';
  loading.value = true;

  try {
    await solicitarRecuperacion(email.value);
    success.value = true;
    successMessage.value = 'Si el correo existe en nuestra base de datos, recibirás un enlace para restablecer tu contraseña.';

    // Cambiar a modo login después de un breve retraso
    setTimeout(() => {
      mode.value = 'login';
      success.value = false;
      resetForm();
    }, 3000);
  } catch (err) {
    error.value = 'Ha ocurrido un error. Por favor, inténtalo más tarde.';
    console.error(err);
  } finally {
    loading.value = false;
  }
}

// Resetear formulario
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

// Resetear formulario al cambiar de modo
function handleModeChange(newMode) {
  resetForm();
  changeMode(newMode);
}

// Watchers para validación en tiempo real
watch(username, (newValue) => {
  if (newValue && isValidUsername.value) {
    // Debounce para no hacer demasiadas peticiones
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

// Resetear a modo login cuando se abre el modal
watch(() => props.visible, (newValue) => {
  if (newValue) {
    mode.value = 'login';
    resetForm();
    success.value = false;
  }
});
</script>

<template>
  <div v-if="visible" class="modal-backdrop" @click.self="closeModal">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content bg-light p-3 rounded-4">
        <!-- Botón de cierre en la esquina superior derecha -->
        <div class="modal-header border-0 p-0">
          <button type="button" class="btn-close position-absolute top-0 end-0 m-3 z-3" @click="closeModal"
            aria-label="Close">
          </button>
        </div>

        <div class="modal-body p-4 pt-2">
          <!-- Modo Login -->
          <div v-if="mode === 'login'">
            <h3 class="text-center mb-4 fw-bold text-primary">Iniciar sesión</h3>

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
                  Email inválido
                </div>
              </div>

              <div class="mb-3">
                <input v-model="password" type="password" class="form-control form-control-lg" placeholder="Contraseña"
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
                <span>Entrar</span>
              </button>
            </form>

            <div class="mt-4 text-center">
              <a href="#" class="text-decoration-none" @click.prevent="handleModeChange('register')">¿No tienes cuenta?
                Regístrate</a>
              <div class="my-2">|</div>
              <a href="#" class="text-decoration-none" @click.prevent="handleModeChange('recover')">¿Olvidaste tu
                contraseña?</a>
            </div>
          </div>

          <!-- Modo Registro -->
          <div v-else-if="mode === 'register'">
            <h3 class="text-center mb-4 fw-bold text-primary">Registro</h3>

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
                <input v-model="nombre" type="text" class="form-control form-control-lg" placeholder="Tu nombre"
                  required />
              </div>

              <div class="mb-3">
                <input v-model="username" type="text" class="form-control form-control-lg" :class="{
                  'is-invalid': (username && !isValidUsername) || usernameError,
                  'is-valid': username && isValidUsername && usernameAvailable === true
                }" placeholder="Nombre de usuario" required />
                <div v-if="username && !isValidUsername" class="invalid-feedback">
                  El nombre de usuario debe tener entre 3 y 20 caracteres (letras, números y guiones bajos)
                </div>
                <div v-else-if="usernameError" class="invalid-feedback">
                  {{ usernameError }}
                </div>
                <div v-else-if="usernameChecking" class="text-muted small mt-1">
                  <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                  Verificando disponibilidad...
                </div>
                <div v-else-if="usernameAvailable === true" class="valid-feedback">
                  Nombre de usuario disponible
                </div>
              </div>

              <div class="mb-3">
                <input v-model="email" type="email" class="form-control form-control-lg"
                  :class="{ 'is-invalid': email && !isValidEmail }" placeholder="Email" required />
                <div v-if="email && !isValidEmail" class="invalid-feedback">
                  Email inválido
                </div>
              </div>

              <div class="mb-3">
                <input v-model="password" type="password" class="form-control form-control-lg" placeholder="Contraseña"
                  required />

                <!-- Indicador de fuerza de contraseña -->
                <div v-if="password" class="mt-2">
                  <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="small">Seguridad:</span>
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
                      <li :class="{ 'text-success': password.length >= 8 }">Al menos 8 caracteres</li>
                      <li :class="{ 'text-success': /[A-Z]/.test(password) }">Al menos una mayúscula</li>
                      <li :class="{ 'text-success': /[0-9]/.test(password) }">Al menos un número</li>
                      <li :class="{ 'text-success': /[^A-Za-z0-9]/.test(password) }">Al menos un carácter especial</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="mb-3">
                <input v-model="confirmPassword" type="password" class="form-control form-control-lg" :class="{
                  'is-invalid': confirmPassword && !passwordsMatch,
                  'is-valid': confirmPassword && passwordsMatch && password
                }" placeholder="Confirmar contraseña" required />
                <div v-if="confirmPassword && !passwordsMatch" class="invalid-feedback">
                  Las contraseñas no coinciden
                </div>
                <div v-else-if="confirmPassword && passwordsMatch && password" class="valid-feedback">
                  Las contraseñas coinciden
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
                <span>Registrarse</span>
              </button>
            </form>

          </div>

          <!-- Modo Recuperar Contraseña -->
          <div v-else-if="mode === 'recover'">
            <h3 class="text-center mb-4 fw-bold text-primary">Recuperar contraseña</h3>

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
                  :class="{ 'is-invalid': email && !isValidEmail }" placeholder="Email registrado" required />
                <div v-if="email && !isValidEmail" class="invalid-feedback">
                  Email inválido
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
                <span>Enviar enlace</span>
              </button>
            </form>

            <div class="mt-4 text-center">
              <a href="#" class="text-decoration-none" @click.prevent="handleModeChange('login')">¿Recordaste tu
                contraseña? Inicia sesión</a>
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

/* Asegurar que el botón de cierre esté por encima de otros elementos */
.btn-close {
  z-index: 10;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.btn-close:hover {
  opacity: 1;
}

/* Estilos para el spinner de carga */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>