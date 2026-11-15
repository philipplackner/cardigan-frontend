import { Avatar, Key } from '@/core/ui'
import { PreviewGroup, PreviewSection } from '../PreviewSection'

export function DataDisplaySection() {
  return (
    <PreviewSection title="Data display">
      <PreviewGroup title="Key">
        <Key value="CRD" />
        <Key value="WEBAPP" />
      </PreviewGroup>
      <PreviewGroup title="Avatar">
        <Avatar initial="P" />
        <Avatar initial="A" label="Account" />
      </PreviewGroup>
    </PreviewSection>
  )
}
