<template>
  <div class="w-full h-full">
    <component v-if="component && !isIframe" :is="component" />
    <iframe
      v-else-if="isIframe"
      :src="iframeSrc"
      class="w-full h-full border-none"
    ></iframe>
    <div v-else class="p-4">加载中...</div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ExperienceMeta } from '@/runtime/experience/types'
import { loadExperienceComponent } from '@/runtime/experience/loader'

const props = defineProps<{ meta: ExperienceMeta }>()

const component = ref<any>(null)
const isIframe = ref(false)
const iframeSrc = ref('')

async function load() {
  if (!props.meta) return
  if (props.meta.level === 'legacy') {
    isIframe.value = true
    iframeSrc.value = props.meta.entry || ''
    component.value = null
  } else {
    isIframe.value = false
    iframeSrc.value = ''
    try {
      const mod = await loadExperienceComponent(props.meta.id)
      component.value = mod.default
    } catch (err) {
      console.error(err)
      component.value = null
    }
  }
}

watch(
  () => props.meta,
  () => {
    load()
  },
  { immediate: true }
)
</script>
