import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const apiProxy = {
  '/api': { target: 'http://localhost:8080', changeOrigin: true },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  resolve: { tsconfigPaths: true },
  server: { proxy: apiProxy },
  preview: { proxy: apiProxy },
})
