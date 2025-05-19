import { createRouter, createWebHistory } from "vue-router"
import Home from "../views/HomeView.vue"
import Pais from "../views/PaisView.vue"
import Ciudad from "../views/CiudadView.vue"
import Destino from "../views/DestinoView.vue"
import Paises from "../views/CountriesGridPage.vue"
import Favorite from "../views/FavoriteView.vue"
import Visitados from "../views/VisitadosView.vue"
import Perfil from "../views/PerfilView.vue"
import Lista from "../views/TodoListView.vue"
import NotFound from "../views/NotFoundView.vue"

/*Componentes de registro */
import LoginForm from "../components/LoginForm.vue"
import RegistroForm from "../components/RegistroForm.vue"
import RecuperarPassword from "../components/RecuperarPassword.vue"
import ResetPassword from "../components/ResetPasswordForm.vue"

// Importar el composable de autenticación
import { useAuth } from "@/composables/useAuth"

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/pais/:nombrePais",
    name: "Pais",
    component: Pais,
  },
  {
    path: "/pais/:nombrePais/:nombreCiudad",
    name: "Ciudad",
    component: Ciudad,
  },
  {
    path: "/pais/:nombrePais/:nombreCiudad/:nombreDestino",
    name: "Destino",
    component: Destino,
  },
  {
    path: "/login",
    name: "Login",
    component: LoginForm,
  },
  {
    path: "/register",
    name: "Register",
    component: RegistroForm,
  },
  {
    path: "/recover",
    name: "Recover",
    component: RecuperarPassword,
  },
  {
    path: "/reset-password/:token",
    name: "ResetPassword",
    component: ResetPassword,
  },
  {
    path: "/paises",
    name: "Paises",
    component: Paises,
  },
  // Rutas protegidas
  {
    path: "/favoritos",
    name: "Favoritos",
    component: Favorite,
    meta: { requiresAuth: true }
  },
  // Añade aquí las demás rutas protegidas

  {
    path: "/perfil",
    name: "Perfil",
    component: Perfil,
    meta: { requiresAuth: true }
  },
  {
    path: "/lista",
    name: "Lista",
    component: Lista,
    meta: { requiresAuth: true }
  },
  {
    path: "/visitados",
    name: "visitados",
    component: Visitados,
    meta: { requiresAuth: true }
  },
  // Ruta para manejar páginas no encontradas (404)
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component:NotFound
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  // Configuración de comportamiento de desplazamiento
  scrollBehavior() {
    return { top: 0 }
  },
})

// Navigation Guard para proteger rutas
router.beforeEach((to, from, next) => {
  // Obtener el estado de autenticación
  const { isUserAuthenticated } = useAuth();

  // Comprobar si la ruta requiere autenticación
  if (to.meta.requiresAuth && !isUserAuthenticated()) {
    // Si requiere autenticación y el usuario no está autenticado,
    // redirigir a la página de login con la ruta de retorno
    next({
      name: 'Login',
      query: { redirect: to.fullPath }
    });
  } else {
    // En caso contrario, permitir la navegación
    next();
  }
})

export default router