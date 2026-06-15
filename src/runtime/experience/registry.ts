import type { ExperienceMeta } from './types'
import Fuse from 'fuse.js'

// 使用 import.meta.glob 预加载所有 meta 文件
const metaModules = import.meta.glob('@/experiences/**/meta.ts', { eager: true }) as Record<
  string,
  { default: ExperienceMeta }
>

const experiences: ExperienceMeta[] = Object.values(metaModules).map((m) => m.default)

export function loadExperienceMetas(): ExperienceMeta[] {
  return experiences
}

export function getExperienceById(id: string): ExperienceMeta | undefined {
  return experiences.find((exp) => exp.id === id)
}

export function getExperiencesByCategory(category: string): ExperienceMeta[] {
  return experiences.filter((exp) => exp.category === category)
}

export function getRecommendedExperiences(): ExperienceMeta[] {
  return experiences.filter((exp) => exp.recommended)
}

const fuse = new Fuse(experiences, {
  keys: ['title', 'subtitle', 'description', 'category', 'tags', 'tech'],
  threshold: 0.4,
})

export function searchExperiences(query: string): ExperienceMeta[] {
  if (!query) return experiences
  return fuse.search(query).map((result) => result.item)
}
