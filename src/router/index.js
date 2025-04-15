import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/HomeView.vue'
import Pais from '../views/PaisView.vue'
import Ciudad from '../views/CiudadView.vue'
import Destino from '../views/DestinoView.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/pais/:nombrePais',
    name: 'Pais',
    component: Pais
  },
  {
    path: '/pais/:nombrePais/:nombreCiudad',
    name: 'Ciudad',
    component: Ciudad
  },
  {
    path: '/pais/:nombrePais/:nombreCiudad/:nombreDestino',
    name: 'Destino',
    component: Destino
  }
]


const router = createRouter({
  history: createWebHistory(),
  routes,
  // Configuración de comportamiento de desplazamiento
  scrollBehavior() {
    return { top: 0 }
  }
})



export default router