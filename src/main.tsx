import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import './index.css'
import '@/app/i18n'
import { App } from '@/app/App'
import { createRootErrorHandlers } from '@/app/rootErrorHandlers'

createRoot(
  document.getElementById('root')!,
  createRootErrorHandlers(import.meta.env.DEV),
).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
