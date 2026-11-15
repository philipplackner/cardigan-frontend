import { useRef, useState, type DragEvent } from 'react'
import { cn } from './cn'
import { Icon } from './Icon'
import { DownloadIcon, FileIcon } from './icons'

type DropZoneProps = {
  title: string
  /** Text before the browse button, for example "or ". */
  hintPrefix: string
  /** The browse button, for example "browse files". */
  browseLabel: string
  /** Passed to the file input, for example ".json,application/json". */
  accept?: string
  /** Receives the dropped or chosen file. Type and size checks are the screen's job. */
  onFiles: (files: File[]) => void
  className?: string
}

function hasFiles(event: DragEvent) {
  return Array.from(event.dataTransfer.types).includes('Files')
}

export function DropZone({
  title,
  hintPrefix,
  browseLabel,
  accept,
  onFiles,
  className,
}: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  // dragenter and dragleave also fire for child elements, so count them to know when the file really left.
  const depth = useRef(0)
  const [isOver, setIsOver] = useState(false)

  const reset = () => {
    depth.current = 0
    setIsOver(false)
  }

  return (
    <div
      className={cn(
        'flex w-full min-w-[0] flex-col items-center justify-center gap-8 rounded-10 border-[1.5px] border-dashed px-16 py-28 text-center',
        isOver
          ? 'border-accent bg-accent-soft'
          : 'border-border-strong bg-background-app',
        className,
      )}
      onDragEnter={(event) => {
        if (!hasFiles(event)) return
        event.preventDefault()
        depth.current += 1
        setIsOver(true)
      }}
      onDragOver={(event) => {
        if (!hasFiles(event)) return
        event.preventDefault()
        event.dataTransfer.dropEffect = 'copy'
      }}
      onDragLeave={(event) => {
        if (!hasFiles(event)) return
        depth.current = Math.max(0, depth.current - 1)
        if (depth.current === 0) setIsOver(false)
      }}
      onDrop={(event) => {
        if (!hasFiles(event)) return
        event.preventDefault()
        reset()
        const file = event.dataTransfer.files[0]
        if (file) onFiles([file])
      }}
    >
      <Icon
        icon={isOver ? DownloadIcon : FileIcon}
        size={24}
        className={isOver ? 'text-accent' : 'text-text-muted'}
      />
      <p className="type-sans-14-semibold-145 text-text-primary">{title}</p>
      <p className="type-sans-13-regular-145 text-text-muted">
        {hintPrefix}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-4 type-sans-13-medium-145 text-accent outline-none focus-visible:shadow-focus-accent"
        >
          {browseLabel}
        </button>
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        tabIndex={-1}
        aria-hidden
        className="sr-only"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0]
          if (file) onFiles([file])
          event.currentTarget.value = ''
        }}
      />
    </div>
  )
}
