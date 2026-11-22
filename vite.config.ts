import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const apiProxy = {
  '/api': { target: 'http://localhost:8080', changeOrigin: true },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // Must run before the React plugin so it can split route files first.
    tanstackRouter({
      target: 'react',
      routesDirectory: './src/app/routes',
      generatedRouteTree: './src/app/routeTree.gen.ts',
      autoCodeSplitting: true,
    }),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  resolve: { tsconfigPaths: true },
  server: { proxy: apiProxy },
  preview: { proxy: apiProxy },
})
