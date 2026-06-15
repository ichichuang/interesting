<template>
  <section class="p-4 space-y-4">
    <h2 class="text-2xl font-bold">设置</h2>
    <div>
      <label class="block mb-1">主题：</label>
      <select v-model="theme" class="p-2 bg-white/10 rounded">
        <option value="rose">玫瑰</option>
        <option value="night">夜晚</option>
        <option value="christmas">圣诞</option>
      </select>
    </div>
    <div>
      <label class="block mb-1">性能：</label>
      <select v-model="quality" class="p-2 bg-white/10 rounded">
        <option value="low">低</option>
        <option value="medium">中</option>
        <option value="high">高</option>
      </select>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/app/stores/app.store'

const app = useAppStore()
const theme = computed({
  get: () => app.theme,
  set: (v) => app.setTheme(v as any),
})
const quality = computed({
  get: () => app.quality,
  set: (v) => app.setQuality(v as any),
})
</script>
