const interestingRoutes: RouteConfig[] = [
  {
    path: '/interesting',
    name: 'Interesting',
    meta: {
      title: '有趣的内容',
      rank: 3,
    },
    redirect: '/interesting/christmas',
    children: [
      {
        path: 'christmas',
        name: 'Christmas',
        component: () => import('@/views/interesting/christmas.vue'),
        meta: {
          title: '圣诞节',
          rank: 1,
          parent: 'fullscreen',
        },
      },
    ],
  },
]

export default interestingRoutes
