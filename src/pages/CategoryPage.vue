<template>
  <section class="p-4">
    <h2 class="text-2xl font-bold mb-4">分类：{{ category }}</h2>
    <ExperienceGrid :experiences="items" @select="goTo" />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getExperiencesByCategory } from '@/runtime/experience/registry'
import ExperienceGrid from '@/components/ExperienceGrid.vue'

const router = useRouter()
const route = useRoute()
const category = computed(() => route.params.category as string)
const items = computed(() => getExperiencesByCategory(category.value))

function goTo(id: string) {
  router.push(`/experience/${id}`)
}
</script>
