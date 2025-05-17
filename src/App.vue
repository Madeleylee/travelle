<script setup>
// import NavBar from './components/NavBar.vue'
import Footer from './components/Footer.vue'
import NavBar from './components/NavBarComponent.vue'
</script>


<template>
  <div id="app">
    <NavBar />
    <main>
    <router-view></router-view>
    </main>
    <Footer />
  </div>
</template>
