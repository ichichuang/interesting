<template>
  <section class="p-4">
    <h2 class="text-2xl font-bold mb-4">收藏夹</h2>
    <ExperienceGrid :experiences="items" @select="goTo" />
    <EmptyState v-if="items.length === 0" />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import ExperienceGrid from '@/components/ExperienceGrid.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useExperienceStore } from '@/app/stores/experience.store'
import { getExperienceById } from '@/runtime/experience/registry'

const router = useRouter()
const store = useExperienceStore()
const items = computed(() => store.favorites.map(id => getExperienceById(id)).filter(Boolean) as any[])

function goTo(id: string) {
  router.push(`/experience/${id}`)
}
</script>
