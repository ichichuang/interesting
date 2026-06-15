import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import GalleryPage from '@/pages/GalleryPage.vue'
import CategoryPage from '@/pages/CategoryPage.vue'
import ExperiencePage from '@/pages/ExperiencePage.vue'
import FavoritesPage from '@/pages/FavoritesPage.vue'
import SettingsPage from '@/pages/SettingsPage.vue'
import NotFoundPage from '@/pages/NotFoundPage.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/interesting' },
  { path: '/interesting', component: GalleryPage },
  { path: '/interesting/christmas', redirect: '/experience/christmas' },
  { path: '/experience/:id', component: ExperiencePage, props: true },
  { path: '/category/:category', component: CategoryPage, props: true },
  { path: '/favorites', component: FavoritesPage },
  { path: '/settings', component: SettingsPage },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundPage },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
