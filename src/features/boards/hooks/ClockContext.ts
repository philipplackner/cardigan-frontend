import { createContext } from 'react'

/** The clock behind `useNow`. Tests and the preview page provide a fixed one. */
export const ClockContext = createContext<() => Date>(() => new Date())
