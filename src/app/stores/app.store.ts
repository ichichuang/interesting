import { defineStore } from 'pinia'

export type Theme = 'rose' | 'night' | 'christmas'
export type Quality = 'low' | 'medium' | 'high'

export const useAppStore = defineStore('app', {
  state: () => ({
    theme: 'rose' as Theme,
    audioEnabled: false,
    quality: 'medium' as Quality,
    searchQuery: '',
  }),
  actions: {
    setTheme(theme: Theme) {
      this.theme = theme
    },
    toggleAudio() {
      this.audioEnabled = !this.audioEnabled
    },
    setQuality(q: Quality) {
      this.quality = q
    },
    setSearchQuery(query: string) {
      this.searchQuery = query
    },
  },
})
