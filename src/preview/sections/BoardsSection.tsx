import { BoardRow, BoardTile, IconButton, icons } from '@/core/ui'
import { PreviewGroup, PreviewSection } from '../PreviewSection'

const menu = <IconButton icon={icons.MoreIcon} label="Board menu" />

export function BoardsSection() {
  return (
    <PreviewSection title="Boards">
      <PreviewGroup title="Board tile · hover shows the stronger border; the whole tile is a link">
        <div className="w-[280px]">
          <BoardTile
            name="Cardigan v1"
            keyValue="CRD"
            cardsText="12 cards"
            updatedText="Updated 2 hours ago"
            link={<a href="#boards" />}
            menu={menu}
          />
        </div>
        <div className="w-[280px]">
          <BoardTile
            name="A board with a long name that wraps onto a second line"
            keyValue="LNG"
            cardsText="148 cards"
            updatedText="Updated 3 days ago"
            link={<a href="#boards" />}
            menu={menu}
          />
        </div>
      </PreviewGroup>
      <PreviewGroup title="Board row · with and without divider, long name truncates">
        <div className="w-[356px]">
          <BoardRow
            name="Cardigan v1"
            keyValue="CRD"
            cardsText="12 cards"
            updatedText="2 hours ago"
            link={<a href="#boards" />}
            menu={menu}
          />
          <BoardRow
            name="A board with a very long name that has to truncate"
            keyValue="LNG"
            cardsText="148 cards"
            updatedText="3 days ago"
            link={<a href="#boards" />}
            menu={menu}
            hasDivider={false}
          />
        </div>
      </PreviewGroup>
    </PreviewSection>
  )
}
