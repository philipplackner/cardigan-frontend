import { Brand, Logo } from '@/core/ui'
import { PreviewGroup, PreviewSection } from '../PreviewSection'

export function BrandSection() {
  return (
    <PreviewSection title="Brand">
      <PreviewGroup title="Logo">
        <Logo />
      </PreviewGroup>
      <PreviewGroup title="Brand · sidebar, app bar, auth">
        <Brand name="Cardigan" size="sidebar" />
        <Brand name="Cardigan" size="appBar" />
        <Brand name="Cardigan" size="auth" />
      </PreviewGroup>
      <PreviewGroup title="Brand in a narrow container truncates">
        <div className="w-[96px]">
          <Brand name="Cardigan" size="sidebar" />
        </div>
      </PreviewGroup>
    </PreviewSection>
  )
}
