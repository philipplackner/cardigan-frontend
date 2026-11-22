import { Outlet } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  AppBarSlotProvider,
  AppBarSlotTarget,
  AppLayout,
  Sidebar,
} from '@/core/ui'

/** The layout every signed-in page renders in. Pages fill the phone top bar with `AppBarSlot`. */
export function AppShell() {
  const { t } = useTranslation()
  return (
    <AppBarSlotProvider>
      <AppLayout
        sidebar={
          <Sidebar brandName={t('appName')} navLabel={t('mainNavigation')} />
        }
        appBar={<AppBarSlotTarget />}
      >
        <Outlet />
      </AppLayout>
    </AppBarSlotProvider>
  )
}
