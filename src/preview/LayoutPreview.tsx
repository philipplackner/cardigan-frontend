import { useState } from 'react'
import {
  AppBar,
  AppLayout,
  Button,
  IconButton,
  PageHeader,
  icons,
} from '@/core/ui'
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
          <div className="flex h-full flex-col gap-12 border-l border-border bg-background-surface p-20 shadow-panel">
            <h2 className="type-screen-title">Panel</h2>
            <p className="type-body text-text-muted">Side panel region.</p>
            <Button variant="secondary" onClick={() => setIsPanelOpen(false)}>
              Close panel
            </Button>
          </div>
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
