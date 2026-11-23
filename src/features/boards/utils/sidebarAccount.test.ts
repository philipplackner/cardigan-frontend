import i18next from 'i18next'
import { describe, expect, it, vi } from 'vitest'
import boards from '../i18n/en.json'
import { sidebarAccount } from './sidebarAccount'

const t = i18next.createInstance({
  lng: 'en',
  resources: { en: { boards } },
  initAsync: false,
})
void t.init()
const boardsT = t.getFixedT('en', 'boards')

describe('sidebarAccount', () => {
  it('uses the uppercased first character of the email as the initial', () => {
    const onLogOut = vi.fn()

    expect(
      sidebarAccount({ email: 'philipp@example.com', onLogOut }, boardsT),
    ).toEqual({
      email: 'philipp@example.com',
      initial: 'P',
      logOutLabel: 'Log out',
      onLogOut,
    })
  })

  it('hides the email and the initial while the email is unknown', () => {
    const account = sidebarAccount({ email: null, onLogOut: vi.fn() }, boardsT)

    expect(account.email).toBeNull()
    expect(account.initial).toBeNull()
  })

  it('treats an empty email as unknown', () => {
    expect(
      sidebarAccount({ email: '', onLogOut: vi.fn() }, boardsT).initial,
    ).toBeNull()
  })

  it('takes a whole emoji, not half a surrogate pair', () => {
    expect(
      sidebarAccount({ email: '😀@example.com', onLogOut: vi.fn() }, boardsT)
        .initial,
    ).toBe('😀')
  })
})
