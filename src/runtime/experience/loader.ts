// 负责按需加载体验组件
const componentModules = import.meta.glob('@/experiences/**/index.vue')

export async function loadExperienceComponent(id: string) {
  for (const [path, loader] of Object.entries(componentModules)) {
    if (path.includes(`/experiences/${id}/`)) {
      return await (loader as any)()
    }
  }
  throw new Error(`Experience ${id} not found`)
}
