// src/composables/useAuth.js
import { turso } from '@/services/tursoClient';
import { ref } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const user = ref(null);
const isAuthenticated = ref(false);

// Cargar usuario desde localStorage al iniciar
try {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        user.value = JSON.parse(savedUser);
        isAuthenticated.value = true;
    }
} catch (error) {
    console.error('Error al cargar usuario:', error);
}

export function useAuth() {
    // Obtener usuario actual
    function getUsuarioActual() {
        return user.value;
    }

    // Verificar si el usuario está autenticado
    function isUserAuthenticated() {
        return isAuthenticated.value;
    }

    // Iniciar sesión
    async function loginUsuario(email, password) {
        try {
            // Buscar usuario por email
            const result = await turso.execute({
                sql: `SELECT id_usuario, nombre_usuario, nombre, email, password, foto_perfil 
              FROM Usuarios 
              WHERE email = ?`,
                args: [email]
            });

            if (result.rows.length === 0) {
                throw new Error('Correo o contraseña incorrectos');
            }

            const userData = result.rows[0];

            // Verificar contraseña
            // Nota: Durante la transición, verificamos tanto la contraseña hasheada como la de texto plano
            let isPasswordValid = false;

            // Si la contraseña ya está hasheada con bcrypt (comienza con $2a$, $2b$ o $2y$)
            if (userData.password && (userData.password.startsWith('$2a$') ||
                userData.password.startsWith('$2b$') ||
                userData.password.startsWith('$2y$'))) {
                isPasswordValid = await bcrypt.compare(password, userData.password);
            } else {
                // Verificación temporal para contraseñas en texto plano (durante la migración)
                isPasswordValid = (password === userData.password);

                // Si la contraseña es correcta, actualizamos a hash para futuras verificaciones
                if (isPasswordValid) {
                    const hashedPassword = await bcrypt.hash(password, 10);
                    await turso.execute({
                        sql: `UPDATE Usuarios SET password = ? WHERE id_usuario = ?`,
                        args: [hashedPassword, userData.id_usuario]
                    });
                }
            }

            if (!isPasswordValid) {
                throw new Error('Correo o contraseña incorrectos');
            }

            // No devolver la contraseña al cliente
            const { password: _, ...userWithoutPassword } = userData;

            // Guardar en estado y localStorage
            user.value = userWithoutPassword;
            isAuthenticated.value = true;
            localStorage.setItem('user', JSON.stringify(userWithoutPassword));

            return userWithoutPassword;
        } catch (error) {
            console.error('Error en login:', error);
            throw error;
        }
    }

    // Cerrar sesión
    function logoutUsuario() {
        user.value = null;
        isAuthenticated.value = false;
        localStorage.removeItem('user');
    }

    // Verificar si existe un email
    async function verificarEmailExistente(email) {
        try {
            const result = await turso.execute({
                sql: `SELECT id_usuario FROM Usuarios WHERE email = ?`,
                args: [email]
            });

            return result.rows.length > 0;
        } catch (error) {
            console.error('Error al verificar email:', error);
            throw error;
        }
    }

    // Verificar si existe un nombre de usuario
    async function verificarUsernameExistente(username) {
        try {
            const result = await turso.execute({
                sql: `SELECT id_usuario FROM Usuarios WHERE nombre_usuario = ?`,
                args: [username]
            });

            return result.rows.length > 0;
        } catch (error) {
            console.error('Error al verificar nombre de usuario:', error);
            throw error;
        }
    }

    // Registrar usuario
    async function registrarUsuario({ username, name, email, password }) {
        try {
            // Verificar si el email ya existe
            const emailExiste = await verificarEmailExistente(email);
            if (emailExiste) {
                throw new Error('El correo electrónico ya está registrado');
            }

            // Verificar si el nombre de usuario ya existe
            const usernameExiste = await verificarUsernameExistente(username);
            if (usernameExiste) {
                throw new Error('El nombre de usuario ya está en uso');
            }

            // Hashear contraseña
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insertar usuario
            const result = await turso.execute({
                sql: `INSERT INTO Usuarios (nombre_usuario, nombre, email, password) 
              VALUES (?, ?, ?, ?)`,
                args: [username, name, email, hashedPassword]
            });

            if (result.error) {
                throw new Error('Error al registrar usuario');
            }

            // Obtener el usuario recién creado
            const userResult = await turso.execute({
                sql: `SELECT id_usuario, nombre_usuario, nombre, email, foto_perfil 
              FROM Usuarios 
              WHERE email = ?`,
                args: [email]
            });

            if (userResult.rows.length > 0) {
                const newUser = userResult.rows[0];
                user.value = newUser;
                isAuthenticated.value = true;
                localStorage.setItem('user', JSON.stringify(newUser));
                return newUser;
            }

            return true;
        } catch (error) {
            console.error('Error al registrar usuario:', error);
            throw error;
        }
    }

    // Solicitar recuperación de contraseña
    async function solicitarRecuperacion(email) {
        try {
            const userResult = await turso.execute({
                sql: `SELECT id_usuario FROM Usuarios WHERE email = ?`,
                args: [email],
            });

            if (userResult.rows.length === 0) {
                // No indicamos al usuario que el email no existe por seguridad
                return { success: true };
            }

            // Generar token único
            const token = uuidv4();
            const userId = userResult.rows[0].id_usuario;

            // Token válido por 1 hora
            const expiration = new Date();
            expiration.setHours(expiration.getHours() + 1);

            // Eliminar tokens anteriores para este usuario
            await turso.execute({
                sql: `DELETE FROM RecuperacionContrasena WHERE id_usuario = ?`,
                args: [userId],
            });

            // Crear nuevo token
            await turso.execute({
                sql: `INSERT INTO RecuperacionContrasena (id_usuario, token, fecha_expiracion, usado) 
            VALUES (?, ?, ?, 0)`,
                args: [userId, token, expiration.toISOString()],
            });

            // Importar el servicio de correo y enviar el correo de recuperación
            try {
                const { enviarCorreoRecuperacion } = await import("@/services/emailServices");
                const result = await enviarCorreoRecuperacion(email, token);

                if (result.dev) {
                    console.log(`[MODO DEV] Se enviaría enlace de recuperación a ${email}`);
                    console.log(`Enlace de recuperación: ${window.location.origin}/reset-password/${token}`);
                }

                return { success: true };
            } catch (emailError) {
                console.error("Error al enviar correo de recuperación:", emailError);
                //  devolviendo éxito para no revelar si el email existe
                return { success: true };
            }
        } catch (error) {
            console.error("Error al solicitar recuperación:", error);
            throw error;
        }
    }

    // Verificar token de recuperación
    async function verificarTokenRecuperacion(token) {
        try {
            const result = await turso.execute({
                sql: `SELECT r.id_usuario, u.email, r.fecha_expiracion, r.intentos 
              FROM RecuperacionContrasena r
              JOIN Usuarios u ON r.id_usuario = u.id_usuario
              WHERE r.token = ? AND r.usado = 0`,
                args: [token],
            })

            if (result.rows.length === 0) {
                return { valid: false }
            }

            const { id_usuario, email, fecha_expiracion, intentos } = result.rows[0]
            const expiryDate = new Date(fecha_expiracion)
            const maxIntentos = 3 // Máximo número de intentos permitidos

            // Verificar si el token ha expirado
            if (expiryDate < new Date()) {
                return { valid: false }
            }

            // Verificar si se ha excedido el número máximo de intentos
            if (intentos >= maxIntentos) {
                // Importar el servicio de email y enviar notificación
                try {
                    const { enviarCorreoNotificacion } = await import("@/services/emailServices")
                    await enviarCorreoNotificacion(
                        email,
                        "Security Alert - Password Reset Attempts Exceeded",
                        `<p>We've detected multiple failed attempts to reset your password.</p>
             <p>For security reasons, the reset link has been invalidated.</p>
             <p>If this wasn't you, we recommend changing your password immediately.</p>`
                    )
                } catch (emailError) {
                    console.error("Error sending security notification:", emailError)
                }

                // Invalidar el token
                await turso.execute({
                    sql: `UPDATE RecuperacionContrasena SET usado = 1 WHERE token = ?`,
                    args: [token],
                })

                return { valid: false, maxAttemptsExceeded: true }
            }

            // Incrementar el contador de intentos
            await turso.execute({
                sql: `UPDATE RecuperacionContrasena SET intentos = intentos + 1 WHERE token = ?`,
                args: [token],
            })

            return { valid: true, userId: id_usuario, email }
        } catch (error) {
            console.error("Error al verificar token:", error)
            throw error
        }
  }


    // Restablecer contraseña
    async function restablecerContrasena(token, newPassword) {
        try {
            // Verificar token
            const tokenCheck = await verificarTokenRecuperacion(token)

            if (!tokenCheck.valid) {
                return { success: false, error: "El enlace es inválido o ha expirado" }
            }

            // Hashear nueva contraseña
            const hashedPassword = await bcrypt.hash(newPassword, 10)

            // Actualizar contraseña
            const updateResult = await turso.execute({
                sql: `UPDATE Usuarios SET password = ? WHERE id_usuario = ?`,
                args: [hashedPassword, tokenCheck.userId],
            })

            if (updateResult.rowsAffected === 0) {
                return { success: false, error: "No se pudo actualizar la contraseña" }
            }

            // Marcar token como usado
            await turso.execute({
                sql: `UPDATE RecuperacionContrasena SET usado = 1 WHERE token = ?`,
                args: [token],
            })

            // Enviar notificación de cambio de contraseña exitoso
            try {
                const { enviarCorreoNotificacion } = await import("@/services/emailServices")
                await enviarCorreoNotificacion(
                    tokenCheck.email,
                    "Password Reset Successful",
                    `<p>Your password has been successfully reset.</p>
           <p>If you did not request this change, please contact our support team immediately.</p>`
                )
            } catch (emailError) {
                console.error("Error sending password reset notification:", emailError)
            }

            return { success: true }
        } catch (error) {
            console.error("Error al restablecer contraseña:", error)
            throw error
        }
  }

    return {
        user,
        isAuthenticated,
        getUsuarioActual,
        isUserAuthenticated,
        loginUsuario,
        logoutUsuario,
        registrarUsuario,
        verificarEmailExistente,
        verificarUsernameExistente,
        solicitarRecuperacion,
        verificarTokenRecuperacion,
        restablecerContrasena
    };
}