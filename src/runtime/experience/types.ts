export type Category =
  | 'heart'
  | 'flower'
  | 'book'
  | 'shader'
  | 'cursor'
  | 'holiday'
  | 'particle'
  | 'game'
  | 'lab'

export type Tech =
  | 'vue'
  | 'three'
  | 'tres'
  | 'shader'
  | 'canvas'
  | 'html'
  | 'css'
  | 'iframe'

export type Level = 'legacy' | 'adapter' | 'shared-stage'

export interface ExperienceMeta {
  id: string
  title: string
  subtitle?: string
  description?: string
  category: Category
  tags: string[]
  tech: Tech[]
  level: Level
  route: string
  thumbnail: string
  entry?: string
  source?: string
  author?: string
  license?: string
  recommended?: boolean
  mobileFriendly?: boolean
}

export interface ExperienceContext {
  id: string
  bus: any
  theme: string
  audio: any
  quality: string
}

export interface ExperienceAdapter {
  mount(el: HTMLElement, ctx: ExperienceContext): Promise<void> | void
  unmount(): Promise<void> | void
  pause?(): void
  resume?(): void
  onHostEvent?(event: any): void
}
