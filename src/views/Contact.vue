<template>
    <div class="contact-container">
        <div class="contact-header">
            <h2>Contacto</h2>
            <p>¿Tienes alguna pregunta o sugerencia? ¡Nos encantaría escucharte!</p>
        </div>

        <div class="contact-content">
            <div class="contact-info">
                <div class="info-section">
                    <h3>Digital Innovators</h3>
                    <div class="info-item">
                        <i class="icon-email"></i>
                        <div>
                            <strong>Email:</strong>
                            <a href="mailto:travelle.information@gmail.com">travelle.information@gmail.com</a>
                        </div>
                    </div>

                    <div class="info-item">
                        <i class="icon-person"></i>
                        <div>
                            <strong>Desarrolladora:</strong>
                            <span>Adriainnee Madeley Lee Navas Briceño</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="contact-form">
                <h3>Envíanos un mensaje</h3>
                <form @submit.prevent="submitForm" class="form">
                    <div class="form-group">
                        <label for="name">Nombre *</label>
                        <input type="text" id="name" v-model="form.name" required placeholder="Tu nombre completo">
                    </div>

                    <div class="form-group">
                        <label for="email">Email *</label>
                        <input type="email" id="email" v-model="form.email" required placeholder="tu@email.com">
                    </div>

                    <div class="form-group">
                        <label for="subject">Asunto</label>
                        <select id="subject" v-model="form.subject">
                            <option value="">Selecciona un tema</option>
                            <option value="consulta">Consulta general</option>
                            <option value="sugerencia">Sugerencia</option>
                            <option value="error">Reportar error</option>
                            <option value="colaboracion">Colaboración</option>
                            <option value="otro">Otro</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="message">Mensaje *</label>
                        <textarea id="message" v-model="form.message" required rows="5"
                            placeholder="Escribe tu mensaje aquí..."></textarea>
                    </div>

                    <button type="submit" class="submit-btn" :disabled="isSubmitting">
                        <span v-if="isSubmitting">Enviando...</span>
                        <span v-else>Enviar mensaje</span>
                    </button>
                </form>

                <div v-if="submitMessage" class="submit-message" :class="submitStatus">
                    {{ submitMessage }}
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ContactComponent',
    data() {
        return {
            form: {
                name: '',
                email: '',
                subject: '',
                message: ''
            },
            isSubmitting: false,
            submitMessage: '',
            submitStatus: ''
        }
    },
    methods: {
        async submitForm() {
            this.isSubmitting = true;
            this.submitMessage = '';

            try {
                // Simular envío de email (en producción conectarías con tu API)
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Aquí podrías integrar con tu servicio de email existente
                // const response = await fetch('/api/send-email', {
                //   method: 'POST',
                //   headers: { 'Content-Type': 'application/json' },
                //   body: JSON.stringify(this.form)
                // });

                this.submitMessage = '¡Mensaje enviado correctamente! Te responderemos pronto.';
                this.submitStatus = 'success';
                this.resetForm();

            } catch (error) {
                this.submitMessage = 'Error al enviar el mensaje. Por favor, intenta de nuevo.';
                this.submitStatus = 'error';
            } finally {
                this.isSubmitting = false;
                setTimeout(() => {
                    this.submitMessage = '';
                }, 5000);
            }
        },

        resetForm() {
            this.form = {
                name: '',
                email: '',
                subject: '',
                message: ''
            };
        }
    }
}
</script>

<style scoped>
.contact-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.contact-header {
    text-align: center;
    margin-bottom: 3rem;
}

.contact-header h2 {
    font-size: 2.5rem;
    font-weight: 700;
    color: #2c3e50;
    margin-bottom: 1rem;
}

.contact-header p {
    font-size: 1.1rem;
    color: #7f8c8d;
    max-width: 600px;
    margin: 0 auto;
}

.contact-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
    align-items: start;
}

.contact-info {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.info-section h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 1rem;
    border-bottom: 2px solid var(--color-accent);
    padding-bottom: 0.5rem;
}

.info-item {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
    border-left: 4px solid var(--color-accent);
}

.info-item i {
    width: 20px;
    height: 20px;
    background: var(--color-accent);
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 2px;
}

.info-item strong {
    display: block;
    color: #2c3e50;
    margin-bottom: 0.25rem;
}

.info-item a {
    color: var(--color-primary);
    text-decoration: none;
}

.info-item a:hover {
    text-decoration: underline;
}

.info-section p {
    color: #7f8c8d;
    line-height: 1.6;
    margin-bottom: 1rem;
}

.contact-form {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    border: 1px solid #e9ecef;
}

.contact-form h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 1.5rem;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    font-weight: 500;
    color: #2c3e50;
    margin-bottom: 0.5rem;
}

.form-group input,
.form-group select,
.form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e9ecef;
    border-radius: 6px;
    font-size: 1rem;
    transition: border-color 0.3s ease;
    font-family: inherit;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.form-group textarea {
    resize: vertical;
    min-height: 120px;
}

.submit-btn {
    width: 100%;
    padding: 1rem;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.submit-btn:hover:not(:disabled) {
    background: var(--color-primary);
}

.submit-btn:disabled {
    background: #bdc3c7;
    cursor: not-allowed;
}

.submit-message {
    margin-top: 1rem;
    padding: 1rem;
    border-radius: 6px;
    font-weight: 500;
}

.submit-message.success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.submit-message.error {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

/* Responsive Design */
@media (max-width: 768px) {
    .contact-container {
        padding: 1rem;
    }

    .contact-content {
        grid-template-columns: 1fr;
        gap: 2rem;
    }

    .contact-header h2 {
        font-size: 2rem;
    }

    .contact-form {
        padding: 1.5rem;
    }

    .info-item {
        flex-direction: column;
        gap: 0.5rem;
    }

    .info-item i {
        align-self: flex-start;
    }
}

@media (max-width: 480px) {
    .contact-header h2 {
        font-size: 1.75rem;
    }

    .contact-form {
        padding: 1rem;
    }
}
</style>
  
