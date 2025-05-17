// src/utils/navigation.js

/**
 * Navega hacia atrás si hay historial, o redirige a una ruta segura.
 * @param {Object} router - Instancia de vue-router.
 * @param {Object} fallbackRoute - Ruta a redirigir si no hay historial.
 */
export function safeGoBack(router, fallbackRoute = { name: 'Home' }) {
    if (window.history.length > 1) {
        router.back();
    } else {
        router.push(fallbackRoute);
    }
}
