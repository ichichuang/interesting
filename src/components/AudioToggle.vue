<template>
  <button
    @click="toggle"
    class="px-2 py-1 rounded text-sm"
    :class="enabled ? 'bg-green-500' : 'bg-gray-600'"
  >
    {{ enabled ? '音频开启' : '音频关闭' }}
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/app/stores/app.store'
import { audioController } from '@/runtime/audio/audioController'

const app = useAppStore()
const enabled = computed(() => app.audioEnabled)
function toggle() {
  app.toggleAudio()
  audioController.setEnabled(app.audioEnabled)
}
</script>
