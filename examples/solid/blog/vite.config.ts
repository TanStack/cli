import { defineConfig, resolveConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import contentCollections from '@content-collections/vite'
import tailwindcss from '@tailwindcss/vite'

import { tanstackStart } from '@tanstack/solid-start/plugin/vite'

import solidPlugin from 'vite-plugin-solid'

export default defineConfig({
	resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    contentCollections(),
    // this is the plugin that enables path aliases

    tailwindcss(),
    tanstackStart(),
    solidPlugin({ ssr: true }),
  ],
})
