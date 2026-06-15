<template>
  <input
    v-model="query"
    placeholder="搜索体验..."
    @input="onInput"
    class="w-full p-2 rounded bg-white/10 text-white"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '@/app/stores/app.store'

const app = useAppStore()
const query = ref(app.searchQuery)
function onInput() {
  app.setSearchQuery(query.value)
}
</script>
