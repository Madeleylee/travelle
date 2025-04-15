<script setup>
import NavBar from './components/NavBar.vue'
import Footer from './components/Footer.vue'
</script>


<template>
  <div id="app">
    <NavBar />
    <main class="main-content">
    <router-view></router-view>
    </main>
    <Footer />
  </div>
</template>


<style>

.main-content {
  padding-top: 120px;
  /* Ajusta este valor según la altura de tu NavBar */
  min-height: calc(100vh - 60px);
  /* Ajusta 60px al alto de tu Footer */
}

@media (max-width: 1024px) {
  .main-content {
    padding-top: 180px;
    /* Aumenta este valor para dispositivos tablet */
  }
}

@media (max-width: 768px) {
  .main-content {
    padding-top: 200px;
    /* Aumenta este valor para dispositivos móviles */
  }
}
</style>