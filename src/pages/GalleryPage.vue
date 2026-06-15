<template>
  <section class="p-4 space-y-6">
    <h2 class="text-3xl font-bold">体验合集</h2>
    <input
      v-model="query"
      type="text"
      placeholder="搜索体验..."
      class="p-2 rounded bg-white/10 w-full outline-none"
    />
    <div>
      <h3 class="text-xl font-semibold mb-2">推荐</h3>
      <ExperienceGrid :experiences="recommended" @select="goTo" />
    </div>
    <div>
      <h3 class="text-xl font-semibold mb-2">全部体验</h3>
      <ExperienceGrid :experiences="filtered" @select="goTo" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { loadExperienceMetas, searchExperiences, getRecommendedExperiences } from '@/runtime/experience/registry'
import ExperienceGrid from '@/components/ExperienceGrid.vue'
import { useAppStore } from '@/app/stores/app.store'

const router = useRouter()
const app = useAppStore()
const query = ref(app.searchQuery)
const experiences = loadExperienceMetas()
const recommended = computed(() => getRecommendedExperiences())
const filtered = computed(() => {
  if (query.value) {
    return searchExperiences(query.value)
  }
  return experiences
})

watch(query, (val) => {
  app.setSearchQuery(val)
})

function goTo(id: string) {
  router.push(`/experience/${id}`)
}
</script>
