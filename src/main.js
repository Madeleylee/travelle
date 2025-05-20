import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/main.css'


// Font Awesome
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
    faGlobe,
    faCity,
    faMapMarkerAlt,
    faSearch,
    faUser,
    faSignOutAlt,
    faUserCheck,
    faStar,        
    faMap,    
    faListUl,  


} from '@fortawesome/free-solid-svg-icons'


//Css Leaflet
import 'leaflet/dist/leaflet.css';

//Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'

// Agregar íconos a la librería
library.add(
    faGlobe,
    faCity,
    faMapMarkerAlt,
    faSearch,
    faUser,
    faSignOutAlt,
    faUserCheck,
    faStar,
    faMap,
    faListUl
)

// 🔧 Crear la app ANTES de registrar componentes
const app = createApp(App)

// Registrar el componente global de Font Awesome
app.component('font-awesome-icon', FontAwesomeIcon)

// Usar router y montar la app
app.use(router).mount('#app')
