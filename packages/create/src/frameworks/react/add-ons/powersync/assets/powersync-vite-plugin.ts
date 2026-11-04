import type { Plugin } from 'vite'

export default function powersyncVite(): Plugin {
  return {
    name: 'powersync-vite',
    config() {
      return {
        optimizeDeps: {
          exclude: ['@powersync/web'],
        },
        worker: {
          format: 'es',
        },
      }
    },
  }
}
