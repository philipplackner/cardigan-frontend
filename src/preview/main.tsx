import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '@/index.css'
import { ToastProvider } from '@/core/ui'
import { PreviewApp } from './PreviewApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider closeLabel="Close">
      <PreviewApp />
    </ToastProvider>
  </StrictMode>,
)
