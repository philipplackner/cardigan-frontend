import { useState } from 'react'
import {
  AppBar,
  Button,
  FilterButton,
  IconButton,
  NavItem,
  PageHeader,
  Sidebar,
  icons,
} from '@/core/ui'
import { PreviewGroup, PreviewSection } from '../PreviewSection'

export function PreviewSidebar() {
  return (
    <Sidebar
      brandName="Cardigan"
      navLabel="Main"
      mainNav={
        <>
          <NavItem
            label="All boards"
            icon={icons.BoardsIcon}
            href="#navigation"
            isSelected
          />
          <NavItem label="Labels" icon={icons.LabelIcon} href="#navigation" />
        </>
      }
      boardsHeading="Boards"
      boards={
        <>
          <NavItem
            label="Cardigan v1"
            icon={icons.BoardIcon}
            keyValue="CRD"
            href="#navigation"
          />
          <NavItem
            label="Website relaunch"
            icon={icons.BoardIcon}
            keyValue="WEB"
            href="#navigation"
          />
          <NavItem
            label="A board with a very long name that has to truncate"
            icon={icons.BoardIcon}
            keyValue="LNG"
            href="#navigation"
          />
        </>
      }
      boardsAction={
        <NavItem label="New board" icon={icons.PlusIcon} isDim asChild>
          <button type="button" />
        </NavItem>
      }
      account={{
        initial: 'P',
        email: 'philipp@example.com',
        logOutLabel: 'Log out',
        onLogOut: () => {},
      }}
    />
  )
}

export function NavigationSection() {
  const [isRaised, setIsRaised] = useState(false)
  const actions = (
    <>
      <IconButton icon={icons.SearchIcon} label="Search" size="large" />
      <IconButton icon={icons.MoreIcon} label="Board menu" size="large" />
    </>
  )
  const back = (
    <IconButton icon={icons.ChevronLeftIcon} label="Back" size="large" />
  )

  return (
    <PreviewSection title="Navigation">
      <PreviewGroup title="Nav item · default, selected, dim, with key, long name truncates">
        <div className="flex w-[228px] flex-col gap-1">
          <NavItem
            label="Cardigan v1"
            icon={icons.BoardIcon}
            keyValue="CRD"
            href="#navigation"
          />
          <NavItem
            label="Cardigan v1"
            icon={icons.BoardIcon}
            keyValue="CRD"
            href="#navigation"
            isSelected
          />
          <NavItem label="New board" icon={icons.PlusIcon} isDim asChild>
            <button type="button" />
          </NavItem>
          <NavItem
            label="A board with a very long name that has to truncate"
            icon={icons.BoardIcon}
            href="#navigation"
          />
        </div>
      </PreviewGroup>
      <PreviewGroup title="Sidebar">
        <div className="h-[640px] w-sidebar-desktop">
          <PreviewSidebar />
        </div>
      </PreviewGroup>
      <PreviewGroup title="Page header · title, key, meta, actions">
        <div className="flex w-full flex-col gap-12">
          <PageHeader
            title="Boards"
            meta="6 boards"
            actions={
              <>
                <FilterButton label="Labels" icon={icons.LabelIcon} />
                <Button icon={icons.PlusIcon}>New board</Button>
              </>
            }
          />
          <PageHeader title="Cardigan v1" keyValue="CRD" />
        </div>
      </PreviewGroup>
      <PreviewGroup title="App bar · brand, title, centered; raised toggles">
        <div className="flex w-[390px] flex-col gap-12">
          <AppBar
            type="brand"
            brandName="Cardigan"
            actions={actions}
            isRaised={isRaised}
          />
          <AppBar
            type="title"
            title="Cardigan v1 with a long title that truncates"
            subtitle="CRD · 24 cards"
            leading={back}
            actions={actions}
            isRaised={isRaised}
          />
          <AppBar
            type="centered"
            title="CRD-109"
            leading={back}
            actions={actions}
            isRaised={isRaised}
          />
          <Button
            variant="secondary"
            size="small"
            onClick={() => setIsRaised((value) => !value)}
          >
            {isRaised ? 'Flat' : 'Raised'}
          </Button>
        </div>
      </PreviewGroup>
      <PreviewGroup title="App layout · phone 390 × 844 (open preview.html?layout for the full page)">
        <iframe
          title="App layout at 390 × 844"
          src="/preview.html?layout"
          className="h-[844px] w-[390px] rounded-8 border border-border"
        />
      </PreviewGroup>
    </PreviewSection>
  )
}
