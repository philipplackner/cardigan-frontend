import { describe, expect, it } from 'vitest'
import { createQueryClient, createTestQueryClient } from './queryClient'

describe('createQueryClient', () => {
  const client = createQueryClient()
  const { queries, mutations } = client.getDefaultOptions()

  it('keeps data fresh until it is refreshed on purpose', () => {
    expect(queries).toMatchObject({
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    })
  })

  it('retries neither queries nor mutations', () => {
    expect(queries?.retry).toBe(false)
    expect(mutations?.retry).toBe(false)
  })

  it('sends queries and mutations even while offline', () => {
    expect(queries?.networkMode).toBe('always')
    expect(mutations?.networkMode).toBe('always')
  })

  // The library's 5-minute default only applies in a browser; under node it is Infinity.
  it("leaves gcTime at the library's default", () => {
    expect(queries?.gcTime).toBeUndefined()
  })
})

describe('createTestQueryClient', () => {
  it('uses the app defaults but never garbage-collects', () => {
    const { queries, mutations } = createTestQueryClient().getDefaultOptions()

    expect(queries).toEqual({
      ...createQueryClient().getDefaultOptions().queries,
      gcTime: Infinity,
    })
    expect(mutations).toEqual(createQueryClient().getDefaultOptions().mutations)
  })
})
