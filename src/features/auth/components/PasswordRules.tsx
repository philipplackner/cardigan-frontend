import { useWatch, type Control } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { PasswordRule } from '@/core/ui'
import { passwordRules } from '../utils/passwordRules'
import type { RegisterFormValues } from '../utils/registerForm'

type PasswordRulesProps = {
  control: Control<RegisterFormValues>
}

/** The four live rules. They follow every keystroke, independent of when field errors show. */
export function PasswordRules({ control }: PasswordRulesProps) {
  const { t } = useTranslation('auth')
  const password = useWatch({ control, name: 'password' })
  const rules = passwordRules(password)
  const items = [
    { text: t('rules.minLength'), isMet: rules.hasMinLength },
    { text: t('rules.lowercase'), isMet: rules.hasLowercase },
    { text: t('rules.uppercase'), isMet: rules.hasUppercase },
    { text: t('rules.digit'), isMet: rules.hasDigit },
  ]

  return (
    <ul
      aria-label={t('rules.label')}
      className="grid grid-cols-2 gap-x-12 gap-y-4"
    >
      {items.map(({ text, isMet }) => (
        <li key={text} className="min-w-[0]">
          <PasswordRule
            text={text}
            isMet={isMet}
            stateLabel={isMet ? t('rules.met') : t('rules.notMet')}
          />
        </li>
      ))}
    </ul>
  )
}
