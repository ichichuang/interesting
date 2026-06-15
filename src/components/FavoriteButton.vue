<template>
  <button
    @click="toggle"
    class="px-2 py-1 rounded text-sm"
    :class="isFav ? 'bg-pink-500' : 'bg-gray-600'"
  >
    {{ isFav ? '已收藏' : '收藏' }}
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useExperienceStore } from '@/app/stores/experience.store'

const props = defineProps<{ id: string }>()
const store = useExperienceStore()
const isFav = computed(() => store.isFavorite(props.id))
function toggle() {
  store.toggleFavorite(props.id)
}
</script>
