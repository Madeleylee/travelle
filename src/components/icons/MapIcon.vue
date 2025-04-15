<template>
    <svg xmlns="http://www.w3.org/2000/svg" :width="width" :height="height" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" :stroke-width="strokeWidth" stroke-linecap="round" stroke-linejoin="round"
        class="map-icon">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
    </svg>
</template>

<script setup>
defineProps({
    width: {
        type: [Number, String],
        default: 24
    },
    height: {
        type: [Number, String],
        default: 24
    },
    strokeWidth: {
        type: [Number, String],
        default: 2
    }
});
</script>

<style scoped>
.map-icon {
    vertical-align: middle;
}
</style>