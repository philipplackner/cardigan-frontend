import { createContext, useContext } from 'react'

export type FieldControlProps = {
  id: string
  'aria-describedby'?: string
  'aria-invalid'?: true
}

export const FieldContext = createContext<FieldControlProps | null>(null)

/** Props a control inside a `Field` needs: the label's target id, the linked help or error text, and the error state. */
export function useFieldControl() {
  return useContext(FieldContext)
}
