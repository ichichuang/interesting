<template>
  <header class="p-4 flex items-center justify-between">
    <h1 class="text-2xl font-bold">Interesting</h1>
    <nav class="flex items-center gap-4 text-sm">
      <router-link to="/favorites" class="hover:underline">收藏</router-link>
      <router-link to="/settings" class="hover:underline">设置</router-link>
    </nav>
  </header>
</template>

<script setup lang="ts">
</script>
