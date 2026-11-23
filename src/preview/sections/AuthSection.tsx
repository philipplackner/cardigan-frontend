import { useState } from 'react'
import { createFakeSession } from '@/core/auth/fakeSession'
import { Sidebar } from '@/core/ui'
import {
  LoginRoot,
  RegisterRoot,
  type AuthResult,
  type LogIn,
  type Register,
} from '@/features/auth'
import { PreviewGroup, PreviewSection } from '../PreviewSection'

type Scenario =
  | 'success'
  | 'invalidCredentials'
  | 'emailUsed'
  | 'rateLimited12'
  | 'rateLimited61'
  | 'network'
  | 'slow'

const SCENARIOS: { value: Scenario; label: string }[] = [
  { value: 'success', label: 'Success' },
  { value: 'invalidCredentials', label: '401 Wrong email or password' },
  { value: 'emailUsed', label: '409 Email already registered' },
  { value: 'rateLimited12', label: '429 with Retry-After: 12' },
  { value: 'rateLimited61', label: '429 with Retry-After: 61' },
  { value: 'network', label: 'Network error' },
  { value: 'slow', label: 'Slow request (5 s), then success' },
]

const RESULTS: Record<Scenario, AuthResult> = {
  success: { ok: true },
  invalidCredentials: { ok: false, error: { kind: 'invalidCredentials' } },
  emailUsed: { ok: false, error: { kind: 'emailUsed' } },
  rateLimited12: {
    ok: false,
    error: { kind: 'rateLimited', retryAfterSeconds: 12 },
  },
  rateLimited61: {
    ok: false,
    error: { kind: 'rateLimited', retryAfterSeconds: 61 },
  },
  network: { ok: false, error: { kind: 'other' } },
  slow: { ok: true },
}

const wait = (result: AuthResult, ms: number) =>
  new Promise<AuthResult>((resolve) => setTimeout(() => resolve(result), ms))

export function AuthSection() {
  const [screen, setScreen] = useState<'login' | 'register'>('login')
  const [scenario, setScenario] = useState<Scenario>('success')
  const [isSessionExpired, setIsSessionExpired] = useState(false)
  const [screenKey, setScreenKey] = useState(0)
  const [log, setLog] = useState<string[]>([])
  const addLog = (line: string) =>
    setLog((lines) =>
      [`${new Date().toLocaleTimeString()}  ${line}`, ...lines].slice(0, 6),
    )

  const respond = (input: { email: string; password: string }) => {
    addLog(`request with ${JSON.stringify(input.email)} → ${scenario}`)
    return wait(RESULTS[scenario], scenario === 'slow' ? 5000 : 800)
  }
  const logIn: LogIn = respond
  const register: Register = respond

  const switchTo = (next: 'login' | 'register') => {
    setScreen(next)
    setScreenKey((key) => key + 1)
  }
  const switchButton = (target: 'login' | 'register') =>
    function SwitchButton(label: string) {
      return (
        <button type="button" onClick={() => switchTo(target)}>
          {label}
        </button>
      )
    }

  const session = createFakeSession({
    email: 'ann@example.com',
    onLogOut: () => addLog('logOut()'),
  })

  return (
    <PreviewSection title="Auth">
      <p className="type-body text-text-muted">
        Log in and register with a fake server. The screens follow the viewport,
        so resize the window to check phone, tablet and desktop.
      </p>
      <div className="flex flex-wrap gap-12">
        <fieldset className="flex min-w-[260px] flex-1 flex-col gap-6 rounded-8 border border-border p-12 phone:min-w-full">
          <legend className="px-4 type-sans-12-regular-145 text-text-muted">
            Server answers with
          </legend>
          {SCENARIOS.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-8 type-sans-13-regular-145 text-text-primary"
            >
              <input
                type="radio"
                name="auth-scenario"
                checked={scenario === option.value}
                onChange={() => setScenario(option.value)}
              />
              {option.label}
            </label>
          ))}
        </fieldset>
        <fieldset className="flex min-w-[260px] flex-1 flex-col gap-6 rounded-8 border border-border p-12 phone:min-w-full">
          <legend className="px-4 type-sans-12-regular-145 text-text-muted">
            Screen
          </legend>
          {(['login', 'register'] as const).map((value) => (
            <label
              key={value}
              className="flex items-center gap-8 type-sans-13-regular-145 text-text-primary"
            >
              <input
                type="radio"
                name="auth-screen"
                checked={screen === value}
                onChange={() => switchTo(value)}
              />
              {value === 'login' ? 'Log in' : 'Register'}
            </label>
          ))}
          <label className="flex items-center gap-8 type-sans-13-regular-145 text-text-primary">
            <input
              type="checkbox"
              checked={isSessionExpired}
              onChange={(event) => {
                setIsSessionExpired(event.target.checked)
                setScreenKey((key) => key + 1)
              }}
            />
            Session expired (log in only, reopens the screen)
          </label>
        </fieldset>
        <div className="flex min-w-[260px] flex-1 flex-col gap-4 rounded-8 border border-border p-12 type-mono-12-regular-145 break-all text-text-muted phone:min-w-full">
          {log.length === 0
            ? 'No requests yet.'
            : log.map((line, index) => <span key={index}>{line}</span>)}
        </div>
      </div>
      <div className="overflow-hidden rounded-8 border border-border">
        {screen === 'login' ? (
          <LoginRoot
            key={screenKey}
            logIn={logIn}
            onLoggedIn={() => addLog('onLoggedIn()')}
            isSessionExpired={isSessionExpired}
            renderRegisterLink={switchButton('register')}
          />
        ) : (
          <RegisterRoot
            key={screenKey}
            register={register}
            onRegistered={() => addLog('onRegistered()')}
            renderLogInLink={switchButton('login')}
          />
        )}
      </div>
      <PreviewGroup title="Sidebar account row · fed by createFakeSession">
        <div className="h-[220px] w-sidebar-desktop">
          <Sidebar
            brandName="Cardigan"
            navLabel="Main"
            account={{
              initial: session.email?.charAt(0).toUpperCase() ?? '',
              email: session.email ?? '',
              logOutLabel: 'Log out',
              onLogOut: session.logOut,
            }}
          />
        </div>
      </PreviewGroup>
    </PreviewSection>
  )
}
