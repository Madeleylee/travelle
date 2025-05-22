<template>
    <div class="perfil-container">
        <!-- Header con estilo consistente -->
        <div class="countries-header">
            <h1>Mi Perfil</h1>
            <div class="header-line"></div>
            <p v-if="usuario">Gestiona tu información personal y preferencias</p>
        </div>

        <!-- Contenido principal -->
        <div class="perfil-content">
            <!-- Estado de carga -->
            <div v-if="isLoading" class="loading-state">
                <div class="spinner">
                    <div class="bounce1"></div>
                    <div class="bounce2"></div>
                    <div class="bounce3"></div>
                </div>
                <p>Cargando tu información...</p>
            </div>

            <!-- Si no hay usuario autenticado -->
            <div v-else-if="!usuario" class="auth-required">
                <div class="auth-icon">
                    <i class="bi bi-shield-lock"></i>
                </div>
                <h2>Acceso restringido</h2>
                <p class="lead">Necesitas iniciar sesión para ver tu perfil</p>
                <button @click="showAuthModal = true" class="btn-login">
                    <i class="bi bi-box-arrow-in-right"></i> Iniciar sesión
                </button>
            </div>

            <!-- Si hay usuario autenticado -->
            <div v-else class="profile-dashboard">
                <!-- Tarjeta de información personal -->
                <div class="profile-card personal-info">
                    <div class="card-header">
                        <h2><i class="bi bi-person-circle"></i> Información Personal</h2>
                        <button @click="toggleEditMode('personal')" class="btn-edit">
                            <i :class="editMode.personal ? 'bi bi-x-circle' : 'bi bi-pencil'"></i>
                            {{ editMode.personal ? 'Cancelar' : 'Editar' }}
                        </button>
                    </div>

                    <div class="profile-avatar">
                        <!-- Si tiene foto de perfil -->
                        <img v-if="usuario.foto_perfil" :src="usuario.foto_perfil" :alt="usuario.nombre || 'Usuario'" />
                        <!-- Si no tiene foto de perfil -->
                        <div v-else class="no-avatar">
                            <i class="bi bi-person-circle"></i>
                        </div>

                        <!-- Overlay para cambiar/subir foto -->
                        <div class="avatar-overlay" @click="triggerFileUpload">
                            <i class="bi bi-camera"></i>
                            <span>{{ usuario.foto_perfil ? 'Cambiar foto' : 'Subir foto' }}</span>
                        </div>

                        <!-- Input oculto para subir archivos -->
                        <input ref="fileInput" type="file" accept="image/*" @change="handleFileUpload"
                            style="display: none;" />
                    </div>

                    <!-- Modo visualización -->
                    <div v-if="!editMode.personal" class="profile-details">
                        <div class="detail-item">
                            <span class="detail-label">Nombre:</span>
                            <span class="detail-value">{{ usuario.nombre || 'No especificado' }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Nombre de usuario:</span>
                            <span class="detail-value">{{ usuario.nombre_usuario || 'No especificado' }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Email:</span>
                            <span class="detail-value">{{ usuario.email }}</span>
                        </div>
                        <div class="detail-item" v-if="fechaRegistro">
                            <span class="detail-label">Miembro desde:</span>
                            <span class="detail-value">{{ fechaRegistro }}</span>
                        </div>
                    </div>

                    <!-- Modo edición -->
                    <div v-else class="profile-edit-form">
                        <!-- Notificación de error -->
                        <div v-if="errorMessage" class="error-notification">
                            <i class="bi bi-exclamation-triangle"></i>
                            <span>{{ errorMessage }}</span>
                        </div>

                        <!-- Notificación de éxito -->
                        <div v-if="successMessage" class="success-notification">
                            <i class="bi bi-check-circle"></i>
                            <span>{{ successMessage }}</span>
                        </div>

                        <div class="form-group">
                            <label for="nombre">Nombre</label>
                            <input type="text" id="nombre" v-model="formData.nombre" class="form-control"
                                :class="{ 'error': formErrors.nombre }" />
                            <span v-if="formErrors.nombre" class="field-error">{{ formErrors.nombre }}</span>
                        </div>

                        <div class="form-group">
                            <label for="nombre_usuario">Nombre de usuario</label>
                            <input type="text" id="nombre_usuario" v-model="formData.nombre_usuario"
                                class="form-control" :class="{ 'error': formErrors.nombre_usuario }"
                                @blur="validateUsername" />
                            <span v-if="formErrors.nombre_usuario" class="field-error">{{ formErrors.nombre_usuario
                                }}</span>
                            <span v-if="isCheckingUsername" class="checking-username">
                                <i class="bi bi-arrow-clockwise spin"></i> Verificando disponibilidad...
                            </span>
                        </div>

                        <div class="form-actions">
                            <button @click="cancelEdit('personal')" class="btn-cancel">Cancelar</button>
                            <button @click="updateProfile" :disabled="isUpdating || hasFormErrors" class="btn-save">
                                <span v-if="isUpdating" class="spinner-border spinner-border-sm me-2"></span>
                                Guardar cambios
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Tarjeta de estadísticas -->
                <div class="profile-card stats-card">
                    <div class="card-header">
                        <h2><i class="bi bi-bar-chart"></i> Mis Estadísticas</h2>
                    </div>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-value">{{ stats.visitados }}</div>
                            <div class="stat-label">Lugares visitados</div>
                            <i class="bi bi-check-circle stat-icon"></i>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">{{ stats.favoritos }}</div>
                            <div class="stat-label">Favoritos</div>
                            <i class="bi bi-heart stat-icon"></i>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">{{ stats.paises }}</div>
                            <div class="stat-label">Países</div>
                            <i class="bi bi-globe stat-icon"></i>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">{{ stats.listas }}</div>
                            <div class="stat-label">Listas</div>
                            <i class="bi bi-list-check stat-icon"></i>
                        </div>
                    </div>
                </div>

                <!-- Tarjeta de preferencias -->
                <div class="profile-card preferences-card">
                    <div class="card-header">
                        <h2><i class="bi bi-gear"></i> Preferencias</h2>
                        <button @click="toggleEditMode('preferences')" class="btn-edit">
                            <i :class="editMode.preferences ? 'bi bi-x-circle' : 'bi bi-pencil'"></i>
                            {{ editMode.preferences ? 'Cancelar' : 'Editar' }}
                        </button>
                    </div>

                    <!-- Modo visualización -->
                    <div v-if="!editMode.preferences" class="preferences-details">
                        <div class="detail-item">
                            <span class="detail-label">Notificaciones:</span>
                            <span class="detail-value">{{ userPreferences.notificaciones ? 'Activadas' : 'Desactivadas'
                                }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Idioma:</span>
                            <span class="detail-value">{{ userPreferences.idioma || 'Español' }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Moneda:</span>
                            <span class="detail-value">{{ userPreferences.moneda || 'EUR' }}</span>
                        </div>
                    </div>

                    <!-- Modo edición -->
                    <div v-else class="preferences-edit-form">
                        <div class="form-group">
                            <label class="switch-label">
                                <span>Notificaciones</span>
                                <div class="toggle-switch">
                                    <input type="checkbox" v-model="formData.notificaciones">
                                    <span class="slider"></span>
                                </div>
                            </label>
                        </div>
                        <div class="form-group">
                            <label for="idioma">Idioma</label>
                            <select id="idioma" v-model="formData.idioma" class="form-control">
                                <option value="Español">Español</option>
                                <option value="English">English</option>
                                <option value="Français">Français</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="moneda">Moneda</label>
                            <select id="moneda" v-model="formData.moneda" class="form-control">
                                <option value="EUR">EUR (€)</option>
                                <option value="USD">USD ($)</option>
                                <option value="GBP">GBP (£)</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button @click="cancelEdit('preferences')" class="btn-cancel">Cancelar</button>
                            <button @click="updatePreferences" :disabled="isUpdating" class="btn-save">
                                <span v-if="isUpdating" class="spinner-border spinner-border-sm me-2"></span>
                                Guardar cambios
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Tarjeta de seguridad -->
                <div class="profile-card security-card">
                    <div class="card-header">
                        <h2><i class="bi bi-shield-lock"></i> Seguridad</h2>
                    </div>
                    <div class="security-options">
                        <button class="security-option" @click="showChangePasswordModal = true">
                            <i class="bi bi-key"></i>
                            <span>Cambiar contraseña</span>
                        </button>
                        <button class="security-option" @click="showDeleteAccountModal = true">
                            <i class="bi bi-trash"></i>
                            <span>Eliminar cuenta</span>
                        </button>
                        <button class="security-option" @click="handleLogout">
                            <i class="bi bi-box-arrow-right"></i>
                            <span>Cerrar sesión</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal de autenticación -->
        <AuthModal :visible="showAuthModal" @close="showAuthModal = false" @login-success="handleLoginSuccess" />

        <!-- Modal de cambio de contraseña (placeholder) -->
        <div v-if="showChangePasswordModal" class="modal-overlay" @click="showChangePasswordModal = false">
            <div class="modal-content" @click.stop>
                <h3>Cambiar contraseña</h3>
                <p>Funcionalidad en desarrollo</p>
                <button @click="showChangePasswordModal = false" class="btn-primary">Cerrar</button>
            </div>
        </div>

        <!-- Modal de eliminación de cuenta (placeholder) -->
        <div v-if="showDeleteAccountModal" class="modal-overlay" @click="showDeleteAccountModal = false">
            <div class="modal-content" @click.stop>
                <h3>Eliminar cuenta</h3>
                <p>Funcionalidad en desarrollo</p>
                <button @click="showDeleteAccountModal = false" class="btn-primary">Cerrar</button>
            </div>
        </div>
    </div>
</template>

<script setup>
// Importaciones
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import { turso } from '@/services/tursoClient';
import AuthModal from '@/components/AuthModal.vue';

// Router
const router = useRouter();

// Hooks
const { getUsuarioActual, isUserAuthenticated, logoutUsuario } = useAuth();

// Referencias
const fileInput = ref(null);

// Estado
const usuario = ref(null);
const isLoading = ref(true);
const isUpdating = ref(false);
const isCheckingUsername = ref(false);
const showAuthModal = ref(false);
const showChangePasswordModal = ref(false);
const showDeleteAccountModal = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

// Datos simulados para estadísticas
const visitados = ref([]);
const favoritos = ref([]);
const tripLists = ref([]);

// Preferencias del usuario (almacenadas localmente)
const userPreferences = ref({
    notificaciones: false,
    idioma: 'Español',
    moneda: 'EUR'
});
const fechaRegistro = ref('');

// Modos de edición
const editMode = reactive({
    personal: false,
    preferences: false
});

// Datos de formulario
const formData = reactive({
    nombre: '',
    nombre_usuario: '',
    notificaciones: false,
    idioma: 'Español',
    moneda: 'EUR'
});

// Errores de formulario
const formErrors = reactive({
    nombre: '',
    nombre_usuario: ''
});

// Computed para verificar si hay errores en el formulario
const hasFormErrors = computed(() => {
    return Object.values(formErrors).some(error => error !== '');
});

// Estadísticas del usuario
const stats = computed(() => ({
    visitados: visitados.value?.length || 0,
    favoritos: favoritos.value?.length || 0,
    paises: [...new Set(visitados.value?.map(v => v.pais) || [])].length,
    listas: tripLists.value?.length || 0
}));

// Limpiar mensajes
const clearMessages = () => {
    errorMessage.value = '';
    successMessage.value = '';
};

// Limpiar errores de formulario
const clearFormErrors = () => {
    Object.keys(formErrors).forEach(key => {
        formErrors[key] = '';
    });
};

// Validar nombre de usuario
const validateUsername = async () => {
    if (!formData.nombre_usuario || formData.nombre_usuario === usuario.value?.nombre_usuario) {
        formErrors.nombre_usuario = '';
        return;
    }

    if (formData.nombre_usuario.length < 3) {
        formErrors.nombre_usuario = 'El nombre de usuario debe tener al menos 3 caracteres';
        return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.nombre_usuario)) {
        formErrors.nombre_usuario = 'El nombre de usuario solo puede contener letras, números y guiones bajos';
        return;
    }

    isCheckingUsername.value = true;

    try {
        // Verificar si el nombre de usuario ya existe en la base de datos
        const result = await turso.execute({
            sql: `SELECT id_usuario FROM Usuarios WHERE nombre_usuario = ? AND id_usuario != ?`,
            args: [formData.nombre_usuario, usuario.value?.id_usuario || 0],
        });

        if (result.rows.length > 0) {
            formErrors.nombre_usuario = 'Este nombre de usuario ya está en uso';
        } else {
            formErrors.nombre_usuario = '';
        }
    } catch (error) {
        console.error('Error al verificar nombre de usuario:', error);
        formErrors.nombre_usuario = 'Error al verificar disponibilidad';
    } finally {
        isCheckingUsername.value = false;
    }
};

// Validar nombre
const validateNombre = () => {
    if (!formData.nombre || formData.nombre.trim().length < 2) {
        formErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
    } else {
        formErrors.nombre = '';
    }
};

// Formatear fecha
const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';

    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
};

// Cargar preferencias del usuario (localStorage)
const loadUserPreferences = (userId) => {
    try {
        const savedPrefs = localStorage.getItem(`user_preferences_${userId}`);
        if (savedPrefs) {
            const prefs = JSON.parse(savedPrefs);
            userPreferences.value = {
                notificaciones: prefs.notificaciones || false,
                idioma: prefs.idioma || 'Español',
                moneda: prefs.moneda || 'EUR'
            };

            // Actualizar formulario con preferencias actuales
            formData.notificaciones = userPreferences.value.notificaciones;
            formData.idioma = userPreferences.value.idioma;
            formData.moneda = userPreferences.value.moneda;
        }

        // Simular fecha de registro
        fechaRegistro.value = formatDate(new Date());
    } catch (error) {
        console.error('Error al cargar preferencias:', error);
    }
};

// Cargar estadísticas del usuario (simulado)
const loadUserStats = () => {
    try {
        // Simular carga de estadísticas
        visitados.value = [];
        favoritos.value = [];
        tripLists.value = [];
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
};

// Alternar modo de edición
const toggleEditMode = (section) => {
    clearMessages();
    clearFormErrors();

    editMode[section] = !editMode[section];

    // Si activamos el modo edición, inicializar el formulario con los datos actuales
    if (editMode[section]) {
        if (section === 'personal' && usuario.value) {
            formData.nombre = usuario.value.nombre || '';
            formData.nombre_usuario = usuario.value.nombre_usuario || '';
        } else if (section === 'preferences') {
            formData.notificaciones = userPreferences.value.notificaciones;
            formData.idioma = userPreferences.value.idioma;
            formData.moneda = userPreferences.value.moneda;
        }
    }
};

// Cancelar edición
const cancelEdit = (section) => {
    editMode[section] = false;
    clearMessages();
    clearFormErrors();
};

// Activar input de archivo
const triggerFileUpload = () => {
    fileInput.value?.click();
};

// Manejar subida de archivo
const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
        // Validar que sea una imagen
        if (!file.type.startsWith('image/')) {
            errorMessage.value = 'Por favor, selecciona un archivo de imagen válido.';
            return;
        }

        // Validar tamaño (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
            errorMessage.value = 'El archivo es demasiado grande. El tamaño máximo es 5MB.';
            return;
        }

        // Crear URL temporal para mostrar la imagen
        const reader = new FileReader();
        reader.onload = (e) => {
            // Actualizar la foto de perfil del usuario
            if (usuario.value) {
                usuario.value.foto_perfil = e.target.result;
                successMessage.value = 'Foto de perfil actualizada correctamente.';
            }

            // Aquí se implementaría la subida real del archivo al servidor
            console.log('Archivo seleccionado:', file.name);
        };
        reader.readAsDataURL(file);
    }
};

// Actualizar perfil
const updateProfile = async () => {
    if (!usuario.value) return;

    clearMessages();

    // Validar campos
    validateNombre();
    await validateUsername();

    if (hasFormErrors.value) {
        errorMessage.value = 'Por favor, corrige los errores antes de continuar.';
        return;
    }

    isUpdating.value = true;

    try {
        // Actualizar en la base de datos
        await turso.execute({
            sql: `UPDATE Usuarios 
              SET nombre = ?, nombre_usuario = ?
              WHERE id_usuario = ?`,
            args: [formData.nombre, formData.nombre_usuario, usuario.value.id_usuario],
        });

        // Actualizar el objeto usuario local
        usuario.value.nombre = formData.nombre;
        usuario.value.nombre_usuario = formData.nombre_usuario;

        // Salir del modo edición
        editMode.personal = false;

        successMessage.value = 'Perfil actualizado con éxito.';
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        errorMessage.value = 'Error al actualizar el perfil. Inténtalo de nuevo.';
    } finally {
        isUpdating.value = false;
    }
};

// Actualizar preferencias
const updatePreferences = async () => {
    if (!usuario.value) return;

    isUpdating.value = true;
    clearMessages();

    try {
        // Guardar en localStorage
        const prefsToSave = {
            notificaciones: formData.notificaciones,
            idioma: formData.idioma,
            moneda: formData.moneda
        };

        localStorage.setItem(`user_preferences_${usuario.value.id_usuario}`, JSON.stringify(prefsToSave));

        // Actualizar el objeto de preferencias local
        userPreferences.value.notificaciones = formData.notificaciones;
        userPreferences.value.idioma = formData.idioma;
        userPreferences.value.moneda = formData.moneda;

        // Salir del modo edición
        editMode.preferences = false;

        successMessage.value = 'Preferencias actualizadas con éxito.';
    } catch (error) {
        console.error('Error al actualizar preferencias:', error);
        errorMessage.value = 'Error al actualizar las preferencias. Inténtalo de nuevo.';
    } finally {
        isUpdating.value = false;
    }
};

// Manejar inicio de sesión exitoso
const handleLoginSuccess = async () => {
    await loadUserData();
};

// Manejar cierre de sesión
const handleLogout = () => {
    logoutUsuario();
    router.push({ name: 'Home' });
};

// Cargar datos del usuario
const loadUserData = async () => {
    isLoading.value = true;

    try {
        // Verificar si el usuario está autenticado
        if (!isUserAuthenticated()) {
            isLoading.value = false;
            return;
        }

        // Obtener usuario actual
        usuario.value = getUsuarioActual();

        if (usuario.value && usuario.value.id_usuario) {
            const userId = usuario.value.id_usuario;

            // Cargar preferencias y estadísticas
            loadUserPreferences(userId);
            loadUserStats();
        }
    } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
    } finally {
        isLoading.value = false;
    }
};

// Cargar datos al montar
onMounted(async () => {
    await loadUserData();
});
</script>

<style scoped>
/* Estilos generales */
.perfil-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1rem;
    font-family: 'Poppins', sans-serif;
}

/* Header con estilo consistente */
.countries-header {
    text-align: center;
    margin-bottom: 2.5rem;
    position: relative;
}

.countries-header h1 {
    color: var(--color-primary, #1e3a8a);
    font-size: 2.5rem;
    margin: 0 0 0.5rem 0;
    font-weight: 700;
}

.countries-header p {
    color: #6c757d;
    font-size: 1.1rem;
    margin-top: 1rem;
}

.header-line {
    height: 4px;
    width: 80px;
    background-color: var(--color-accent, #ffa500);
    margin: 0 auto;
}

/* Notificaciones */
.error-notification,
.success-notification {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    border-radius: 4px;
    margin-bottom: 1rem;
    font-size: 0.9rem;
}

.error-notification {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.success-notification {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

/* Errores de campo */
.field-error {
    color: #dc3545;
    font-size: 0.8rem;
    margin-top: 0.25rem;
    display: block;
}

.form-control.error {
    border-color: #dc3545;
    box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}

/* Verificación de nombre de usuario */
.checking-username {
    color: #6c757d;
    font-size: 0.8rem;
    margin-top: 0.25rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

/* Estado de carga */
.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 5rem 1rem;
    text-align: center;
}

.spinner {
    margin: 0 auto;
    width: 70px;
    text-align: center;
    margin-bottom: 1.5rem;
}

.spinner>div {
    width: 18px;
    height: 18px;
    background-color: var(--color-primary, #1e3a8a);
    border-radius: 100%;
    display: inline-block;
    animation: sk-bouncedelay 1.4s infinite ease-in-out both;
    margin: 0 3px;
}

.spinner .bounce1 {
    animation-delay: -0.32s;
}

.spinner .bounce2 {
    animation-delay: -0.16s;
}

@keyframes sk-bouncedelay {

    0%,
    80%,
    100% {
        transform: scale(0);
    }

    40% {
        transform: scale(1.0);
    }
}

/* Estado de autenticación requerida */
.auth-required {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 5rem 1rem;
    text-align: center;
    background-color: #f8f9fa;
    border-radius: 12px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.auth-icon {
    font-size: 5rem;
    color: #6c757d;
    margin-bottom: 1.5rem;
    opacity: 0.7;
}

.auth-required h2 {
    font-size: 1.8rem;
    margin-bottom: 1rem;
    color: #333;
    font-weight: 600;
}

.auth-required p {
    color: #6c757d;
    margin-bottom: 2rem;
    max-width: 500px;
    line-height: 1.6;
}

.btn-login {
    background-color: var(--color-primary, #1e3a8a);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 30px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn-login:hover {
    background-color: var(--color-accent, #ffa500);
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

/* Dashboard de perfil */
.profile-dashboard {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
}

/* Tarjetas de perfil */
.profile-card {
    background-color: white;
    border-radius: 12px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.profile-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem;
    background-color: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
}

.card-header h2 {
    margin: 0;
    font-size: 1.25rem;
    color: var(--color-primary, #1e3a8a);
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.btn-edit {
    background-color: #e9ecef;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 30px;
    font-weight: 500;
    color: #495057;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
}

.btn-edit:hover {
    background-color: #dee2e6;
}

/* Tarjeta de información personal */
.personal-info {
    display: flex;
    flex-direction: column;
}

.profile-avatar {
    display: flex;
    justify-content: center;
    padding: 1.5rem 0;
    position: relative;
}

.profile-avatar img {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    object-fit: cover;
    border: 4px solid white;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.no-avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background-color: #f8f9fa;
    border: 4px solid white;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6c757d;
    font-size: 4rem;
}

.avatar-overlay {
    position: absolute;
    top: 1.5rem;
    left: 50%;
    transform: translateX(-50%);
    width: 120px;
    height: 120px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    opacity: 0;
    transition: opacity 0.3s ease;
    border-radius: 50%;
    cursor: pointer;
}

.profile-avatar:hover .avatar-overlay {
    opacity: 1;
}

.avatar-overlay i {
    font-size: 2rem;
    margin-bottom: 0.5rem;
}

.avatar-overlay span {
    font-size: 0.8rem;
    text-align: center;
}

.profile-details,
.profile-edit-form {
    padding: 1.5rem;
}

.detail-item {
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
}

.detail-label {
    font-weight: 600;
    color: #6c757d;
    font-size: 0.9rem;
    margin-bottom: 0.25rem;
}

.detail-value {
    color: #212529;
}

/* Formulario de edición */
.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #495057;
}

.form-control {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 1rem;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.form-control:focus {
    border-color: var(--color-primary, #1e3a8a);
    outline: none;
    box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1);
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1.5rem;
}

.btn-cancel,
.btn-save {
    padding: 0.5rem 1.25rem;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn-cancel {
    background-color: #e9ecef;
    border: none;
    color: #495057;
}

.btn-save {
    background-color: var(--color-primary, #1e3a8a);
    border: none;
    color: white;
}

.btn-cancel:hover {
    background-color: #dee2e6;
}

.btn-save:hover {
    background-color: var(--color-accent, #ffa500);
}

.btn-save:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

/* Tarjeta de estadísticas */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    padding: 1.5rem;
}

.stat-item {
    background-color: #f8f9fa;
    border-radius: 8px;
    padding: 1.25rem;
    text-align: center;
    position: relative;
    overflow: hidden;
    transition: transform 0.3s ease;
}

.stat-item:hover {
    transform: translateY(-5px);
}

.stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-primary, #1e3a8a);
    margin-bottom: 0.5rem;
}

.stat-label {
    color: #6c757d;
    font-size: 0.9rem;
}

.stat-icon {
    position: absolute;
    bottom: -10px;
    right: -10px;
    font-size: 4rem;
    color: rgba(30, 58, 138, 0.1);
    transform: rotate(-15deg);
}

/* Tarjeta de preferencias */
.preferences-details {
    padding: 1.5rem;
}

.switch-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
}

.toggle-switch {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 24px;
}

.toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: .4s;
    border-radius: 34px;
}

.slider:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
}

input:checked+.slider {
    background-color: var(--color-primary, #1e3a8a);
}

input:checked+.slider:before {
    transform: translateX(26px);
}

/* Tarjeta de seguridad */
.security-options {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.security-option {
    display: flex;
    align-items: center;
    gap: 1rem;
    background-color: #f8f9fa;
    border: none;
    padding: 1rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: left;
}

.security-option:hover {
    background-color: #e9ecef;
}

.security-option i {
    font-size: 1.25rem;
    color: var(--color-primary, #1e3a8a);
}

/* Modales */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    padding: 1rem;
}

.modal-content {
    background-color: white;
    border-radius: 8px;
    padding: 1.5rem;
    max-width: 500px;
    width: 100%;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.modal-content h3 {
    margin-top: 0;
    color: var(--color-primary, #1e3a8a);
    margin-bottom: 1rem;
}

.btn-primary {
    background-color: var(--color-primary, #1e3a8a);
    color: white;
    border: none;
    padding: 0.5rem 1.25rem;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 1rem;
}

.btn-primary:hover {
    background-color: var(--color-accent, #ffa500);
}

/* Spinner para botones */
.spinner-border {
    display: inline-block;
    width: 1rem;
    height: 1rem;
    border: 0.2em solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spinner-border .75s linear infinite;
}

@keyframes spinner-border {
    to {
        transform: rotate(360deg);
    }
}

/* Media queries */
@media (max-width: 1024px) {
    .profile-dashboard {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 768px) {
    .profile-dashboard {
        grid-template-columns: 1fr;
    }

    .countries-header h1 {
        font-size: 2rem;
    }

    .stats-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 576px) {
    .perfil-container {
        padding: 1.5rem 0.75rem;
    }

    .countries-header h1 {
        font-size: 1.8rem;
    }

    .stats-grid {
        grid-template-columns: 1fr;
    }

    .card-header {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
    }

    .btn-edit {
        width: 100%;
        justify-content: center;
    }

    .form-actions {
        flex-direction: column;
    }

    .btn-cancel,
    .btn-save {
        width: 100%;
    }
}
</style>
  
