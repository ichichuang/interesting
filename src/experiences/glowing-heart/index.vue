<template>
  <canvas ref="canvas" class="w-full h-full"></canvas>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let frame: number

function drawHeart(time: number) {
  if (!ctx || !canvas.value) return
  const w = canvas.value.width
  const h = canvas.value.height
  ctx.clearRect(0, 0, w, h)
  ctx.save()
  ctx.translate(w / 2, h / 2)
  const scale = 0.8 + 0.2 * Math.sin(time / 500)
  ctx.scale(scale, scale)
  ctx.beginPath()
  for (let t = 0; t < Math.PI * 2; t += 0.01) {
    const x = 16 * Math.pow(Math.sin(t), 3)
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
    ctx.lineTo(x, -y)
  }
  ctx.closePath()
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 30)
  gradient.addColorStop(0, 'rgba(255,0,70,1)')
  gradient.addColorStop(1, 'rgba(255,0,70,0)')
  ctx.fillStyle = gradient
  ctx.fill()
  ctx.restore()
}

function loop(time: number) {
  drawHeart(time)
  frame = requestAnimationFrame(loop)
}

onMounted(() => {
  if (canvas.value) {
    ctx = canvas.value.getContext('2d')
    const resize = () => {
      if (canvas.value) {
        canvas.value.width = canvas.value.clientWidth
        canvas.value.height = canvas.value.clientHeight
      }
    }
    resize()
    window.addEventListener('resize', resize)
    loop(0)
  }
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
})
</script>
