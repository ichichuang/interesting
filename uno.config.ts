import { defineConfig, presetUno, presetIcons } from 'unocss'

export default defineConfig({
  presets: [presetUno(), presetIcons()],
  theme: {
    colors: {
      primary: {
        DEFAULT: '#e91e63',
        dark: '#ad1457',
      },
    },
  },
})
