<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getPaisesConCiudades } from '@/composables/useDatabase';

const router = useRouter();
const paises = ref([]);

// Variables for legal modal
const showLegalModal = ref(false);
const modalTitle = ref('');
const modalContent = ref('');

const currentYear = computed(() => new Date().getFullYear());
const popularDestinations = computed(() => {
    return paises.value.slice(0, 6);
});

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Function to open modal with corresponding legal content
function openLegalModal(type) {
    switch (type) {
        case 'privacy':
            modalTitle.value = 'Privacy Policy';
            modalContent.value = getPrivacyPolicyContent();
            break;
        case 'terms':
            modalTitle.value = 'Terms and Conditions';
            modalContent.value = getTermsContent();
            break;
        case 'cookies':
            modalTitle.value = 'Cookies Policy';
            modalContent.value = getCookiesPolicyContent();
            break;
        default:
            return;
    }
    showLegalModal.value = true;

    // Prevent scrolling when modal is open
    document.body.classList.add('overflow-hidden');
}

// Function to close the modal
function closeLegalModal() {
    showLegalModal.value = false;
    document.body.classList.remove('overflow-hidden');
}

// Functions to get legal content
function getPrivacyPolicyContent() {
    return `
    <h4>1. Information We Collect</h4>
    <p>At Travelle, we collect personal information such as your name, email address, and travel preferences when you register on our platform, use our services, or participate in our surveys.</p>
    
    <h4>2. How We Use Your Information</h4>
    <p>We use the collected information to personalize your experience, improve our services, process transactions, send periodic communications, and protect our platform.</p>
    
    <h4>3. Information Protection</h4>
    <p>We implement a variety of security measures to maintain the safety of your personal information. We use advanced encryption to protect sensitive information transmitted online.</p>
    
    <h4>4. Use of Cookies</h4>
    <p>We use cookies to understand and save your preferences for future visits and compile aggregate data about site traffic to offer the best possible experience.</p>
    
    <h4>5. Disclosure to Third Parties</h4>
    <p>We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. This does not include trusted third parties who assist us in operating our website or conducting our business.</p>
    
    <h4>6. Your Rights</h4>
    <p>You have the right to access, correct, or delete your personal information, as well as to restrict or object to certain processing of your data. To exercise these rights, contact us through the channels provided.</p>
    
    <h4>7. Changes to This Policy</h4>
    <p>We may update our privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page.</p>
    
    <h4>8. Contact</h4>
    <p>If you have any questions about this privacy policy, you can contact us at: info@travelle.com</p>
  `;
}

function getTermsContent() {
    return `
    <h4>1. Acceptance of Terms</h4>
    <p>By accessing and using Travelle, you agree to be bound by these Terms and Conditions, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.</p>
    
    <h4>2. Use License</h4>
    <p>You are granted a limited, non-exclusive, non-transferable, revocable license to access and use Travelle strictly in accordance with these terms. This license does not include the resale or commercial use of Travelle or its content.</p>
    
    <h4>3. Use Restrictions</h4>
    <p>You must not: (a) modify or copy the content; (b) use the content for any commercial purpose; (c) attempt to decompile or reverse engineer any software contained on Travelle; (d) remove any copyright or other proprietary notations; or (e) transfer the content to another person or "mirror" the content on any other server.</p>
    
    <h4>4. User Accounts</h4>
    <p>If you create an account on Travelle, you are responsible for maintaining the security of your account and you are fully responsible for all activities that occur under your account and any other actions taken in connection with the account.</p>
    
    <h4>5. User Content</h4>
    <p>By providing any content to Travelle, you grant Travelle a worldwide, non-exclusive, royalty-free right to use, reproduce, modify, adapt, publish, translate, distribute, and display such content.</p>
    
    <h4>6. Limitation of Liability</h4>
    <p>In no event shall Travelle or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Travelle.</p>
    
    <h4>7. Terms Modifications</h4>
    <p>Travelle may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.</p>
    
    <h4>8. Governing Law</h4>
    <p>These terms and conditions are governed by and construed in accordance with the laws of Spain and you irrevocably submit to the exclusive jurisdiction of the courts in that location.</p>
  `;
}

function getCookiesPolicyContent() {
    return `
    <h4>1. What Are Cookies?</h4>
    <p>Cookies are small text files that websites place on your device when you visit them. They are widely used to make websites work, or work more efficiently, as well as to provide information to the site owners.</p>
    
    <h4>2. How We Use Cookies</h4>
    <p>We use cookies to understand how you interact with our content and to improve your experience when you visit our website. For example, some cookies remember your viewing preferences so you don't have to re-enter them each time you visit our site.</p>
    
    <h4>3. Types of Cookies We Use</h4>
    <p><strong>Essential cookies:</strong> Necessary for the basic functioning of the site.<br>
    <strong>Preference cookies:</strong> Allow us to remember information that changes the way the site behaves or looks.<br>
    <strong>Statistics cookies:</strong> Help us understand how visitors interact with the site.<br>
    <strong>Marketing cookies:</strong> Used to track visitors across websites.</p>
    
    <h4>4. Cookie Control</h4>
    <p>You can set your browser not to accept cookies, and the above website tells you how to remove cookies from your browser. However, in a few cases, some of our website features may not function as a result.</p>
    
    <h4>5. Third-Party Cookies</h4>
    <p>We also use cookies provided by trusted third parties. The following section details which third-party cookies you might encounter through this site.</p>
    
    <h4>6. More Information</h4>
    <p>Hopefully that has clarified things for you. As was previously mentioned, if there is something that you aren't sure whether you need or not, it's usually safer to leave cookies enabled in case it does interact with one of the features you use on our site.</p>
    
    <h4>7. Contact</h4>
    <p>If you have any questions about this cookie policy, you can contact us at: info@travelle.com</p>
  `;
}

onMounted(async () => {
    try {
        paises.value = await getPaisesConCiudades();
    } catch (error) {
        console.error('Error loading countries:', error);
        paises.value = [];
    }

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && showLegalModal.value) {
            closeLegalModal();
        }
    });
});
</script>

<template>
    <footer class="footer-section">
        <!-- Main footer section -->
        <div class="container py-5">
            <div class="row">
                <!-- Brand and description column -->
                <div class="col-lg-5 col-md-6">
                    <div class="footer-brand mb-4">
                        <h3 class="text-white fw-bold mb-3">Travelle</h3>
                        <p class="mb-3">Your digital travel companion. Discover amazing places, save your favorites,
                            plan your adventures, and keep track of your experiences around the world.</p>
                    </div>
                    <div class="social-links">
                        <a href="#" class="social-link" aria-label="Facebook">
                            <i class="bi bi-facebook"></i>
                        </a>
                        <a href="#" class="social-link" aria-label="Twitter">
                            <i class="bi bi-twitter"></i>
                        </a>
                        <a href="#" class="social-link" aria-label="Instagram">
                            <i class="bi bi-instagram"></i>
                        </a>
                        <a href="#" class="social-link" aria-label="Pinterest">
                            <i class="bi bi-pinterest"></i>
                        </a>
                    </div>
                </div>

                <!-- Popular destinations column -->
                <div class="col-lg-3 col-md-6">
                    <h5 class="footer-heading">Popular Destinations</h5>
                    <ul class="footer-links">
                        <li v-for="pais in popularDestinations" :key="pais.id">
                            <router-link :to="{ name: 'Pais', params: { nombrePais: pais.nombre } }">
                                <i class="bi bi-geo-alt me-2"></i>{{ pais.nombre }}
                            </router-link>
                        </li>
                        <li>
                            <router-link to="/destinos" class="text-accent">
                                View all destinations <i class="bi bi-arrow-right"></i>
                            </router-link>
                        </li>
                    </ul>
                </div>

                <!-- Features and legal links column -->
                <div class="col-lg-4 col-md-12">
                    <div class="row g-5">
                        <!-- Features -->
                        <div class="col-md-6">
                            <h5 class="footer-heading">Features</h5>
                            <ul class="footer-links">
                                <li><router-link to="/mapa"><i class="bi bi-map me-2"></i>Explore Map</router-link>
                                </li>
                                <li><router-link to="/favoritos"><i class="bi bi-star me-2"></i>My
                                        Favorites</router-link></li>
                                <li><router-link to="/planificador"><i class="bi bi-journal-check me-2"></i>Plan
                                        Trip</router-link></li>
                                <li><router-link to="/visitados"><i class="bi bi-check-circle me-2"></i>Visited
                                        Places</router-link></li>
                                <li><router-link to="/cercanos"><i class="bi bi-geo-alt me-2"></i>Nearby
                                        Places</router-link></li>
                            </ul>
                        </div>

                        <!-- Legal links -->
                        <div class="col-md-6">
                            <h5 class="footer-heading">Legal Links</h5>
                            <ul class="footer-links">
                                <li><a href="#" @click.prevent="openLegalModal('privacy')"><i
                                            class="bi bi-shield-check me-2"></i>Privacy Policy</a></li>
                                <li><a href="#" @click.prevent="openLegalModal('terms')"><i
                                            class="bi bi-file-text me-2"></i>Terms & Conditions</a></li>
                                <li><a href="#" @click.prevent="openLegalModal('cookies')"><i
                                            class="bi bi-cookie me-2"></i>Cookies Policy</a></li>
                                <li><router-link to="/contacto"><i class="bi bi-envelope me-2"></i>Contact</router-link>
                                </li>
                                <li><router-link to="/ayuda"><i
                                            class="bi bi-question-circle me-2"></i>Help</router-link></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Bottom footer section -->
        <div class="footer-bottom">
            <div class="container py-3">
                <div class="row align-items-center">
                    <div class="col-md-6 text-center text-md-start">
                        <p class="mb-md-0"><i class="bi bi-c-circle me-1"></i> {{ currentYear }} Travelle. All rights
                            reserved.</p>
                    </div>
                    <div class="col-md-6 text-center text-md-end mt-3 mt-md-0">
                        <button @click="scrollToTop" class="btn btn-sm btn-outline-light scroll-top-btn">
                            <i class="bi bi-chevron-up me-1"></i> Back to top
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Legal content modal -->
        <div v-if="showLegalModal" class="legal-modal-overlay" @click="closeLegalModal">
            <div class="legal-modal" @click.stop>
                <div class="legal-modal-header">
                    <h4 class="mb-0">{{ modalTitle }}</h4>
                    <button type="button" class="btn-close" @click="closeLegalModal" aria-label="Close"></button>
                </div>
                <div class="legal-modal-body" v-html="modalContent"></div>
                <div class="legal-modal-footer">
                    <button type="button" class="btn btn-primary" @click="closeLegalModal">
                        <i class="bi bi-check2 me-1"></i> Accept
                    </button>
                </div>
            </div>
        </div>
    </footer>
</template>

<style scoped>
.footer-section {
    background-color: var(--color-primary);
    color: var(--color-textWhite);
    position: relative;
}

.footer-heading {
    font-weight: 600;
    margin-bottom: 1.5rem;
    position: relative;
    padding-bottom: 0.75rem;
}

.footer-heading::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: 0;
    width: 50px;
    height: 2px;
    background-color: var(--color-accent);
}

.footer-links {
    list-style: none;
    padding-left: 0;
    margin-bottom: 0;
}

.footer-links li {
    margin-bottom: 0.75rem;
}

.footer-links a {
    color: var(--color-textWhite);
    text-decoration: none;
    transition: color 0.3s, padding-left 0.3s;
    display: inline-block;
    cursor: pointer;
}

.footer-links a:hover {
    color: var(--color-accent);
    padding-left: 5px;
}

.text-accent {
    color: var(--color-accent) !important;
    font-weight: 500;
}

.social-links {
    display: flex;
    gap: 15px;
    margin-bottom: 1.5rem;
}

.social-link {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    color: var(--color-textWhite);
    text-decoration: none;
    font-size: 1rem;
    transition: all 0.3s;
}

.social-link:hover {
    background-color: var(--color-accent);
    color: var(--color-textWhite);
    transform: translateY(-3px);
}

.footer-bottom {
    background-color: rgba(0, 0, 0, 0.15);
    font-size: 0.875rem;
}

.scroll-top-btn {
    border-radius: 30px;
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
    transition: all 0.3s;
}

.scroll-top-btn:hover {
    background-color: var(--color-textWhite);
    color: var(--color-primary);
}

/* Legal modal styles */
.legal-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1050;
    padding: 1rem;
}

.legal-modal {
    background-color: white;
    border-radius: 0.5rem;
    width: 100%;
    max-width: 700px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    animation: modal-appear 0.3s ease-out;
}

.legal-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    color: var(--color-text);
}

.legal-modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    color: var(--color-text);
}

.legal-modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: flex-end;
}

.btn-primary {
    background-color: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
    padding: 0.5rem 1.5rem;
    border-radius: 0.25rem;
    transition: all 0.3s;
}

.btn-primary:hover {
    background-color: var(--color-accent);
    border-color: var(--color-accent);
}

@keyframes modal-appear {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@media (max-width: 767.98px) {
    .footer-heading {
        margin-top: 1rem;
        margin-bottom: 1rem;
    }

    .footer-links li {
        margin-bottom: 0.5rem;
    }

    .social-links {
        justify-content: center;
    }

    .footer-bottom {
        text-align: center;
    }

    .legal-modal {
        max-height: 90vh;
    }
}
</style>