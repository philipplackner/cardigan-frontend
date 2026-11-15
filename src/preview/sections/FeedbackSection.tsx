import {
  Banner,
  Button,
  EmptyState,
  Skeleton,
  Spinner,
  icons,
  useToast,
} from '@/core/ui'
import { PreviewGroup, PreviewSection } from '../PreviewSection'

export function FeedbackSection() {
  const toast = useToast()

  return (
    <PreviewSection title="Feedback">
      <PreviewGroup title="Skeleton · shimmer, static under reduced motion">
        <div className="flex w-[240px] flex-col gap-8">
          <Skeleton className="w-[120px]" />
          <Skeleton />
          <Skeleton className="h-32 rounded-8" />
        </div>
      </PreviewGroup>
      <PreviewGroup title="Spinner · small, large, inherits color">
        <span className="text-text-primary">
          <Spinner size="small" />
        </span>
        <span className="text-accent">
          <Spinner size="large" label="Loading" />
        </span>
        <span className="text-danger">
          <Spinner size="small" />
        </span>
      </PreviewGroup>
      <PreviewGroup title="Banner · error, info, long text">
        <div className="flex w-[332px] flex-col gap-12">
          <Banner type="error">Message</Banner>
          <Banner type="info">Message</Banner>
          <Banner type="error">
            The board couldn't be loaded. Check your connection and try again in
            a few seconds.
          </Banner>
        </div>
      </PreviewGroup>
      <PreviewGroup title="Empty state · default with actions, error, without description and actions">
        <div className="w-[360px]">
          <EmptyState
            icon={icons.BoardIcon}
            title="No boards yet"
            description="Create a board to start tracking work."
            actions={<Button icon={icons.PlusIcon}>New board</Button>}
          />
        </div>
        <div className="w-[360px]">
          <EmptyState
            type="error"
            icon={icons.CloudOffIcon}
            title="Couldn't load boards"
            description="Check your connection and try again."
            actions={
              <Button variant="secondary" icon={icons.RefreshIcon}>
                Try again
              </Button>
            }
          />
        </div>
        <div className="w-[360px]">
          <EmptyState icon={icons.LabelIcon} title="No labels" />
        </div>
      </PreviewGroup>
      <PreviewGroup title="Toast · success closes after 4 s, error stays, a new toast replaces the current one">
        <Button
          variant="secondary"
          onClick={() =>
            toast.show({ type: 'success', message: 'Board exported' })
          }
        >
          Show success
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast.show({ type: 'error', message: "Couldn't move the card" })
          }
        >
          Show error
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast.show({
              type: 'success',
              message:
                'A much longer success message that has to wrap onto a second line on phones',
            })
          }
        >
          Show long
        </Button>
      </PreviewGroup>
    </PreviewSection>
  )
}
