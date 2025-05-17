<template>
    <div class="notification-container" v-if="visible">
        <div class="notification-content">
            <div class="notification-icon">
                <i class="bi bi-shield-lock"></i>
            </div>
            <div class="notification-message">
                <h4>Acceso restringido</h4>
                <p>Necesitas iniciar sesión para acceder a esta sección</p>
            </div>
            <div class="notification-actions">
                <button class="btn-login" @click="showLoginModal">
                    Iniciar sesión
                </button>
                <button class="btn-close" @click="close">
                    <i class="bi bi-x"></i>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    autoClose: {
        type: Number,
        default: 5000 // 5 segundos por defecto
    }
});

const emit = defineEmits(['close', 'login']);

// Timer para cerrar automáticamente
let timer = null;

function close() {
    emit('close');
    if (timer) {
        clearTimeout(timer);
    }
}

function showLoginModal() {
    emit('login');
    close();
}

onMounted(() => {
    if (props.visible && props.autoClose > 0) {
        timer = setTimeout(() => {
            close();
        }, props.autoClose);
    }
});
</script>

<style scoped>
.notification-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
    max-width: 400px;
    width: 100%;
    animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }

    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.notification-content {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    overflow: hidden;
    border-left: 4px solid var(--color-primary);
}

.notification-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 15px;
    font-size: 1.5rem;
    color: var(--color-primary);
}

.notification-message {
    flex: 1;
    padding: 15px 10px;
}

.notification-message h4 {
    margin: 0 0 5px 0;
    color: var(--color-primary);
    font-size: 1rem;
}

.notification-message p {
    margin: 0;
    font-size: 0.9rem;
    color: #666;
}

.notification-actions {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 10px;
}

.btn-login {
    background-color: var(--color-primary);
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
    margin-bottom: 5px;
}

.btn-close {
    background: none;
    border: none;
    color: #999;
    cursor: pointer;
    font-size: 1rem;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.btn-login:hover {
    background-color: var(--color-accent);
}

.btn-close:hover {
    color: #666;
}

@media (max-width: 480px) {
    .notification-container {
        width: 90%;
        right: 5%;
    }
}
</style>
  
