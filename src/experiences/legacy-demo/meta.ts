import type { ExperienceMeta } from '@/runtime/experience/types'

const meta: ExperienceMeta = {
  id: 'legacy-demo',
  title: 'Legacy Demo',
  subtitle: '旧项目示例',
  description: '通过 iframe 加载旧版体验。',
  category: 'lab',
  tags: ['legacy', 'iframe'],
  tech: ['iframe'],
  level: 'legacy',
  route: '/experience/legacy-demo',
  thumbnail: '/thumbnails/legacy-demo.png',
  entry: '/legacy/demo/index.html',
  source: undefined,
  author: '系统',
  license: '',
  recommended: false,
  mobileFriendly: true,
}

export default meta
