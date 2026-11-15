import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, useToast } from '@/core/ui'
import type { ExportBoard } from '../types'
import { downloadFile } from '../utils/downloadFile'
import { exportFileName } from '../utils/exportFileName'

type ExportTarget = { id: string; name: string }

/**
 * Runs an export behind a progress dialog, downloads the file and shows the result as a toast.
 * The host calls `start` from its menu item and renders `dialog` outside the menu.
 */
export function useExportBoard({ exportBoard }: { exportBoard: ExportBoard }) {
  const { t } = useTranslation('transfer')
  const toast = useToast()
  const [board, setBoard] = useState<ExportTarget | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const running = useRef(false)

  const start = async (target: ExportTarget) => {
    if (running.current) return
    running.current = true
    setBoard(target)
    setIsRunning(true)
    try {
      const result = await exportBoard(target.id)
      if (result.ok) {
        downloadFile(
          result.file,
          await exportFileName(result.contentDisposition, result.file),
        )
        toast.show({
          type: 'success',
          message: t('export.done', { name: target.name }),
        })
      } else {
        const key =
          result.error === 'notFound' ? 'export.notFound' : 'export.failed'
        toast.show({ type: 'error', message: t(key, { name: target.name }) })
      }
    } catch {
      toast.show({
        type: 'error',
        message: t('export.failed', { name: target.name }),
      })
    } finally {
      running.current = false
      setIsRunning(false)
    }
  }

  const dialog = (
    <Dialog
      open={isRunning}
      onOpenChange={() => {}}
      type="progress"
      title={t('export.progressTitle', { name: board?.name ?? '' })}
      description={t('export.progressBody')}
    />
  )

  return { start, dialog }
}
