import { QueryClientProvider, useQuery } from '@tanstack/react-query'
import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createTestQueryClient } from '@/core/api/queryClient'
import { ClockProvider } from './ClockProvider'
import { useNow } from './useNow'

function Probe() {
  const { data, dataUpdatedAt } = useQuery({
    queryKey: ['probe'],
    queryFn: () => 'same data',
  })
  const now = useNow(dataUpdatedAt)
  return <output>{data && now.toISOString()}</output>
}

describe('useNow', () => {
  it('takes a new time when a refetch updates dataUpdatedAt', async () => {
    const queryClient = createTestQueryClient()
    let clockTime = new Date('2026-10-14T13:00:00Z')
    render(
      <QueryClientProvider client={queryClient}>
        <ClockProvider clock={() => clockTime}>
          <Probe />
        </ClockProvider>
      </QueryClientProvider>,
    )
    await screen.findByText('2026-10-14T13:00:00.000Z')
    clockTime = new Date('2026-10-14T15:00:00Z')

    await act(() => queryClient.refetchQueries({ queryKey: ['probe'] }))

    expect(await screen.findByRole('status')).toHaveTextContent(
      '2026-10-14T15:00:00.000Z',
    )
  })

  it('keeps the time while nothing is refetched', async () => {
    const queryClient = createTestQueryClient()
    let clockTime = new Date('2026-10-14T13:00:00Z')
    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <ClockProvider clock={() => clockTime}>
          <Probe />
        </ClockProvider>
      </QueryClientProvider>,
    )
    await screen.findByText('2026-10-14T13:00:00.000Z')
    clockTime = new Date('2026-10-14T15:00:00Z')

    rerender(
      <QueryClientProvider client={queryClient}>
        <ClockProvider clock={() => clockTime}>
          <Probe />
        </ClockProvider>
      </QueryClientProvider>,
    )

    expect(screen.getByRole('status')).toHaveTextContent(
      '2026-10-14T13:00:00.000Z',
    )
  })
})
