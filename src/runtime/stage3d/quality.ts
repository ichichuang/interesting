export type Quality = 'low' | 'medium' | 'high'

export function getQualitySettings(q: Quality) {
  switch (q) {
    case 'low':
      return { pixelRatio: 1 }
    case 'medium':
      return { pixelRatio: 1.5 }
    case 'high':
      return { pixelRatio: 2 }
  }
}
