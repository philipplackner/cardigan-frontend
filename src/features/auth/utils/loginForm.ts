import { z } from 'zod'
import { normalizeText } from '@/core/utils/text'
import { FIELD_ERROR_KEYS } from './fieldErrorText'

/** Log in only checks that both fields are filled in. A malformed email gets the same 401 as a wrong one. */
export const loginFormSchema = z.object({
  email: z
    .string()
    .refine((value) => normalizeText(value, 'singleLine') !== '', {
      message: FIELD_ERROR_KEYS.emailRequired,
    }),
  password: z.string().refine((value) => value !== '', {
    message: FIELD_ERROR_KEYS.passwordRequired,
  }),
})

export type LoginFormValues = z.infer<typeof loginFormSchema>
