<template>
  <div class="min-h-screen flex flex-col bg-gradient-to-b from-[#1a0933] to-[#0a0217] text-white">
    <AppHeader />
    <main class="flex-1">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
</script>
