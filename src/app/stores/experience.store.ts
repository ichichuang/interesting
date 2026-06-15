import { defineStore } from 'pinia'

const FAVORITES_KEY = 'interesting_favorites'
const RECENT_KEY = 'interesting_recent'

function loadList(key: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

function saveList(key: string, list: string[]) {
  localStorage.setItem(key, JSON.stringify(list))
}

export const useExperienceStore = defineStore('experience', {
  state: () => ({
    favorites: loadList(FAVORITES_KEY) as string[],
    recent: loadList(RECENT_KEY) as string[],
  }),
  actions: {
    toggleFavorite(id: string) {
      const idx = this.favorites.indexOf(id)
      if (idx >= 0) {
        this.favorites.splice(idx, 1)
      } else {
        this.favorites.push(id)
      }
      saveList(FAVORITES_KEY, this.favorites)
    },
    isFavorite(id: string) {
      return this.favorites.includes(id)
    },
    recordVisit(id: string) {
      const idx = this.recent.indexOf(id)
      if (idx >= 0) {
        this.recent.splice(idx, 1)
      }
      this.recent.unshift(id)
      this.recent = this.recent.slice(0, 20)
      saveList(RECENT_KEY, this.recent)
    },
  },
})
