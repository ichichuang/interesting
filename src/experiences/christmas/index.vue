<template>
  <div class="flex flex-col items-center justify-center h-full text-center text-white">
    <h2 class="text-4xl mb-4">🎄 Merry Christmas!</h2>
    <p>这里将展示一个圣诞节互动体验的占位符。</p>
    <button @click="count++" class="mt-4 px-4 py-2 bg-red-600 rounded">
      点击我 {{ count }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const count = ref(0)
</script>
