<template>
  <div
    class="relative h-full w-full overflow-hidden bg-black flex items-center justify-center"
    @mousemove="onMove"
  >
    <div
      v-for="heart in hearts"
      :key="heart.id"
      class="absolute pointer-events-none"
      :style="heartStyle(heart)"
    >
      ❤️
    </div>
    <p class="text-white opacity-75 absolute bottom-4 text-center w-full">
      移动鼠标，漂浮的爱心会跟随你
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Heart {
  id: number
  x: number
  y: number
}

const hearts = ref<Heart[]>([])
let idCounter = 0

function onMove(e: MouseEvent) {
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  hearts.value.push({ id: idCounter++, x: e.clientX - rect.left, y: e.clientY - rect.top })
  if (hearts.value.length > 20) hearts.value.shift()
}

function heartStyle(h: Heart) {
  return {
    left: h.x + 'px',
    top: h.y + 'px',
    transform: 'translate(-50%, -50%)',
    fontSize: '24px',
    transition: 'all 1s ease-out',
  }
}
</script>
