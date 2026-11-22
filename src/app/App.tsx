import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { queryClient } from '@/core/api/queryClient'
import { ToastProvider } from '@/core/ui'
import { createAppRouter } from './router'

const router = createAppRouter(queryClient)

export function App() {
  const { t } = useTranslation()
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider closeLabel={t('close')}>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>
  )
}
