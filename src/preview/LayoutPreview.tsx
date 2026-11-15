import { useState } from 'react'
import {
  AppBar,
  AppLayout,
  Button,
  IconButton,
  PageHeader,
  icons,
} from '@/core/ui'
import { PreviewPanel } from './sections/CardDetailSection'
import { PreviewSidebar } from './sections/NavigationSection'

export function LayoutPreview() {
  const [isPanelOpen, setIsPanelOpen] = useState(true)

  return (
    <AppLayout
      sidebar={<PreviewSidebar />}
      appBar={
        <AppBar
          type="brand"
          brandName="Cardigan"
          actions={
            <IconButton icon={icons.MoreIcon} label="Menu" size="large" />
          }
        />
      }
      panel={
        isPanelOpen ? (
          <PreviewPanel onClose={() => setIsPanelOpen(false)} />
        ) : undefined
      }
    >
      <PageHeader
        title="Boards"
        meta="6 boards"
        actions={
          <Button icon={icons.PlusIcon} onClick={() => setIsPanelOpen(true)}>
            Open panel
          </Button>
        }
      />
      <div className="flex flex-col gap-8 p-20">
        <p className="type-body">Content region.</p>
        <Button variant="secondary" onClick={() => setIsPanelOpen(true)}>
          Open panel
        </Button>
      </div>
    </AppLayout>
  )
}
