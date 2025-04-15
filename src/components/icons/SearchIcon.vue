<template>
    <svg xmlns="http://www.w3.org/2000/svg" :width="width" :height="height" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" :stroke-width="strokeWidth" stroke-linecap="round" stroke-linejoin="round"
        class="search-icon">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
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
.search-icon {
    vertical-align: middle;
}
</style>