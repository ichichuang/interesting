<template>
  <button class="underline text-sm" @click="goBack">← 返回</button>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
function goBack() {
  router.push('/interesting')
}
</script>
