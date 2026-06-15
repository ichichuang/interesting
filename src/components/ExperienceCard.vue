<template>
  <div
    class="rounded-lg bg-white/10 p-4 hover:bg-white/20 transition cursor-pointer"
    @click="$emit('select', meta.id)"
  >
    <div
      class="h-32 bg-cover bg-center rounded mb-2"
      :style="{ backgroundImage: 'url(' + meta.thumbnail + ')' }"
    ></div>
    <h3 class="text-lg font-semibold">{{ meta.title }}</h3>
    <p class="text-sm opacity-75">{{ meta.subtitle }}</p>
  </div>
</template>

<script setup lang="ts">
import type { ExperienceMeta } from '@/runtime/experience/types'

defineProps<{ meta: ExperienceMeta }>()
defineEmits<{ (e: 'select', id: string): void }>()
</script>
