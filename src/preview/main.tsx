import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '@/index.css'
import '@/app/i18n'
import { ToastProvider } from '@/core/ui'
import { LayoutPreview } from './LayoutPreview'
import { PreviewApp } from './PreviewApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider closeLabel="Close">
      {new URLSearchParams(location.search).has('layout') ? (
        <LayoutPreview />
      ) : (
        <PreviewApp />
      )}
    </ToastProvider>
  </StrictMode>,
)
