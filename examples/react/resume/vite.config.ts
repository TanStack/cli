import { defineConfig } from 'vite'
import contentCollections from '@content-collections/vite'
import tailwindcss from '@tailwindcss/vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    contentCollections(),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
