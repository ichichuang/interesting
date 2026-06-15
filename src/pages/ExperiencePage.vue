<template>
  <section class="p-4">
    <button class="mb-2 text-sm underline" @click="back">返回</button>
    <div v-if="meta">
      <h2 class="text-2xl font-bold">{{ meta.title }}</h2>
      <p class="opacity-75 mb-4">{{ meta.description }}</p>
      <div class="flex items-center gap-2 mb-4">
        <FavoriteButton :id="meta.id" />
        <AudioToggle />
      </div>
      <div class="h-[70vh] mt-4">
        <ExperienceHost :meta="meta" />
      </div>
    </div>
    <NotFoundPage v-else />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getExperienceById } from '@/runtime/experience/registry'
import ExperienceHost from '@/components/ExperienceHost.vue'
import FavoriteButton from '@/components/FavoriteButton.vue'
import AudioToggle from '@/components/AudioToggle.vue'
import NotFoundPage from '@/pages/NotFoundPage.vue'
import { useExperienceStore } from '@/app/stores/experience.store'

const route = useRoute()
const router = useRouter()
const store = useExperienceStore()
const meta = computed(() => {
  const id = route.params.id as string
  const m = getExperienceById(id)
  if (m) {
    store.recordVisit(id)
  }
  return m
})

function back() {
  router.back()
}
</script>
