import { createContext, useContext } from 'react'

export type ToastOptions = {
  type: 'success' | 'error'
  message: string
}

export type ToastApi = {
  /** Shows a toast and replaces the one showing. Success closes after 4 s, error stays until closed. */
  show: (toast: ToastOptions) => void
}

export const ToastContext = createContext<ToastApi | null>(null)

export function useToast() {
  const api = useContext(ToastContext)
  if (!api) throw new Error('useToast must be used inside ToastProvider')
  return api
}
