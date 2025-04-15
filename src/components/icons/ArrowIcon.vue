<template>
    <svg xmlns="http://www.w3.org/2000/svg" :width="width" :height="height" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" :stroke-width="strokeWidth" stroke-linecap="round" stroke-linejoin="round"
        class="arrow-icon">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
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
.arrow-icon {
    vertical-align: middle;
}
</style>