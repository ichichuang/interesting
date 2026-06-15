<template>
  <div class="grid gap-4" :style="gridStyle">
    <ExperienceCard
      v-for="exp in experiences"
      :key="exp.id"
      :meta="exp"
      @select="$emit('select', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import ExperienceCard from './ExperienceCard.vue'
import type { ExperienceMeta } from '@/runtime/experience/types'
import { computed } from 'vue'

const props = defineProps<{ experiences: ExperienceMeta[] }>()
defineEmits<{ (e: 'select', id: string): void }>()

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
}))
</script>
