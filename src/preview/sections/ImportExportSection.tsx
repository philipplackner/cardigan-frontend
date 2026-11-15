import { useState } from 'react'
import { DropZone, FileRow } from '@/core/ui'
import { PreviewGroup, PreviewSection } from '../PreviewSection'

export function ImportExportSection() {
  const [received, setReceived] = useState<string>('nothing yet')

  return (
    <PreviewSection title="Import & export">
      <PreviewGroup title="File row · long name truncates">
        <div className="flex w-[380px] flex-col gap-8">
          <FileRow name="board-backup.json" sizeText="14 KB" />
          <FileRow
            name="cardigan-v1-full-export-2026-11-15-with-a-very-long-name.json"
            sizeText="1.2 MB"
          />
        </div>
      </PreviewGroup>
      <PreviewGroup
        title={`Drop zone · drag a file over, drop it, or browse · received: ${received}`}
      >
        <div className="w-[380px]">
          <DropZone
            title="Drop a board export here"
            overTitle="Release to import"
            hintPrefix="or "
            browseLabel="browse files"
            accept=".json,application/json"
            onFiles={(files) =>
              setReceived(
                files.map((file) => `${file.name} (${file.size} B)`).join(', '),
              )
            }
          />
        </div>
      </PreviewGroup>
    </PreviewSection>
  )
}
